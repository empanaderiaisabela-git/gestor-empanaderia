import type { JSX } from 'react';
import { GROUPS, MENU_GROUPS, type MenuGroup } from '@/features/menu/domain/menu-groups';
import { FormField, inputClass } from '@/components/ui/form-field';
import type { MenuItemFormErrors, MenuItemFormValues } from './menu-item-form';

type MenuItemFieldsProps = {
  values: MenuItemFormValues;
  errors: MenuItemFormErrors;
  isEditing: boolean;
  onChange: (values: MenuItemFormValues) => void;
};

const isMenuGroup = (value: string): value is MenuGroup => MENU_GROUPS.some((group) => group === value);

export function MenuItemFields({ values, errors, isEditing, onChange }: MenuItemFieldsProps): JSX.Element {
  return (
    <div className='space-y-4'>
      <FormField label='Grupo' error={errors.group}>
        <select
          value={values.group}
          disabled={isEditing}
          onChange={(event) => isMenuGroup(event.target.value) && onChange({ ...values, group: event.target.value })}
          className={inputClass(Boolean(errors.group))}
        >
          {MENU_GROUPS.map((group) => (
            <option key={group} value={group}>
              {GROUPS[group].label}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label='Nombre del gusto o bebida' error={errors.name}>
        <input value={values.name} onChange={(event) => onChange({ ...values, name: event.target.value })} placeholder='Ej: Carne suave' className={inputClass(Boolean(errors.name))} />
      </FormField>
    </div>
  );
}
