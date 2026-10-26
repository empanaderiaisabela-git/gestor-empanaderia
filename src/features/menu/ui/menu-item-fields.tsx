import type { JSX } from 'react';
import { GROUPS, isPricedByGroup, itemPriceFieldsOf, MENU_GROUPS, type MenuGroup, priceLabelOf } from '@/features/menu/domain/menu-groups';
import { COST_HINT, costLabelOf, SALE_PRICE_HINT, SALE_PRICE_TERM } from '@/features/menu/domain/menu-terms';
import { FormField, inputClass } from '@/components/ui/form-field';
import type { MenuItemFormErrors, MenuItemFormValues } from './menu-item-form';

type MenuItemFieldsProps = {
  values: MenuItemFormValues;
  errors: MenuItemFormErrors;
  isEditing: boolean;
  onChange: (values: MenuItemFormValues) => void;
};

type SetField = (field: keyof MenuItemFormValues, value: string) => void;

const isMenuGroup = (value: string): value is MenuGroup => MENU_GROUPS.some((group) => group === value);
const hintClass = 'text-xs text-zinc-500 -mt-2';

function PriceFields({ values, errors, set }: Pick<MenuItemFieldsProps, 'values' | 'errors'> & { set: SetField }): JSX.Element {
  const { group } = values;
  if (isPricedByGroup(group)) return <p className='text-sm text-zinc-500'>El precio de venta es el mismo para todos los gustos: se carga arriba, en &quot;Precios de venta de {GROUPS[group].label}&quot;.</p>;
  return (
    <>
      <div className='grid grid-cols-2 gap-3'>
        {itemPriceFieldsOf(group).map((field) => (
          <FormField key={field} label={`${SALE_PRICE_TERM}, ${priceLabelOf(group, field)}`} error={errors[field]}>
            <input inputMode='decimal' value={values[field]} onChange={(event) => set(field, event.target.value)} className={inputClass(Boolean(errors[field]))} />
          </FormField>
        ))}
      </div>
      <p className={hintClass}>{SALE_PRICE_HINT}</p>
    </>
  );
}

export function MenuItemFields({ values, errors, isEditing, onChange }: MenuItemFieldsProps): JSX.Element {
  const set: SetField = (field, value) => onChange({ ...values, [field]: value });
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
      <FormField label={costLabelOf(values.group)} error={errors.unitCost}>
        <input inputMode='decimal' value={values.unitCost} onChange={(event) => set('unitCost', event.target.value)} placeholder='Ej: 450' className={inputClass(Boolean(errors.unitCost))} />
      </FormField>
      <p className={hintClass}>{COST_HINT}</p>
      <PriceFields values={values} errors={errors} set={set} />
    </div>
  );
}
