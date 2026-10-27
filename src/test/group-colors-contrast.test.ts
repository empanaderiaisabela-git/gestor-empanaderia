import { readFileSync } from 'node:fs';
import { CanSoda, Pizza, Sandwich } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { Ciabatta } from '@/components/icons/ciabatta';
import { Empanada } from '@/components/icons/empanada';
import { GROUP_THEME } from '@/config/group-theme';
import { MENU_GROUPS } from '@/features/menu/domain/menu-groups';
import { AA_NORMAL_TEXT, contrast, cssToken } from './contrast';

const css = readFileSync(new URL('../app/group-colors.css', import.meta.url), 'utf8');
const globals = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

const LIGHT_TEXT = { 'zinc-900': '#18181b', 'zinc-600': '#52525b', 'amber-800': '#92400e' };
const DARK_TEXT = { 'zinc-100': '#f4f4f5', 'zinc-400': '#a1a1aa', 'amber-300': '#fcd34d' };

describe('colores de cada grupo (US-15 CA-1)', () => {
  it('globals.css importa los colores de los grupos', () => {
    expect(globals).toContain("@import './group-colors.css';");
  });

  it.each(MENU_GROUPS)('%s: los textos de la tarjeta cumplen AA en modo claro y en modo oscuro', (group) => {
    const { tone } = GROUP_THEME[group];
    for (const text of Object.values(LIGHT_TEXT)) expect(contrast(text, cssToken(css, `group-${tone}`))).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    for (const text of Object.values(DARK_TEXT)) expect(contrast(text, cssToken(css, `group-${tone}-dark`))).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it.each(MENU_GROUPS)('%s: la tarjeta usa el relleno y el borde del grupo, en claro y en oscuro', (group) => {
    const { tone, card } = GROUP_THEME[group];
    const tokens = [`group-${tone}`, `group-${tone}-edge`, `group-${tone}-dark`, `group-${tone}-dark-edge`];
    tokens.forEach((name) => expect(cssToken(css, name)).toMatch(/^#/));
    expect(card.split(' ').sort()).toEqual([`bg-group-${tone}`, `border-group-${tone}-edge`, `dark:bg-group-${tone}-dark`, `dark:border-group-${tone}-dark-edge`].sort());
  });

  it('cada grupo tiene su propio color', () => {
    expect(new Set(MENU_GROUPS.map((group) => cssToken(css, `group-${GROUP_THEME[group].tone}`))).size).toBe(MENU_GROUPS.length);
  });
});

describe('íconos de cada grupo (US-20)', () => {
  it('son los de lucide que pidió el dev, con los dibujos propios para empanadas y ciabattas', () => {
    expect(MENU_GROUPS.map((group) => [group, GROUP_THEME[group].icon])).toEqual([
      ['empanadas', Empanada],
      ['pizzas', Pizza],
      ['sanguches', Sandwich],
      ['ciabattas', Ciabatta],
      ['coca_cola', CanSoda],
      ['pepsi', CanSoda],
    ]);
  });
});
