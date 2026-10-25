import { itemPriceFieldsOf, type MenuGroup, PRICE_FIELDS, type PriceField } from '@/features/menu/domain/menu-groups';
import { menuItemCreateSchema, type MenuItemDef, type MenuItemInput, menuItemUpdateSchema, type MenuItemUpdateInput } from '@/features/menu/domain/menu-item.schema';
import { itemPriceIssues, type MenuPrices } from '@/features/menu/domain/menu-prices';

const FORM_KEYS = ['group', 'name', 'unitCost', ...PRICE_FIELDS] as const;
type FormKey = (typeof FORM_KEYS)[number];

export type MenuItemFormValues = { group: MenuGroup; name: string; unitCost: string } & Record<PriceField, string>;
export type MenuItemFormErrors = Partial<Record<FormKey, string>>;
export type FormResult<T> = { ok: true; input: T } | { ok: false; errors: MenuItemFormErrors };
type Issue = { path: PropertyKey[]; message: string };

const toNumber = (text: string): number => (text.trim() === '' ? Number.NaN : Number(text.replace(',', '.')));
const textOf = (value: number | null): string => (value === null ? '' : String(value));
const isFormKey = (key: PropertyKey | undefined): key is FormKey => FORM_KEYS.some((formKey) => formKey === key);

export function initialValues(item: MenuItemDef | null): MenuItemFormValues {
  if (!item) return { group: 'empanadas', name: '', unitCost: '', price1: '', price3: '', price6: '', price12: '' };
  const { group, name, unitCost, price1, price3, price6, price12 } = item;
  return { group, name, unitCost: textOf(unitCost), price1: textOf(price1), price3: textOf(price3), price6: textOf(price6), price12: textOf(price12) };
}

function pricesFrom(values: MenuItemFormValues): MenuPrices | undefined {
  const fields = itemPriceFieldsOf(values.group);
  if (fields.length === 0) return undefined;
  const optional = (field: PriceField): number | undefined => (fields.includes(field) ? toNumber(values[field]) : undefined);
  return { price1: toNumber(values.price1), price3: optional('price3'), price6: optional('price6'), price12: optional('price12') };
}

function errorsOf(issues: readonly Issue[]): MenuItemFormErrors {
  const errors: MenuItemFormErrors = {};
  for (const { path, message } of issues) {
    const key = path.at(-1);
    if (isFormKey(key) && !errors[key]) errors[key] = message;
  }
  return errors;
}

export function parseCreate(values: MenuItemFormValues): FormResult<MenuItemInput> {
  const result = menuItemCreateSchema.safeParse({ group: values.group, name: values.name, unitCost: toNumber(values.unitCost), prices: pricesFrom(values) });
  return result.success ? { ok: true, input: result.data } : { ok: false, errors: errorsOf(result.error.issues) };
}

export function parseUpdate(values: MenuItemFormValues, version: number): FormResult<MenuItemUpdateInput> {
  const prices = pricesFrom(values);
  const result = menuItemUpdateSchema.safeParse({ name: values.name, unitCost: toNumber(values.unitCost), prices, version });
  const issues = [...(result.success ? [] : result.error.issues), ...itemPriceIssues(values.group, prices).map(({ field, message }) => ({ path: [field], message }))];
  return result.success && issues.length === 0 ? { ok: true, input: result.data } : { ok: false, errors: errorsOf(issues) };
}
