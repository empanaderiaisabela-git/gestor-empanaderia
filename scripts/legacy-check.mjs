import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const LIST = 'eslint-legacy.json';

function listAt(ref) {
  if (!ref || /^0+$/.test(ref)) return null;
  try {
    const content = execFileSync('git', ['show', `${ref}:${LIST}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function fail(title, files) {
  console.error(`${title}:\n${files.map((file) => `  - ${file}`).join('\n')}`);
  process.exitCode = 1;
}

const current = JSON.parse(readFileSync(LIST, 'utf8'));
const duplicated = current.filter((file, index) => current.indexOf(file) !== index);
const stale = current.filter((file) => !existsSync(file));
const base = listAt(process.argv[2]);
const added = base === null ? [] : current.filter((file) => !base.includes(file));

if (duplicated.length > 0) fail('Entradas repetidas en eslint-legacy.json', duplicated);
if (stale.length > 0) fail('Entradas de archivos que ya no existen (sacalas de eslint-legacy.json)', stale);
if (added.length > 0) fail('La lista legacy sólo se achica: no se agregan archivos', added);
if (base === null) console.log(`Sin versión anterior de ${LIST} para comparar (${process.argv[2] ?? 'sin ref'}).`);
if (process.exitCode !== 1) console.log(`${LIST}: ${current.length} archivos heredados, ninguno nuevo.`);
