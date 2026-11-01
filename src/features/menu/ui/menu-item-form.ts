import { isDrinkGroup, sizeOf } from '@/features/menu/domain/drink';
import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import { drinkCreateSchema, drinkUpdateSchema, foodCreateSchema, foodUpdateSchema, type MenuItemDef, type MenuItemInput, type MenuItemUpdateInput } from '@/features/menu/domain/menu-item.schema';

const FORM_KEYS = ['group', 'name', 'drinkName', 'size', 'flavor'] as const;
type FormKey = (typeof FORM_KEYS)[number];

export type MenuItemFormValues = { group: MenuGroup; name: string; drinkName: string; size: string; flavor: string };
export type MenuItemFormErrors = Partial<Record<FormKey, string>>;
export type FormResult<T> = { ok: true; input: T } | { ok: false; errors: MenuItemFormErrors };
type Issue = { path: PropertyKey[]; message: string };
type Parsed<T> = { success: true; data: T } | { success: false; error: { issues: readonly Issue[] } };

const LEGACY_LITERS = /^(.*?)\s*(\d+(?:[.,]\d+)?)\s*(ml|l)\b\s*(.*)$/i;

function legacyDrink(name: string): Pick<MenuItemFormValues, 'drinkName' | 'size' | 'flavor'> {
  const match = LEGACY_LITERS.exec(name);
  if (!match) return { drinkName: name, size: '', flavor: '' };
  const [, drink, amount, unit, flavor] = match;
  return { drinkName: drink.trim(), size: `${amount.replace(',', '.')} ${unit}`, flavor: flavor.trim() };
}

const isFormKey = (key: PropertyKey | undefined): key is FormKey => FORM_KEYS.some((formKey) => formKey === key);

export function initialValues(item: MenuItemDef | null): MenuItemFormValues {
  if (!item) return { group: 'empanadas', name: '', drinkName: '', size: '', flavor: '' };
  if (isDrinkGroup(item.group) && item.drinkName === null) return { group: item.group, name: item.name, ...legacyDrink(item.name) };
  return { group: item.group, name: item.name, drinkName: item.drinkName ?? '', size: sizeOf(item) ?? '', flavor: item.flavor ?? '' };
}

function resultOf<T>(result: Parsed<T>): FormResult<T> {
  if (result.success) return { ok: true, input: result.data };
  const errors: MenuItemFormErrors = {};
  for (const { path, message } of result.error.issues) {
    const key = path.at(-1);
    if (isFormKey(key) && !errors[key]) errors[key] = message;
  }
  return { ok: false, errors };
}

const drinkOf = (values: MenuItemFormValues) => ({ drinkName: values.drinkName, size: values.size, flavor: values.flavor });

export function parseCreate(values: MenuItemFormValues): FormResult<MenuItemInput> {
  if (isDrinkGroup(values.group)) return resultOf(drinkCreateSchema.safeParse({ group: values.group, ...drinkOf(values) }));
  return resultOf(foodCreateSchema.safeParse({ group: values.group, name: values.name }));
}

export function parseUpdate(values: MenuItemFormValues, version: number): FormResult<MenuItemUpdateInput> {
  if (isDrinkGroup(values.group)) return resultOf(drinkUpdateSchema.safeParse({ ...drinkOf(values), version }));
  return resultOf(foodUpdateSchema.safeParse({ name: values.name, version }));
}
