import { z } from 'zod';
import type { MenuGroup } from './menu-groups';

export const DRINK_GROUPS = ['coca_cola', 'pepsi'] as const satisfies readonly MenuGroup[];
export const isDrinkGroup = (group: MenuGroup): boolean => DRINK_GROUPS.some((drink) => drink === group);

export type DrinkFields = { drinkName: string; size: string; flavor: string | null };
export type FamilyRow = { group: MenuGroup; drinkName: string | null; drinkSize: string | null; liters: string | number | null };

const MAX_TEXT = 25;
const MAX_SIZE = 8;

export const drinkName = z.string('La bebida es obligatoria').trim().min(1, 'La bebida es obligatoria').max(MAX_TEXT, `La bebida no puede superar los ${MAX_TEXT} caracteres`);
export const size = z
  .string('Ingresá los litros')
  .trim()
  .min(1, 'Ingresá los litros')
  .max(MAX_SIZE, `Los litros no pueden superar los ${MAX_SIZE} caracteres`)
  .transform((value) => value.replace(',', '.'));
export const flavor = z
  .string()
  .trim()
  .max(MAX_TEXT, `El sabor no puede superar los ${MAX_TEXT} caracteres`)
  .nullable()
  .transform((value) => value || null);

export const sizeOf = ({ drinkSize, liters }: Pick<FamilyRow, 'drinkSize' | 'liters'>): string | null =>
  drinkSize ?? (liters === null ? null : `${Number(liters)} L`);

export function drinkNameOf({ drinkName: name, size: amount, flavor: taste }: DrinkFields): string {
  return [name, amount, taste].filter(Boolean).join(' ');
}

export function sameFamily(a: FamilyRow, b: FamilyRow): boolean {
  const amount = sizeOf(a);
  return a.drinkName !== null && amount !== null && a.group === b.group && a.drinkName === b.drinkName && amount === sizeOf(b);
}

export function familySourceOf<T extends FamilyRow & { price1: number | null }>(item: T, items: readonly T[]): T | null {
  if (item.price1 !== null) return item;
  return items.find((other) => other.price1 !== null && sameFamily(other, item)) ?? null;
}
