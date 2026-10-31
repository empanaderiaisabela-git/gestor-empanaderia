import { z } from 'zod';
import type { MenuGroup } from './menu-groups';

export const DRINK_GROUPS = ['coca_cola', 'pepsi'] as const satisfies readonly MenuGroup[];
export const isDrinkGroup = (group: MenuGroup): boolean => DRINK_GROUPS.some((drink) => drink === group);

export type DrinkFields = { drinkName: string; liters: number; flavor: string | null };
type FamilyMember = { group: MenuGroup; drinkName: string | null; liters: number | null };

const MAX_TEXT = 25;
const thousandths = (value: number): boolean => Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-6;

export const drinkName = z.string('La bebida es obligatoria').trim().min(1, 'La bebida es obligatoria').max(MAX_TEXT, `La bebida no puede superar los ${MAX_TEXT} caracteres`);
export const liters = z.number('Ingresá los litros').positive('Los litros deben ser mayores a 0').max(10, 'Demasiados litros').refine(thousandths, 'Hasta 3 decimales');
export const flavor = z
  .string()
  .trim()
  .max(MAX_TEXT, `El sabor no puede superar los ${MAX_TEXT} caracteres`)
  .nullable()
  .transform((value) => value || null);

export const litersText = (value: number): string => `${value} L`;

export function drinkNameOf({ drinkName: name, liters: amount, flavor: taste }: DrinkFields): string {
  return [name, litersText(amount), taste].filter(Boolean).join(' ');
}

export function sameFamily(a: FamilyMember, b: FamilyMember): boolean {
  if (a.drinkName === null || b.drinkName === null || a.liters === null || b.liters === null) return false;
  return a.group === b.group && a.drinkName.toLocaleLowerCase('es') === b.drinkName.toLocaleLowerCase('es') && a.liters === b.liters;
}

export function familySourceOf<T extends FamilyMember & { price1: number | null }>(item: T, items: readonly T[]): T | null {
  if (item.price1 !== null) return item;
  return items.find((other) => other.price1 !== null && sameFamily(other, item)) ?? null;
}

export const parseLiters = (text: string): number => (text.trim() === '' ? Number.NaN : Number(text.replace(',', '.')));
