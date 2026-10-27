import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GROUP_THEME } from '@/config/group-theme';
import { PAYMENT_THEME } from '@/config/stat-theme';
import { MENU_GROUPS } from '@/features/menu/domain/menu-groups';
import { PAYMENT_TYPES } from '@/features/order/domain/order-validation';
import { AA_NON_TEXT, AA_NORMAL_TEXT, contrast, cssToken } from './contrast';

const read = (name: string): string => readFileSync(new URL(`../app/${name}`, import.meta.url), 'utf8');
const groups = read('group-colors.css');
const stats = read('stat-colors.css');
const PAGE = { light: '#ffffff', dark: '#18181b' };
const STATS = ['promos', 'profit', 'sales'];

describe('colores de Estadísticas (US-21 CA-3)', () => {
  it('globals.css importa los colores de las estadísticas', () => {
    expect(read('globals.css')).toContain("@import './stat-colors.css';");
  });

  it.each(PAYMENT_TYPES)('%s: el texto sobre el fondo de color cumple AA en claro y en oscuro', (type) => {
    expect(contrast(cssToken(stats, `pay-${type}-ink`), cssToken(stats, `pay-${type}`))).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    expect(contrast(cssToken(stats, `pay-${type}-dark-ink`), cssToken(stats, `pay-${type}-dark`))).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it.each(PAYMENT_TYPES)('%s: el borde se distingue de la página, en claro y en oscuro', (type) => {
    expect(contrast(cssToken(stats, `pay-${type}-accent`), PAGE.light)).toBeGreaterThanOrEqual(AA_NON_TEXT);
    expect(contrast(cssToken(stats, `pay-${type}-dark-accent`), PAGE.dark)).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it.each(STATS)('%s: el borde y el ícono cumplen 3:1, en claro y en oscuro', (tone) => {
    expect(contrast(cssToken(stats, `stat-${tone}-accent`), PAGE.light)).toBeGreaterThanOrEqual(AA_NON_TEXT);
    expect(contrast(cssToken(stats, `stat-${tone}-dark-accent`), PAGE.dark)).toBeGreaterThanOrEqual(AA_NON_TEXT);
    expect(contrast(cssToken(stats, `stat-${tone}-accent`), cssToken(stats, `stat-${tone}`))).toBeGreaterThanOrEqual(AA_NON_TEXT);
    expect(contrast(cssToken(stats, `stat-${tone}-dark-accent`), cssToken(stats, `stat-${tone}-dark`))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it.each(MENU_GROUPS)('%s: el borde y el ícono cumplen 3:1, en claro y en oscuro', (group) => {
    const { tone } = GROUP_THEME[group];
    expect(contrast(cssToken(groups, `group-${tone}-accent`), PAGE.light)).toBeGreaterThanOrEqual(AA_NON_TEXT);
    expect(contrast(cssToken(groups, `group-${tone}-dark-accent`), PAGE.dark)).toBeGreaterThanOrEqual(AA_NON_TEXT);
    expect(contrast(cssToken(groups, `group-${tone}-accent`), cssToken(groups, `group-${tone}`))).toBeGreaterThanOrEqual(AA_NON_TEXT);
    expect(contrast(cssToken(groups, `group-${tone}-dark-accent`), cssToken(groups, `group-${tone}-dark`))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it('cada medio de pago tiene su propio ícono y su propio fondo', () => {
    expect(new Set(PAYMENT_TYPES.map((type) => PAYMENT_THEME[type].icon)).size).toBe(4);
    expect(new Set(PAYMENT_TYPES.map((type) => cssToken(stats, `pay-${type}`))).size).toBe(4);
  });
});
