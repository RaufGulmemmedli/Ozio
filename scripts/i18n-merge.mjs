#!/usr/bin/env node
/**
 * Merges `messages/parts/<group>.json` into `messages/{az,ru,en}.json`.
 *
 * Part file shape (per-key triplets, so a missing translation is obvious):
 *   { "empty.title": { "az": "…", "ru": "…", "en": "…" } }
 *
 * The file's basename becomes the namespace, and dotted keys are nested into
 * objects so `useTranslations('cart')` + `t('empty.title')` resolves.
 *
 *   node scripts/i18n-merge.mjs            # write messages/{az,ru,en}.json
 *   node scripts/i18n-merge.mjs --check    # validate only, exit 1 on problems
 *
 * Plain Node ESM, no dependencies.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const LOCALES = ['az', 'ru', 'en'];
const REFERENCE_LOCALE = 'az';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PARTS_DIR = join(ROOT, 'messages', 'parts');
const OUT_DIR = join(ROOT, 'messages');

const checkOnly = process.argv.includes('--check');

const errors = [];
const warnings = [];

const error = (where, message) => errors.push(`${where}: ${message}`);
const warn = (where, message) => warnings.push(`${where}: ${message}`);

/**
 * ICU argument names, parsed as ICU rather than pattern-matched.
 *
 * `{count, plural, one {Cart, # item} other {Cart, # items}}` yields exactly
 * {"count"}. A naive /\{\s*(\w+)\s*[,}]/ reads "Cart" as a second argument,
 * because a plural BRANCH BODY is also wrapped in braces — which then makes
 * two locales look like they carry different placeholders and fails the check
 * on perfectly valid copy.
 */
function placeholders(message) {
  const found = new Set();
  const SUBMESSAGE_TYPES = new Set(['plural', 'select', 'selectordinal']);

  /** ICU apostrophe escaping: `''` is a literal `'`, `'{'` quotes a brace. */
  const skipQuoted = (i) => {
    if (message[i + 1] === "'") return i + 2;
    if (message[i + 1] === '{' || message[i + 1] === '}') {
      const end = message.indexOf("'", i + 2);
      return end === -1 ? message.length : end + 1;
    }
    return i + 1;
  };

  /** Skip the rest of an argument whose type we do not need to walk into. */
  const skipToClose = (start) => {
    let i = start;
    let depth = 1;
    while (i < message.length && depth > 0) {
      if (message[i] === "'") {
        i = skipQuoted(i);
        continue;
      }
      if (message[i] === '{') depth += 1;
      else if (message[i] === '}') depth -= 1;
      i += 1;
    }
    return i;
  };

  /** Parse a message body; stops at the `}` closing the enclosing branch. */
  const parseMessage = (start, top = false) => {
    let i = start;
    while (i < message.length) {
      const char = message[i];
      if (char === '}') {
        if (!top) return i;
        i += 1; // stray `}` at top level — braceError() reports it separately
        continue;
      }
      if (char === "'") {
        i = skipQuoted(i);
        continue;
      }
      if (char !== '{') {
        i += 1;
        continue;
      }
      i = parseArgument(i);
    }
    return i;
  };

  /** Parse `{name}`, `{name, type, …}` or `{name, plural, sel {msg} …}`. */
  const parseArgument = (start) => {
    let i = start + 1;
    while (i < message.length && /\s/.test(message[i])) i += 1;
    let name = '';
    while (i < message.length && /[A-Za-z0-9_]/.test(message[i])) {
      name += message[i];
      i += 1;
    }
    while (i < message.length && /\s/.test(message[i])) i += 1;
    if (name) found.add(name);

    if (message[i] === '}') return i + 1;
    if (message[i] !== ',') return skipToClose(i);

    i += 1;
    while (i < message.length && /\s/.test(message[i])) i += 1;
    let type = '';
    while (i < message.length && /[A-Za-z]/.test(message[i])) {
      type += message[i];
      i += 1;
    }
    if (!SUBMESSAGE_TYPES.has(type.toLowerCase())) return skipToClose(i);

    // plural / select / selectordinal: walk the `selector {submessage}` pairs,
    // parsing each body as a message so nested arguments are still collected.
    while (i < message.length && message[i] !== '}') {
      if (message[i] === '{') {
        i = parseMessage(i + 1);
        if (message[i] === '}') i += 1;
      } else {
        i += 1;
      }
    }
    return i + 1;
  };

  parseMessage(0, true);
  return found;
}

