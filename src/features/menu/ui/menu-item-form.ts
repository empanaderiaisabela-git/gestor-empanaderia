import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import { menuItemCreateSchema, type MenuItemDef, type MenuItemInput, menuItemUpdateSchema, type MenuItemUpdateInput } from '@/features/menu/domain/menu-item.schema';

const FORM_KEYS = ['group', 'name'] as const;
type FormKey = (typeof FORM_KEYS)[number];

export type MenuItemFormValues = { group: MenuGroup; name: string };
export type MenuItemFormErrors = Partial<Record<FormKey, string>>;
export type FormResult<T> = { ok: true; input: T } | { ok: false; errors: MenuItemFormErrors };
type Issue = { path: PropertyKey[]; message: string };

const isFormKey = (key: PropertyKey | undefined): key is FormKey => FORM_KEYS.some((formKey) => formKey === key);

export function initialValues(item: MenuItemDef | null): MenuItemFormValues {
  return item ? { group: item.group, name: item.name } : { group: 'empanadas', name: '' };
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
  const result = menuItemCreateSchema.safeParse({ group: values.group, name: values.name });
  return result.success ? { ok: true, input: result.data } : { ok: false, errors: errorsOf(result.error.issues) };
}

export function parseUpdate(values: MenuItemFormValues, version: number): FormResult<MenuItemUpdateInput> {
  const result = menuItemUpdateSchema.safeParse({ name: values.name, version });
  return result.success ? { ok: true, input: result.data } : { ok: false, errors: errorsOf(result.error.issues) };
}
