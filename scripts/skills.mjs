import { cpSync, existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';

const SOURCE = '.agents/skills';
const TARGET = '.claude/skills';

function listFiles(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(root, join(entry.parentPath, entry.name)).replaceAll('\\', '/'))
    .sort();
}

function sameContent(file) {
  return readFileSync(join(SOURCE, file)).equals(readFileSync(join(TARGET, file)));
}

function findDifferences() {
  const sourceFiles = listFiles(SOURCE);
  const targetFiles = new Set(listFiles(TARGET));
  const sourceSet = new Set(sourceFiles);
  return [
    ...sourceFiles.filter((file) => !targetFiles.has(file)).map((file) => `falta en ${TARGET}: ${file}`),
    ...[...targetFiles].filter((file) => !sourceSet.has(file)).map((file) => `sobra en ${TARGET}: ${file}`),
    ...sourceFiles.filter((file) => targetFiles.has(file) && !sameContent(file)).map((file) => `distinto: ${file}`),
  ];
}

function sync() {
  if (!existsSync(SOURCE)) {
    console.error(`No existe ${SOURCE}.`);
    process.exitCode = 1;
    return;
  }
  rmSync(TARGET, { recursive: true, force: true });
  cpSync(SOURCE, TARGET, { recursive: true });
  console.log(`Skills copiadas de ${SOURCE} a ${TARGET}.`);
}

function check() {
  const differences = findDifferences();
  if (differences.length === 0) {
    console.log(`${SOURCE} y ${TARGET} son idénticas.`);
    return;
  }
  console.error(differences.join('\n'));
  console.error('Corré `npm run skills:sync`.');
  process.exitCode = 1;
}

const commands = { sync, check };
const command = commands[process.argv[2]];

if (command) {
  command();
} else {
  console.error('Uso: node scripts/skills.mjs <sync|check>');
  process.exitCode = 1;
}
