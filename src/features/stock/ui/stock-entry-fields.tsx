import type { JSX } from 'react';
import { FormField, inputClass } from '@/components/ui/form-field';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { costLabelOf } from '@/features/menu/domain/menu-terms';
import { CATEGORY_LABELS, categoryOf, isBaseCategory, isPriceOnlyCategory, STOCK_CATEGORIES } from '@/features/stock/domain/stock-categories';
import { formatMoney } from '@/lib/format-money';
import type { ProviderDef } from '@/features/provider/domain/provider.schema';
import { type EntryValues, type FormErrors, pricingValuesOf } from './stock-forms';
import { StockPriceFields } from './stock-price-fields';

type StockEntryFieldsProps = {
  values: EntryValues;
  errors: FormErrors;
  items: MenuItemDef[];
  providers: ProviderDef[];
  onChange: (values: EntryValues) => void;
};

function ItemSelects({ values, errors, items, onChange }: Pick<StockEntryFieldsProps, 'values' | 'errors' | 'items' | 'onChange'>): JSX.Element {
  const inCategory = items.filter((item) => categoryOf(item) === values.category);
  const isBase = isBaseCategory(values.category);
  const pick = (menuItemId: string): void => {
    const item = isPriceOnlyCategory(values.category) ? items.find((candidate) => candidate.id === menuItemId) : undefined;
    onChange(item ? { ...values, ...pricingValuesOf(item), menuItemId } : { ...values, menuItemId });
  };
  const choose = (category: string): void => onChange({ ...values, category, menuItemId: isBaseCategory(category) ? (items.find((item) => categoryOf(item) === category)?.id ?? '') : '' });
  return (
    <>
      <FormField label='Categoría' error={isBase ? errors.menuItemId : undefined}>
        <select value={values.category} onChange={(event) => choose(event.target.value)} className={inputClass(isBase && Boolean(errors.menuItemId))}>
          <option value=''>Elegí una categoría</option>
          {STOCK_CATEGORIES.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}
        </select>
      </FormField>
      {!isBase && (
        <FormField label='Gusto o bebida' error={errors.menuItemId}>
          <select value={values.menuItemId} disabled={values.category === ''} onChange={(event) => pick(event.target.value)} className={inputClass(Boolean(errors.menuItemId))}>
            <option value=''>Elegí un gusto o bebida</option>
            {inCategory.map((item) => (
              <option key={item.id} value={item.id}>
                {isPriceOnlyCategory(values.category) ? item.name : `${item.name} (stock ${item.stock.toLocaleString('es-AR')})`}
              </option>
            ))}
          </select>
        </FormField>
      )}
    </>
  );
}

function CostFields({ values, errors, items, providers, onChange }: StockEntryFieldsProps): JSX.Element {
  const item = items.find((candidate) => candidate.id === values.menuItemId) ?? null;
  return (
    <>
      {!item?.isBase && (
        <FormField label={costLabelOf(item?.group ?? null)} error={errors.unitCost}>
          <input inputMode='decimal' value={values.unitCost} onChange={(event) => onChange({ ...values, unitCost: event.target.value })} placeholder={item?.unitCost == null ? '' : formatMoney(item.unitCost)} className={inputClass(Boolean(errors.unitCost))} />
        </FormField>
      )}
      {item && !item.isBase && <StockPriceFields item={item} values={values} errors={errors} onChange={onChange} />}
      {!isPriceOnlyCategory(values.category) && <ProviderField values={values} errors={errors} providers={providers} onChange={onChange} />}
    </>
  );
}

function ProviderField({ values, errors, providers, onChange }: Omit<StockEntryFieldsProps, 'items'>): JSX.Element {
  return (
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
  );
}

export function StockEntryFields(props: StockEntryFieldsProps): JSX.Element {
  const { values, errors, items, onChange } = props;
  return (
    <div className='space-y-4'>
      <ItemSelects values={values} errors={errors} items={items} onChange={onChange} />
      {!isPriceOnlyCategory(values.category) && (
        <FormField label='Cantidad que entra' error={errors.quantity}>
          <input inputMode='numeric' value={values.quantity} onChange={(event) => onChange({ ...values, quantity: event.target.value })} placeholder='Ej: 24' className={inputClass(Boolean(errors.quantity))} />
        </FormField>
      )}
      <CostFields {...props} />
    </div>
  );
}
