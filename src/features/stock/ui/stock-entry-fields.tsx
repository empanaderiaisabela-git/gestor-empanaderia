import type { JSX } from 'react';
import { FormField, inputClass } from '@/components/ui/form-field';
import { GROUPS, MENU_GROUPS } from '@/features/menu/domain/menu-groups';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { costLabelOf } from '@/features/menu/domain/menu-terms';
import type { MenuGroupPriceDef } from '@/features/menu/domain/menu-group-price.schema';
import { formatMoney } from '@/lib/format-money';
import type { ProviderDef } from '@/features/provider/domain/provider.schema';
import type { EntryValues, FormErrors } from './stock-forms';
import { StockPriceFields } from './stock-price-fields';

type StockEntryFieldsProps = {
  values: EntryValues;
  errors: FormErrors;
  items: MenuItemDef[];
  providers: ProviderDef[];
  groupPrices: MenuGroupPriceDef[];
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

function CostFields({ values, errors, items, providers, groupPrices, onChange }: StockEntryFieldsProps): JSX.Element {
  const item = items.find((candidate) => candidate.id === values.menuItemId) ?? null;
  return (
    <>
      <FormField label={costLabelOf(item?.group ?? null)} error={errors.unitCost}>
        <input inputMode='decimal' value={values.unitCost} onChange={(event) => onChange({ ...values, unitCost: event.target.value })} placeholder={item?.unitCost == null ? '' : formatMoney(item.unitCost)} className={inputClass(Boolean(errors.unitCost))} />
      </FormField>
      {item && <StockPriceFields item={item} groupPrices={groupPrices} values={values} errors={errors} onChange={onChange} />}
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
  const { values, errors, items, onChange } = props;
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
      <CostFields {...props} />
    </div>
  );
}
