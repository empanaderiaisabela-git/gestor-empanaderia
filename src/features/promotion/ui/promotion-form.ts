import { GROUPS, type MenuGroup } from '@/features/menu/domain/menu-groups';
import { type PromotionDef, type PromotionInput, promotionCreateSchema, promotionUpdateSchema, type PromotionUpdateInput } from '@/features/promotion/domain/promotion.schema';

export type ComponentValues = { group: MenuGroup; presentationKey: string; quantity: string };
export type PromotionFormValues = { name: string; price: string; components: ComponentValues[] };
export type PromotionFormErrors = Partial<Record<'name' | 'price' | 'components', string>>;
export type FormResult<T> = { ok: true; input: T } | { ok: false; errors: PromotionFormErrors };
type Issue = { path: PropertyKey[]; message: string };

const FIELDS = ['name', 'price', 'components'] as const;
const toNumber = (text: string): number => (text.trim() === '' ? Number.NaN : Number(text.replace(',', '.')));
const isField = (key: PropertyKey | undefined): key is (typeof FIELDS)[number] => FIELDS.some((field) => field === key);

export function blankComponent(group: MenuGroup = 'empanadas'): ComponentValues {
  return { group, presentationKey: GROUPS[group].presentations[0].key, quantity: '1' };
}

export function initialValues(promotion: PromotionDef | null): PromotionFormValues {
  if (!promotion) return { name: '', price: '', components: [blankComponent()] };
  const components = promotion.components.map(({ group, presentationKey, quantity }) => ({ group, presentationKey, quantity: String(quantity) }));
  return { name: promotion.name, price: String(promotion.price), components };
}

function payloadOf(values: PromotionFormValues): Record<string, unknown> {
  const components = values.components.map(({ group, presentationKey, quantity }) => ({ group, presentationKey, quantity: toNumber(quantity) }));
  return { name: values.name, price: toNumber(values.price), components };
}

function errorsOf(issues: readonly Issue[]): PromotionFormErrors {
  const errors: PromotionFormErrors = {};
  for (const { path, message } of issues) {
    const key = path[0];
    if (isField(key) && !errors[key]) errors[key] = message;
  }
  return errors;
}

export function parseCreate(values: PromotionFormValues): FormResult<PromotionInput> {
  const result = promotionCreateSchema.safeParse(payloadOf(values));
  return result.success ? { ok: true, input: result.data } : { ok: false, errors: errorsOf(result.error.issues) };
}

export function parseUpdate(values: PromotionFormValues, version: number): FormResult<PromotionUpdateInput> {
  const result = promotionUpdateSchema.safeParse({ ...payloadOf(values), version });
  return result.success ? { ok: true, input: result.data } : { ok: false, errors: errorsOf(result.error.issues) };
}
