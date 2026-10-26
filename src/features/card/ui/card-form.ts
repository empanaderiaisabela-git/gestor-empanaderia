import { type CardDef, type CardInput, cardCreateSchema, cardUpdateSchema, type CardUpdateInput, INSTALLMENTS } from '@/features/card/domain/card.schema';

export type PlanValues = { installments: string; surchargePct: string };
export type CardFormValues = { name: string; plans: PlanValues[] };
export type CardFormErrors = Partial<Record<'name' | 'plans', string>>;
export type FormResult<T> = { ok: true; input: T } | { ok: false; errors: CardFormErrors };
type Issue = { path: PropertyKey[]; message: string };

const toNumber = (text: string): number => (text.trim() === '' ? Number.NaN : Number(text.replace(',', '.')));
const isField = (key: PropertyKey | undefined): key is 'name' | 'plans' => key === 'name' || key === 'plans';

export function nextPlan(plans: readonly PlanValues[]): PlanValues {
  const free = INSTALLMENTS.find((installments) => !plans.some((plan) => plan.installments === String(installments))) ?? 1;
  return { installments: String(free), surchargePct: '0' };
}

export function initialValues(card: CardDef | null): CardFormValues {
  if (!card) return { name: '', plans: [nextPlan([])] };
  return { name: card.name, plans: card.plans.map(({ installments, surchargePct }) => ({ installments: String(installments), surchargePct: String(surchargePct) })) };
}

function payloadOf(values: CardFormValues): Record<string, unknown> {
  return { name: values.name, plans: values.plans.map(({ installments, surchargePct }) => ({ installments: toNumber(installments), surchargePct: toNumber(surchargePct) })) };
}

function errorsOf(issues: readonly Issue[]): CardFormErrors {
  const errors: CardFormErrors = {};
  for (const { path, message } of issues) {
    const key = path[0];
    if (isField(key) && !errors[key]) errors[key] = message;
  }
  return errors;
}

export function parseCreate(values: CardFormValues): FormResult<CardInput> {
  const result = cardCreateSchema.safeParse(payloadOf(values));
  return result.success ? { ok: true, input: result.data } : { ok: false, errors: errorsOf(result.error.issues) };
}

export function parseUpdate(values: CardFormValues, version: number): FormResult<CardUpdateInput> {
  const result = cardUpdateSchema.safeParse({ ...payloadOf(values), version });
  return result.success ? { ok: true, input: result.data } : { ok: false, errors: errorsOf(result.error.issues) };
}
