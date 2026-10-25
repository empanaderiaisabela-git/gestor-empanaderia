import { type StockEntryInput, stockEntrySchema, type StockLossInput, stockLossSchema } from '@/features/stock/domain/stock.schema';

export type EntryValues = { menuItemId: string; quantity: string; unitCost: string; providerId: string };
export type LossValues = { quantity: string; reason: string };
export type FormErrors = Partial<Record<string, string>>;
export type Parsed<T> = { ok: true; input: T } | { ok: false; errors: FormErrors };

type Issue = { path: PropertyKey[]; message: string };

const toNumber = (text: string): number => (text.trim() === '' ? Number.NaN : Number(text.replace(',', '.')));

function errorsOf(issues: readonly Issue[]): FormErrors {
  const errors: FormErrors = {};
  for (const { path, message } of issues) {
    const key = String(path[0] ?? 'form');
    errors[key] ??= message;
  }
  return errors;
}

export function parseEntry(values: EntryValues, isAdmin: boolean): Parsed<StockEntryInput> {
  const costs = isAdmin ? { unitCost: values.unitCost.trim() === '' ? undefined : toNumber(values.unitCost), providerId: values.providerId || null } : {};
  const result = stockEntrySchema.safeParse({ menuItemId: values.menuItemId, quantity: toNumber(values.quantity), ...costs });
  return result.success ? { ok: true, input: result.data } : { ok: false, errors: errorsOf(result.error.issues) };
}

export function parseLoss(menuItemId: string, values: LossValues): Parsed<StockLossInput> {
  const result = stockLossSchema.safeParse({ menuItemId, quantity: toNumber(values.quantity), reason: values.reason });
  return result.success ? { ok: true, input: result.data } : { ok: false, errors: errorsOf(result.error.issues) };
}
