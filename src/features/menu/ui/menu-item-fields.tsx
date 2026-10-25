import type { JSX } from 'react';
import { GROUPS, isPricedByGroup, itemPriceFieldsOf, MENU_GROUPS, type MenuGroup, priceLabelOf } from '@/features/menu/domain/menu-groups';
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
  const set = (field: keyof MenuItemFormValues, value: string): void => onChange({ ...values, [field]: value });
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
        <input value={values.name} onChange={(event) => set('name', event.target.value)} placeholder='Ej: Carne suave' className={inputClass(Boolean(errors.name))} />
      </FormField>
      <FormField label='Costo por unidad' error={errors.unitCost}>
        <input inputMode='decimal' value={values.unitCost} onChange={(event) => set('unitCost', event.target.value)} placeholder='Ej: 450' className={inputClass(Boolean(errors.unitCost))} />
      </FormField>
      {isPricedByGroup(values.group) && <p className='text-sm text-zinc-500'>Este gusto usa los precios de {GROUPS[values.group].label}.</p>}
      <div className='grid grid-cols-2 gap-3'>
        {itemPriceFieldsOf(values.group).map((field) => (
          <FormField key={field} label={`Precio ${priceLabelOf(values.group, field)}`} error={errors[field]}>
            <input inputMode='decimal' value={values[field]} onChange={(event) => set(field, event.target.value)} className={inputClass(Boolean(errors[field]))} />
          </FormField>
        ))}
      </div>
    </div>
  );
}