/** Unbalanced or inverted braces make next-intl throw at render time. */
function braceError(message) {
  let depth = 0;
  for (const char of message) {
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth < 0) return 'unexpected "}"';
    }
  }
  return depth > 0 ? `${depth} unclosed "{"` : null;
}

/** Writes `a.b.c` into nested objects, refusing to overwrite a string or a branch. */
function setNested(target, dottedKey, value, where) {
  const segments = dottedKey.split('.');
  let node = target;

  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    const existing = node[segment];
    if (existing === undefined) {
      node[segment] = {};
    } else if (typeof existing !== 'object') {
      error(where, `"${dottedKey}" collides with "${segments.slice(0, i + 1).join('.')}" (a string)`);
      return;
    }
    node = node[segment];
  }

  const last = segments[segments.length - 1];
  if (typeof node[last] === 'object' && node[last] !== null) {
    error(where, `"${dottedKey}" collides with a group of nested keys of the same name`);
    return;
  }
  if (node[last] !== undefined) {
    error(where, `"${dottedKey}" is defined twice`);
    return;
  }
  node[last] = value;
}

function sortDeep(value) {
  if (typeof value !== 'object' || value === null) return value;
  const sorted = {};
  for (const key of Object.keys(value).sort((a, b) => a.localeCompare(b, 'en'))) {
    sorted[key] = sortDeep(value[key]);
  }
  return sorted;
}

