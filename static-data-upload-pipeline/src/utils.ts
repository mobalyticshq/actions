import * as slugify_ from 'slugify';

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
};

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
    return JSON.parse(value);
  } catch {}
  return value;
}
