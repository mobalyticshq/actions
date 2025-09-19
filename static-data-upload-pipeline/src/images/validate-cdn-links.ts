import { setTimeout as delay } from 'node:timers/promises';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';

const assetSizeLimit = 10 * 1024 * 1024; // пример: 10MB
const DEFAULT_CONCURRENCY = 32; // начни с 32; при 429/503 можно снизить до 16
const MAX_RETRIES = 5;
const REQ_TIMEOUT_MS = 10_000;

// Keep-Alive агенты (очень помогает против лимитов на соединения)
const httpAgent = new HttpAgent({ keepAlive: true, maxSockets: 128 });
const httpsAgent = new HttpsAgent({ keepAlive: true, maxSockets: 128 });

type ValidationEntityReport = {
  errors: Record<string, Set<string>>;
};
enum ReportMessages {
  assetTooBig = 'assetTooBig',
  assetURLNotAvailable = 'assetURLNotAvailable',
}
type ReportItem = { report: ValidationEntityReport; path: string };

function parseRetryAfter(h: string | null): number | null {
  if (!h) return null;
  const sec = Number(h);
  if (!Number.isNaN(sec)) return Math.max(0, sec) * 1000;
  const when = Date.parse(h);
  if (!Number.isNaN(when)) return Math.max(0, when - Date.now());
  return null;
}

function isTransientStatus(status: number) {
  return status === 429 || status === 503 || (status >= 520 && status <= 524);
}
function isTransientError(err: any) {
  const code = err?.code || err?.cause?.code;
  const transientCodes = new Set([
    'ETIMEDOUT',
    'ECONNRESET',
    'EAI_AGAIN',
    'ECONNABORTED',
    'UND_ERR_REQUEST_TIMEOUT',
    'FETCH_ERROR',
  ]);
  return transientCodes.has(code);
}

function backoffDelay(attempt: number): number {
  // экспоненциальный backoff с джиттером
  const base = Math.min(30_000, 2 ** attempt * 250); // 250ms, 500ms, 1s, 2s, 4s, 8s, 16s, 30s cap
  const jitter = Math.random() * 0.4 + 0.8; // 0.8x–1.2x
  return Math.floor(base * jitter);
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), REQ_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      // @ts-ignore - Node fetch понимает агенты так
      agent: (u: any) => (u.protocol === 'http:' ? httpAgent : httpsAgent),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

async function headOrRangeFetch(url: string): Promise<Response> {
  // 1) Пытаемся HEAD
  let res = await fetchWithTimeout(url, { method: 'HEAD' });
  if (res.status === 405 || res.status === 501) {
    // сервер не любит HEAD — пробуем минимальный GET с Range
    res = await fetchWithTimeout(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
    });
  }
  return res;
}

async function fetchRetry(url: string): Promise<Response> {
  let lastErr: any;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await headOrRangeFetch(url);

      if (res.ok) return res;

      if (isTransientStatus(res.status)) {
        const ra = parseRetryAfter(res.headers.get('retry-after'));
        await delay(ra ?? backoffDelay(attempt));
        continue;
      }

      // постоянная ошибка (404/400/403/500 без надежды) — не мучаем
      return res;
    } catch (err: any) {
      lastErr = err;
      if (isTransientError(err) || err?.name === 'AbortError') {
        await delay(backoffDelay(attempt));
        continue;
      }
      throw err;
    }
  }
  // если все попытки провалились — бросаем последнюю ошибку
  throw lastErr ?? new Error('Unknown fetch error');
}

// Простейший семафор
function createSemaphore(max: number) {
  let active = 0;
  const q: (() => void)[] = [];
  const acquire = async () => {
    if (active < max) {
      active++;
      return;
    }
    await new Promise<void>(r => q.push(r));
    active++;
  };
  const release = () => {
    active--;
    const next = q.shift();
    if (next) next();
  };
  return { acquire, release };
}

export async function validateCDNLinks(
  items: { url: string; report: ValidationEntityReport; path: string }[],
  opts?: { concurrency?: number },
) {
  const concurrency = Math.max(1, opts?.concurrency ?? DEFAULT_CONCURRENCY);
  const sem = createSemaphore(concurrency);

  // Дедуп по URL, чтобы не дергать один и тот же адрес много раз
  const cache = new Map<string, Promise<Response | 'error'>>();

  const tasks = items.map(async ({ url, report, path }) => {
    await sem.acquire();
    try {
      let p = cache.get(url);
      if (!p) {
        p = (async () => {
          try {
            return await fetchRetry(url);
          } catch {
            return 'error';
          }
        })();
        cache.set(url, p);
      }
      const res = await p;

      if (res === 'error') {
        report.errors[ReportMessages.assetURLNotAvailable].add(path);
        return;
      }

      if (!res.ok) {
        report.errors[ReportMessages.assetURLNotAvailable].add(path);
        return;
      }

      const lenHeader =
        res.headers.get('content-length') ??
        // при GET Range=0-0 сервер может вернуть Content-Range: bytes 0-0/123456
        res.headers.get('content-range')?.split('/')?.[1] ??
        null;

      const length = Number(lenHeader);
      if (!Number.isNaN(length) && length > assetSizeLimit) {
        report.errors[ReportMessages.assetTooBig].add(path);
      }
    } finally {
      sem.release();
    }
  });

  await Promise.all(tasks);
}
