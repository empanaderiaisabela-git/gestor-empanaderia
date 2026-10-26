import type { JSX } from 'react';
import { FormField, inputClass } from '@/components/ui/form-field';
import { GROUPS, MENU_GROUPS } from '@/features/menu/domain/menu-groups';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { costLabelOf } from '@/features/menu/domain/menu-terms';
import type { ProviderDef } from '@/features/provider/domain/provider.schema';
import type { EntryValues, FormErrors } from './stock-forms';

type StockEntryFieldsProps = {
  values: EntryValues;
  errors: FormErrors;
  items: MenuItemDef[];
  providers: ProviderDef[];
  isAdmin: boolean;
  onChange: (values: EntryValues) => void;
};

function ItemOptions({ items }: { items: MenuItemDef[] }): JSX.Element {
  return (
    <>
      <option value=''>Elegí un gusto o bebida</option>
      {MENU_GROUPS.map((group) => (
        <optgroup key={group} label={GROUPS[group].label}>
          {items.filter((item) => item.group === group).map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} (stock {item.stock.toLocaleString('es-AR')})
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}

function CostFields({ values, errors, items, providers, onChange }: Omit<StockEntryFieldsProps, 'isAdmin'>): JSX.Element {
  const group = items.find((item) => item.id === values.menuItemId)?.group ?? null;
  return (
    <>
      <FormField label={`${costLabelOf(group)} (vacío = se mantiene el actual)`} error={errors.unitCost}>
        <input inputMode='decimal' value={values.unitCost} onChange={(event) => onChange({ ...values, unitCost: event.target.value })} className={inputClass(Boolean(errors.unitCost))} />
      </FormField>
      <FormField label='Proveedor (opcional)' error={errors.providerId}>
        <select value={values.providerId} onChange={(event) => onChange({ ...values, providerId: event.target.value })} className={inputClass(Boolean(errors.providerId))}>
          <option value=''>Sin proveedor</option>
          {providers.filter((provider) => provider.isActive).map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
      </FormField>
    </>
  );
}

export function StockEntryFields(props: StockEntryFieldsProps): JSX.Element {
  const { values, errors, items, isAdmin, onChange } = props;
  return (
    <div className='space-y-4'>
      <FormField label='Gusto o bebida' error={errors.menuItemId}>
        <select value={values.menuItemId} onChange={(event) => onChange({ ...values, menuItemId: event.target.value })} className={inputClass(Boolean(errors.menuItemId))}>
          <ItemOptions items={items} />
        </select>
      </FormField>
      <FormField label='Cantidad que entra' error={errors.quantity}>
        <input inputMode='numeric' value={values.quantity} onChange={(event) => onChange({ ...values, quantity: event.target.value })} placeholder='Ej: 24' className={inputClass(Boolean(errors.quantity))} />
      </FormField>
      {isAdmin && <CostFields {...props} />}
    </div>
  );
}
