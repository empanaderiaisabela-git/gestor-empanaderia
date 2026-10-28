import { GROUP_PRICED, PRICE_FIELDS } from '@/features/menu/domain/menu-groups';
import { type StockEntryInput, stockEntrySchema, type StockLossInput, stockLossSchema } from '@/features/stock/domain/stock.schema';

export type EntryValues = { group: string; menuItemId: string; quantity: string; unitCost: string; providerId: string; price1: string; price3: string; price6: string; price12: string };
export type LossValues = { quantity: string; reason: string };
export type FormErrors = Partial<Record<string, string>>;
export type Parsed<T> = { ok: true; input: T } | { ok: false; errors: FormErrors };

type Issue = { path: PropertyKey[]; message: string };

const toNumber = (text: string): number => (text.trim() === '' ? Number.NaN : Number(text.replace(',', '.')));

function errorsOf(issues: readonly Issue[]): FormErrors {
  const errors: FormErrors = {};
  for (const { path, message } of issues) {
    const key = String((path[0] === 'prices' ? path[1] : path[0]) ?? 'form');
    errors[key] ??= message;
  }
  return errors;
}

function pricesOf(values: EntryValues): Record<string, number> | undefined {
  if (GROUP_PRICED.some((group) => group === values.group)) return undefined;
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
