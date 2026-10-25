import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

const ZINC = { 900: '#18181b', 950: '#09090b' } as const;
const WHITE = '#ffffff';
const AA_NORMAL_TEXT = 4.5;

function token(name: string): string {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`Falta el token --color-${name} en globals.css`);
  return match[1];
}

function channel(hex: string, offset: number): number {
  const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}

function contrast(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

describe('paleta de Empanadería Isabela (US-1 CA-2)', () => {
  it('define la escala brand completa y los colores ink y cream', () => {
    for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
      expect(token(`brand-${step}`)).toMatch(/^#/);
    }
    expect(token('ink')).toMatch(/^#/);
    expect(token('cream')).toMatch(/^#/);
  });

  it.each([
    { caso: 'texto blanco sobre botón brand-600', fg: () => WHITE, bg: () => token('brand-600') },
    { caso: 'texto brand-600 sobre blanco', fg: () => token('brand-600'), bg: () => WHITE },
    { caso: 'texto brand-600 sobre brand-50 (menú activo)', fg: () => token('brand-600'), bg: () => token('brand-50') },
    { caso: 'texto brand-700 sobre cream', fg: () => token('brand-700'), bg: () => token('cream') },
    { caso: 'texto brand-400 sobre zinc-900 (oscuro)', fg: () => token('brand-400'), bg: () => ZINC[900] },
    { caso: 'texto brand-400 sobre zinc-950 (oscuro)', fg: () => token('brand-400'), bg: () => ZINC[950] },
    { caso: 'texto ink sobre brand-500 (acento dorado)', fg: () => token('ink'), bg: () => token('brand-500') },
  ])('$caso cumple AA (≥ 4.5:1)', ({ fg, bg }) => {
    expect(contrast(fg(), bg())).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it('calcula bien el contraste de referencia (negro sobre blanco = 21:1)', () => {
    expect(contrast('#000000', WHITE)).toBeCloseTo(21, 5);
  });
});
