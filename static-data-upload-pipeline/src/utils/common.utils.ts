import * as slugify_ from 'slugify';
import { ApiSchema } from '../pipeline-steps/schema-validation/types';
import { existsSync, readFileSync } from 'fs';
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
