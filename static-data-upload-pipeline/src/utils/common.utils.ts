import * as slugify_ from 'slugify';
import { ApiSchema } from '../pipeline-steps/schema-validation/types';
import { existsSync, readFileSync, readdirSync } from 'fs';
import * as path from 'path';

export const gameIconsMap: Record<string, string> = {
  'the-bazaar': ':bazaarr:',
  'borderlands-4': ':bl4:',
  deadlock: ':deadlock:',
  'destiny-2': ':d2:',
  'diablo-4': ':d4:',
  'elden-ring-nightreign': ':er-nightreign:',
  'hades-2': ':hades2:',
  lol: ':league:',
  'marvel-rivals': ':rivals:',
  mhw: ':mhw:',
  'poe-2': ':poe2:',
  poe: ':poe-2:',
  zzz: ':zzzz:',
  'wow-forever': ':wowz:',
  'genshin-impact': ':genshin:',
  riftbound: ':riftbound:',
  'arknights-endfield': ':arknights-endfield:',
  marathon: ':marathon:',
  overwatch: ':overwatch:',
  'slay-the-spire-2': ':sts2:',
  'neverness-to-everness': ':nte:',
  tft: ':tft:',
  gamebase: ':newspaper:',
  dnd: ':dragon:',
};

// Keyed by the site URL slug, as in games/<abbr>/slug.txt - see describeGameEnv.
// Titles for games added after September 2025 are copied from availableGames in
// games/common/prod/game-config/config.json; icons are Slack emoji names, so add
// one only once the emoji exists in the workspace.
export const gameNamesMap: Record<string, string> = {
  'the-bazaar': 'The Bazaar',
  'borderlands-4': 'Borderlands 4',
  deadlock: 'Deadlock',
  'destiny-2': 'Destiny 2',
  'diablo-4': 'Diablo 4',
  'elden-ring-nightreign': 'Elden Ring Nightreign',
  'hades-2': 'Hades 2',
  lol: 'League of Legends',
  'marvel-rivals': 'Marvel Rivals',
  mhw: 'Monster Hunter Wilds',
  'poe-2': 'Path of Exile 2',
  poe: 'Path of Exile',
  zzz: 'ZZZ',
  tft: 'Teamfight Tactics',
  'wow-forever': 'World of Warcraft: Forever',
  marathon: 'Marathon',
  'slay-the-spire-2': 'Slay the Spire 2',
  overwatch: 'Overwatch',
  valorant: 'Valorant',
  'neverness-to-everness': 'Neverness to Everness',
  'arknights-endfield': 'Arknights: Endfield',
  '2xko': '2XKO',
  riftbound: 'Riftbound',
  'genshin-impact': 'Genshin Impact',
};

export const initSlugify = () =>
  slugify_.default.extend({
    '+': '-plus-',
    '-': '-',
    '—': '-',
    '‐': '-',
    '*': '-',
    '/': '-',
    '%': '-',
    '&': '-and-',
    '|': '-',
    '^': '-',
    '~': '-',
    '!': '-',
    '@': '-',
    '#': '-',
    $: '-',
    '(': '-',
    ')': '-',
    '[': '-',
    ']': '-',
    '{': '-',
    '}': '-',
    '<': '-',
    '>': '-',
    '=': '-',
    '?': '-',
    ':': '-',
    ';': '-',
    ',': '-',
    '.': '-',
    '"': '-',
    "'": '',
    '\\': '-',
    ' ': '-',
  });

export function slugify(value: string) {
  return slugify_
    .default(value, {
      replacement: '-', // replace spaces with replacement character, defaults to `-`
      remove: undefined, // remove characters that match regex, defaults to `undefined`
      lower: true, // convert to lower case, defaults to `false`
      strict: false, // strip special characters except replacement, defaults to `false`
      locale: 'vi', // language code of the locale to use
      trim: true, // trim leading and trailing replacement chars, defaults to `true`
    })
    .replace(/[-\u2012\u2013\u2014\u2015]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .replace(/-+/g, '-');
}

export function isImage(val: string, prefix: string = 'https://') {
  if (!val || val === '') return false;
  return (
    val.startsWith(prefix) &&
    (val.endsWith('.avif') ||
      val.endsWith('.svg') ||
      val.endsWith('.gif') ||
      val.endsWith('.png') ||
      val.endsWith('.jpg') ||
      val.endsWith('.jpeg') ||
      val.endsWith('.webp'))
  );
}

export function stringify(value: any) {
  if (value instanceof Object) {
    return JSON.stringify(value);
  }
  return String(value);
}

export function tryParse(value: string) {
  try {
    const result = JSON.parse(value);
    if (result && typeof result === 'number') {
      return result.toString();
    }

    return result;
  } catch {}
  return value;
}

// Schema validation functions
export function readSchema(schemaPath: string): ApiSchema | null {
  try {
    if (!existsSync(schemaPath)) {
      console.log(`⚠️ Schema file not found at: ${schemaPath}`);
      return null;
    }

    const schemaContent = readFileSync(schemaPath, 'utf8');
    return JSON.parse(schemaContent) as ApiSchema;
  } catch (error) {
    console.log(`❌ Error reading schema file: ${error}`);
    return null;
  }
}

/**
 * Pull the game slug and the environment out of a static data path.
 *
 * Two layouts are in use and they have different depths:
 *   games/<gameSlug>/<env>/static_data
 *   <gameSlug>/<env>/static_data          (moba-equipment, moba-farm, moba-achievement)
 *
 * Reading positionally from the front only works for the second one - it reported
 * every game as "games" and used the game slug as the environment, so the Slack
 * report never said which environment had actually run. Counting back from
 * `static_data` works for both.
 */
export function parseStaticDataPath(staticDataPath: string): { gameSlug: string; environment: string } {
  const segments = staticDataPath.split('/').filter(Boolean);
  const environment = segments[segments.length - 2] ?? '';
  const gameSlug = segments[segments.length - 3] ?? segments[0] ?? '';
  return { gameSlug, environment: environment.toUpperCase() };
}

/**
 * "<game name> <icon> <ENV>" for Slack headers and logs.
 *
 * The maps are keyed by the site URL slug, which stopped being the folder name when
 * games moved to games/<abbr>/ (d4, bl4, wowfor...). games/<abbr>/slug.txt maps one to
 * the other; it sits in the run's sparse checkout because cone mode materialises every
 * ancestor directory's files. moba-* layouts have no slug.txt and use the folder name.
 */
export function describeGameEnv(staticDataPath: string): string {
  const { gameSlug, environment } = parseStaticDataPath(staticDataPath);
  let slug = gameSlug;
  const gameDir = path.join(staticDataPath, '..', '..');
  if (gameDir !== '.') {
    try {
      slug = readFileSync(path.join(gameDir, 'slug.txt'), 'utf8').trim() || gameSlug;
    } catch {
      // No slug.txt - keep the folder name.
    }
  }
  return [gameNamesMap[slug] || slug, gameIconsMap[slug], environment].filter(Boolean).join(' ');
}

// static_data_v1.2.3.json -> [1, 2, 3]; null for anything else. No leading zeros:
// static_data_v0.010.json is a typo for 0.0.10, not a version, and must be rejected, not sorted.
export function versionOf(fileName: string): [number, number, number] | null {
  const m = fileName.match(/^static_data_v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)\.json$/);
  return m ? [+m[1], +m[2], +m[3]] : null;
}

