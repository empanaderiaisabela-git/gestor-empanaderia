import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('..', import.meta.url));
const CODE = /\.(ts|tsx|css|mjs)$/;
const SKIPPED = [/\.test\.tsx?$/, /^lib[\\/]db[\\/]migrations[\\/]/];
const WORDS = [/ArgenStock/, /iPhone/, /Apple(?! Color Emoji)/, /accesorio/i, /celular/i, /equipo/i];

function codeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? codeFiles(path) : [path];
  });
}

function findings(): string[] {
  const files = codeFiles(SRC)
    .map((path) => relative(SRC, path))
    .filter((path) => CODE.test(path) && !SKIPPED.some((skip) => skip.test(path)));
  return files.flatMap((path) => {
    const text = readFileSync(join(SRC, path), 'utf8');
    return WORDS.filter((word) => word.test(text)).map((word) => `${path.split(sep).join('/')}: ${word.source}`);
  });
}

describe('guarda: sin restos de la casa de celulares (T-12 CA-5)', () => {
  it('el código de src/ no nombra la marca, los equipos ni los accesorios viejos', () => {
    expect(findings()).toEqual([]);
  });

  it('la guarda encuentra lo que busca (control)', () => {
    expect(WORDS.map((word) => word.test('Equipo iPhone de ArgenStock con accesorio para celular de Apple'))).toEqual(WORDS.map(() => true));
    expect(WORDS.some((word) => word.test("'Apple Color Emoji', empanadas y pizzas"))).toBe(false);
  });
});