async function main() {
  let fileNames;
  try {
    fileNames = (await readdir(PARTS_DIR)).filter((name) => name.endsWith('.json')).sort();
  } catch {
    console.error(`i18n: no parts directory at ${PARTS_DIR}`);
    process.exit(1);
  }

  if (fileNames.length === 0) {
    console.error(`i18n: ${PARTS_DIR} holds no *.json part files`);
    process.exit(1);
  }

  /** locale → { group → nested messages } */
  const bundles = Object.fromEntries(LOCALES.map((locale) => [locale, {}]));
  const perGroupKeyCount = [];
  let totalKeys = 0;

  for (const fileName of fileNames) {
    const group = fileName.slice(0, -'.json'.length);
    const where = `messages/parts/${fileName}`;

    if (!/^[a-z][a-z0-9_]*$/.test(group)) {
      error(where, `group name "${group}" must be lower_snake_case`);
    }

    let part;
    try {
      part = JSON.parse(await readFile(join(PARTS_DIR, fileName), 'utf8'));
    } catch (cause) {
      error(where, `invalid JSON — ${cause.message}`);
      continue;
    }

    if (typeof part !== 'object' || part === null || Array.isArray(part)) {
      error(where, 'must be a JSON object of key → { az, ru, en }');
      continue;
    }

    const groupBundles = Object.fromEntries(LOCALES.map((locale) => [locale, {}]));
    const keys = Object.keys(part);

    for (const key of keys) {
      const triplet = part[key];
      const keyWhere = `${where} → ${group}.${key}`;

      if (typeof triplet !== 'object' || triplet === null || Array.isArray(triplet)) {
        error(keyWhere, 'value must be an object { az, ru, en }');
        continue;
      }

      for (const locale of Object.keys(triplet)) {
        if (!LOCALES.includes(locale)) {
          error(keyWhere, `unknown locale "${locale}" (expected ${LOCALES.join(', ')})`);
        }
      }

      const resolved = {};
      for (const locale of LOCALES) {
        const value = triplet[locale];
        if (typeof value !== 'string' || value.trim() === '') {
          error(keyWhere, `missing "${locale}" translation`);
          continue;
        }
        if (/\bTODO\b/.test(value)) {
          error(keyWhere, `"${locale}" still contains placeholder text (TODO)`);
        }
        const brace = braceError(value);
        if (brace) {
          error(keyWhere, `"${locale}" has broken ICU braces — ${brace}`);
          continue;
        }
        resolved[locale] = value;
      }

      const reference = resolved[REFERENCE_LOCALE];
      if (reference !== undefined) {
        const referenceArgs = placeholders(reference);
        for (const locale of LOCALES) {
          if (locale === REFERENCE_LOCALE || resolved[locale] === undefined) continue;
          const args = placeholders(resolved[locale]);
          const missing = [...referenceArgs].filter((name) => !args.has(name));
          const extra = [...args].filter((name) => !referenceArgs.has(name));
          if (missing.length > 0 || extra.length > 0) {
            error(
              keyWhere,
              `"${locale}" placeholders differ from "${REFERENCE_LOCALE}"` +
                (missing.length > 0 ? ` — missing {${missing.join('}, {')}}` : '') +
                (extra.length > 0 ? ` — unexpected {${extra.join('}, {')}}` : ''),
            );
          }
        }
        if (/\bplural\b/.test(reference) && resolved.ru !== undefined) {
          const hasRuForms = /\bfew\s*\{/.test(resolved.ru) && /\bmany\s*\{/.test(resolved.ru);
          if (!hasRuForms) {
            warn(keyWhere, 'ru plural should spell out one / few / many / other');
          }
        }
      }

      for (const locale of LOCALES) {
        if (resolved[locale] === undefined) continue;
        setNested(groupBundles[locale], key, resolved[locale], keyWhere);
      }
    }

    for (const locale of LOCALES) {
      if (bundles[locale][group] !== undefined) {
        error(where, `group "${group}" is already defined by another part file`);
      }
      bundles[locale][group] = groupBundles[locale];
    }

    perGroupKeyCount.push([group, keys.length]);
    totalKeys += keys.length;
  }

  // ---- report -------------------------------------------------------------

  const countLeaves = (node) =>
    Object.values(node).reduce(
      (sum, value) => sum + (typeof value === 'object' && value !== null ? countLeaves(value) : 1),
      0,
    );

  console.log(`i18n: ${perGroupKeyCount.length} groups, ${totalKeys} keys`);
  for (const [group, count] of perGroupKeyCount) {
    console.log(`  ${group.padEnd(24)} ${count} keys`);
  }
  for (const locale of LOCALES) {
    console.log(`  ${locale}: ${countLeaves(bundles[locale])} strings`);
  }

  // The same structural problem is reported once per locale — show it once.
  const uniqueWarnings = [...new Set(warnings)];
  const uniqueErrors = [...new Set(errors)];

  if (uniqueWarnings.length > 0) {
    console.warn(`\ni18n: ${uniqueWarnings.length} warning(s)`);
    for (const message of uniqueWarnings) console.warn(`  ! ${message}`);
  }

  if (uniqueErrors.length > 0) {
    console.error(`\ni18n: ${uniqueErrors.length} problem(s)`);
    for (const message of uniqueErrors) console.error(`  × ${message}`);
    if (checkOnly) process.exit(1);
    console.error('\ni18n: refusing to write incomplete message files');
    process.exit(1);
  }

  if (checkOnly) {
    console.log('\ni18n: check passed');
    return;
  }

  for (const locale of LOCALES) {
    const target = join(OUT_DIR, `${locale}.json`);
    await writeFile(target, `${JSON.stringify(sortDeep(bundles[locale]), null, 2)}\n`, 'utf8');
    console.log(`  wrote messages/${locale}.json`);
  }
  console.log('\ni18n: generated — do not hand-edit messages/{az,ru,en}.json');
}

await main();
