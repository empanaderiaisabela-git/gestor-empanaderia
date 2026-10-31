import type { JSX } from 'react';
import { isDrinkGroup } from '@/features/menu/domain/drink';
import { GROUPS, MENU_GROUPS, type MenuGroup } from '@/features/menu/domain/menu-groups';
import { FormField, inputClass } from '@/components/ui/form-field';
import type { MenuItemFormErrors, MenuItemFormValues } from './menu-item-form';

type MenuItemFieldsProps = {
  values: MenuItemFormValues;
  errors: MenuItemFormErrors;
  isEditing: boolean;
  onChange: (values: MenuItemFormValues) => void;
  drinkNames?: string[];
};

const isMenuGroup = (value: string): value is MenuGroup => MENU_GROUPS.some((group) => group === value);

function DrinkFields({ values, errors, onChange, drinkNames = [] }: Omit<MenuItemFieldsProps, 'isEditing'>): JSX.Element {
  return (
    <>
      <FormField label='Bebida' error={errors.drinkName}>
        <input list='drink-names' value={values.drinkName} onChange={(event) => onChange({ ...values, drinkName: event.target.value })} placeholder='Ej: Aquarius' className={inputClass(Boolean(errors.drinkName))} />
        <datalist id='drink-names'>
          {drinkNames.map((name) => <option key={name} value={name} />)}
        </datalist>
      </FormField>
      <FormField label='Litros' error={errors.liters}>
        <input inputMode='decimal' value={values.liters} onChange={(event) => onChange({ ...values, liters: event.target.value })} placeholder='Ej: 1.5' className={inputClass(Boolean(errors.liters))} />
      </FormField>
      <FormField label='Sabor (opcional)' error={errors.flavor}>
        <input value={values.flavor} onChange={(event) => onChange({ ...values, flavor: event.target.value })} placeholder='Ej: Manzana' className={inputClass(Boolean(errors.flavor))} />
      </FormField>
    </>
  );
}

export function MenuItemFields({ values, errors, isEditing, onChange, drinkNames }: MenuItemFieldsProps): JSX.Element {
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
      {isDrinkGroup(values.group) ? (
        <DrinkFields values={values} errors={errors} onChange={onChange} drinkNames={drinkNames} />
      ) : (
        <FormField label='Nombre del gusto o bebida' error={errors.name}>
          <input value={values.name} onChange={(event) => onChange({ ...values, name: event.target.value })} placeholder='Ej: Carne suave' className={inputClass(Boolean(errors.name))} />
        </FormField>
      )}
    </div>
  );
}
