import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const MAX_LINES = 100;
const legacy = new Set(JSON.parse(readFileSync('eslint-legacy.json', 'utf8')));

function cssFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name).split('\\').join('/');
    if (entry.isDirectory()) return cssFiles(path);
    return path.endsWith('.css') ? [path] : [];
  });
}

const tooLong = cssFiles('src')
  .filter((file) => !legacy.has(file))
  .map((file) => ({ file, lines: readFileSync(file, 'utf8').replace(/\n$/, '').split('\n').length }))
  .filter(({ lines }) => lines > MAX_LINES);

for (const { file, lines } of tooLong) console.error(`${file}: ${lines} líneas (máximo ${MAX_LINES}).`);
if (tooLong.length > 0) process.exit(1);
