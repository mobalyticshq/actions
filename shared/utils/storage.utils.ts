import { Storage } from '@google-cloud/storage';
import { GoogleAuth } from 'google-auth-library';
import { Gaxios } from 'gaxios';

/**
 * Scopes that `@google-cloud/storage` requests for its own auth client. We must
 * replicate them here because we provide a custom `authClient` (see below).
 */
const STORAGE_SCOPES = [
  'https://www.googleapis.com/auth/iam',
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/devstorage.full_control',
];

/**
 * Creates a GCS Storage client whose **auth/token** requests go through Node's
 * native `fetch` (undici) instead of `node-fetch`.
 *
 * Why: `@google-cloud/storage@7` pins `google-auth-library@9`, which ships
 * `gaxios@6`. gaxios 6 always uses `node-fetch` in Node (it only picks the
 * native fetch when a browser `window.fetch` exists). `node-fetch` fails against
 * the Google OAuth token endpoint with `Invalid response body while trying to
 * fetch https://www.googleapis.com/oauth2/v4/token: Premature close`, whereas
 * the native fetch works (verified). By giving the auth client a Gaxios
 * transporter with `fetchImplementation` set to the native fetch, gtoken/JWT
 * mint tokens via undici and the failure disappears.
 *
 * Only token requests use this transporter; object up/downloads keep their own
 * transport, so response-stream semantics are unaffected.
 */
export function createStorage(projectId: string): Storage {
  const authClient = new GoogleAuth({
    projectId,
    scopes: STORAGE_SCOPES,
    clientOptions: {
      transporter: new Gaxios({ fetchImplementation: globalThis.fetch as never }),
    },
  });

  return new Storage({
    projectId,
    authClient,
    retryOptions: { autoRetry: true, maxRetries: 5, totalTimeout: 120 },
  });
}
