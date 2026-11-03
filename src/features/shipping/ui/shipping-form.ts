import { type ShippingDef, type ShippingInput, shippingCreateSchema, shippingUpdateSchema, type ShippingUpdateInput } from '@/features/shipping/domain/shipping.schema';

const FIELDS = ['title', 'detail', 'amount'] as const;
type Field = (typeof FIELDS)[number];

export type ShippingFormValues = Record<Field, string>;
export type ShippingFormErrors = Partial<Record<Field, string>>;
export type FormResult<T> = { ok: true; input: T } | { ok: false; errors: ShippingFormErrors };
type Issue = { path: PropertyKey[]; message: string };

const toNumber = (text: string): number => (text.trim() === '' ? Number.NaN : Number(text.replace(',', '.')));
const isField = (key: PropertyKey | undefined): key is Field => FIELDS.some((field) => field === key);

export function initialValues(shipping: ShippingDef | null): ShippingFormValues {
  if (!shipping) return { title: '', detail: '', amount: '' };
  return { title: shipping.title, detail: shipping.detail, amount: String(shipping.amount) };
}

function errorsOf(issues: readonly Issue[]): ShippingFormErrors {
  const errors: ShippingFormErrors = {};
  for (const { path, message } of issues) {
    const key = path[0];
    if (isField(key) && !errors[key]) errors[key] = message;
  }
  return errors;
}

const payloadOf = (values: ShippingFormValues): Record<string, unknown> => ({ ...values, amount: toNumber(values.amount) });

export function parseCreate(values: ShippingFormValues): FormResult<ShippingInput> {
  const result = shippingCreateSchema.safeParse(payloadOf(values));
  return result.success ? { ok: true, input: result.data } : { ok: false, errors: errorsOf(result.error.issues) };
}

export function parseUpdate(values: ShippingFormValues, version: number): FormResult<ShippingUpdateInput> {
  const result = shippingUpdateSchema.safeParse({ ...payloadOf(values), version });
  return result.success ? { ok: true, input: result.data } : { ok: false, errors: errorsOf(result.error.issues) };
}
