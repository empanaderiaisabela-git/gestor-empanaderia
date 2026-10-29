import { PRICE_FIELDS, type PriceField, priceFieldsOf } from '@/features/menu/domain/menu-groups';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { type StockEntryInput, stockEntrySchema, type StockLossInput, stockLossSchema, type StockPricingInput, stockPricingSchema } from '@/features/stock/domain/stock.schema';

export type PriceTexts = Record<PriceField, string>;
export type EntryValues = PriceTexts & { category: string; menuItemId: string; quantity: string; unitCost: string; providerId: string };
export type PricingValues = PriceTexts & { unitCost: string; applyToGroup: boolean };
export type LossValues = { quantity: string; reason: string };
export type FormErrors = Partial<Record<string, string>>;
export type Parsed<T> = { ok: true; input: T } | { ok: false; errors: FormErrors };

type Issue = { path: PropertyKey[]; message: string };

const toNumber = (text: string): number => (text.trim() === '' ? Number.NaN : Number(text.replace(',', '.')));
const textOf = (value: number | null | undefined): string => (value === null || value === undefined ? '' : String(value));

function errorsOf(issues: readonly Issue[]): FormErrors {
  const errors: FormErrors = {};
  for (const { path, message } of issues) {
    const key = String((path[0] === 'prices' ? path[1] : path[0]) ?? 'form');
    errors[key] ??= message;
  }
  return errors;
}

function pricesOf(values: EntryValues): Record<string, number> | undefined {
  const filled = PRICE_FIELDS.filter((field) => values[field].trim() !== '');
  return filled.length === 0 ? undefined : Object.fromEntries(filled.map((field) => [field, toNumber(values[field])]));
}

export function parseEntry(values: EntryValues): Parsed<StockEntryInput> {
  const costs = { unitCost: values.unitCost.trim() === '' ? undefined : toNumber(values.unitCost), providerId: values.providerId || null, prices: pricesOf(values) };
  const result = stockEntrySchema.safeParse({ menuItemId: values.menuItemId, quantity: toNumber(values.quantity), ...costs });
  return result.success ? { ok: true, input: result.data } : { ok: false, errors: errorsOf(result.error.issues) };
}

export function parseLoss(menuItemId: string, values: LossValues): Parsed<StockLossInput> {
  const result = stockLossSchema.safeParse({ menuItemId, quantity: toNumber(values.quantity), reason: values.reason });
  return result.success ? { ok: true, input: result.data } : { ok: false, errors: errorsOf(result.error.issues) };
}

export function pricingValuesOf(item: MenuItemDef | null): PricingValues {
  return { unitCost: textOf(item?.unitCost), price1: textOf(item?.price1), price3: textOf(item?.price3), price6: textOf(item?.price6), price12: textOf(item?.price12), applyToGroup: false };
}

export function parsePricing(item: MenuItemDef, values: PricingValues): Parsed<StockPricingInput> {
  const prices = Object.fromEntries(priceFieldsOf(item.group).map((field) => [field, toNumber(values[field])]));
  const result = stockPricingSchema.safeParse({ menuItemId: item.id, version: item.version, unitCost: toNumber(values.unitCost), prices, applyToGroup: values.applyToGroup });
  return result.success ? { ok: true, input: result.data } : { ok: false, errors: errorsOf(result.error.issues) };
}