export function compareVersions(a: [number, number, number], b: [number, number, number]): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

// The version files of a static data folder, oldest first, paths as they are on disk, plus the
// static_data_v* names that are not a version. Sorted on the parsed version: the previous
// pad-every-digit-run-by-10000 string sort rewrote the whole path on the way back (010 -> 10),
// so the pipeline then opened a file that did not exist.
export function selectVersionFiles(staticDataPath: string): { versions: string[]; malformed: string[] } {
  const found: { file: string; version: [number, number, number] }[] = [];
  const malformed: string[] = [];
  for (const filename of readdirSync(staticDataPath)) {
    const version = versionOf(filename);
    if (version) found.push({ file: path.join(staticDataPath, filename), version });
    else if (filename.startsWith('static_data_v')) malformed.push(filename);
  }
  found.sort((a, b) => compareVersions(a.version, b.version));
  return { versions: found.map(f => f.file), malformed };
}

// Repo-relative paths this push or pull request adds; a rename adds its new name.
// null when the run has no range to compare - a manual or a local run.
// shortcut: GitHub lists at most 300 changed files per comparison, a larger change slips past the check
export async function addedFiles(token: string): Promise<string[] | null> {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !existsSync(eventPath)) return null;
  const event = JSON.parse(readFileSync(eventPath, 'utf8'));
  const base = event.pull_request?.base?.sha ?? event.before;
  const head = event.pull_request?.head?.sha ?? event.after;
  // An all-zero `before` is a branch that did not exist yet
  if (!base || !head || /^0+$/.test(base)) return null;
  const api = process.env.GITHUB_API_URL ?? 'https://api.github.com';
  // per_page pages the commits only; the file list always comes whole on the first page
  const response = await fetch(`${api}/repos/${process.env.GITHUB_REPOSITORY}/compare/${base}...${head}?per_page=1`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) throw new Error(`GitHub compare ${base}...${head} answered ${response.status}`);
  const { files = [] } = (await response.json()) as { files?: { filename: string; status: string }[] };
  return files.filter(f => f.status === 'added' || f.status === 'renamed').map(f => f.filename);
}

// The version file a change adds that would not ship: the newest file in the folder is one the
// change did not add, so the added file is merged under it as history and the run still goes
// green (STD-1871). `versions` is the folder's version files, oldest first.
export function staleAddedVersion(added: string[], staticDataPath: string, versions: string[]): { added: string; newest: string } | null {
  const folder = path.posix.normalize(staticDataPath.replace(/\\/g, '/')).replace(/\/$/, '');
  const addedHere = new Set(added.filter(f => path.posix.dirname(f) === folder).map(f => path.posix.basename(f)));
  const names = versions.map(v => path.basename(v));
  const newest = names[names.length - 1];
  const addedVersions = names.filter(n => addedHere.has(n));
  if (addedVersions.length === 0 || addedHere.has(newest)) return null;
  return { added: addedVersions[addedVersions.length - 1], newest };
}

// gs://<bucket>/<dir>/<game folder>[/...]: at least two path segments under the bucket
export function isScopedAssetsFolder(folder: string): boolean {
  return /^gs:\/\/[^/]+(\/[^/]+){2,}\/?$/.test(folder);
}

/**
 * One-line, Slack-safe description of a thrown value, for "something went wrong" messages.
 * Slack treats <, > and & as markup, and a JSON.parse error on a large file can be long.
 */
export function describeError(error: unknown, maxLength = 300): string {
  const message = error instanceof Error ? error.message : String(error);
  const oneLine = message.replace(/\s+/g, ' ').trim();
  const short = oneLine.length > maxLength ? `${oneLine.slice(0, maxLength)}…` : oneLine;
  return short.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// The action's own README; a Slack failure line points at the section that explains the rule
export const DOCS_URL = 'https://github.com/mobalyticshq/actions/tree/main/static-data-upload-pipeline';
export const docsLink = (anchor: string) => `<${DOCS_URL}#${anchor}|Docs>`;
