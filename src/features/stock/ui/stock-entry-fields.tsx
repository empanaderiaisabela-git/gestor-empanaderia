import type { JSX } from 'react';
import { FormField, inputClass } from '@/components/ui/form-field';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { costLabelOf } from '@/features/menu/domain/menu-terms';
import { HAM_CATEGORY_LABEL, type HamPriceDef } from '@/features/menu/domain/pizza-extra.schema';
import { CATEGORY_LABELS, categoryOf, HAM_CATEGORY, isBaseCategory, isPriceOnlyCategory, STOCK_CATEGORIES, type StockCategory } from '@/features/stock/domain/stock-categories';
import { formatMoney } from '@/lib/format-money';
import type { ProviderDef } from '@/features/provider/domain/provider.schema';
import { HamPriceField, MinStockField, ProviderField } from './stock-entry-optional-fields';
import { type EntryValues, type FormErrors, NO_PRICES, pricingValuesOf, textOf } from './stock-forms';
import { StockPriceFields } from './stock-price-fields';

type StockEntryFieldsProps = {
  values: EntryValues;
  errors: FormErrors;
  items: MenuItemDef[];
  providers: ProviderDef[];
  onChange: (values: EntryValues) => void;
  categories?: readonly StockCategory[];
  ham?: HamPriceDef;
};

function ItemSelects({ values, errors, items, onChange, categories = STOCK_CATEGORIES, ham }: Omit<StockEntryFieldsProps, 'providers'>): JSX.Element {
  const inCategory = items.filter((item) => categoryOf(item) === values.category);
  const isBase = isBaseCategory(values.category);
  const noFlavor = isBase || values.category === HAM_CATEGORY;
  const pick = (menuItemId: string): void => {
    const item = items.find((candidate) => candidate.id === menuItemId);
    if (!item) return onChange({ ...values, menuItemId });
    onChange(isPriceOnlyCategory(values.category) ? { ...values, ...pricingValuesOf(item), menuItemId } : { ...values, ...NO_PRICES, menuItemId, minStock: textOf(item.minStock) });
  };
  const choose = (category: string): void => {
    if (category === HAM_CATEGORY) return onChange({ ...values, category, menuItemId: '', price1: textOf(ham?.price) });
    const base = isBaseCategory(category) ? items.find((item) => categoryOf(item) === category) : undefined;
    onChange({ ...values, category, menuItemId: base?.id ?? '', minStock: textOf(base?.minStock) });
  };
  return (
    <>
      <FormField label='Categoría' error={isBase ? errors.menuItemId : undefined}>
        <select value={values.category} onChange={(event) => choose(event.target.value)} className={inputClass(isBase && Boolean(errors.menuItemId))}>
          <option value=''>Elegí una categoría</option>
          {categories.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}
          {ham && <option value={HAM_CATEGORY}>{HAM_CATEGORY_LABEL}</option>}
        </select>
      </FormField>
      {!noFlavor && (
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
      {!isPriceOnlyCategory(values.category) && values.category !== '' && <MinStockField values={values} errors={errors} onChange={onChange} />}
      {!isPriceOnlyCategory(values.category) && <ProviderField values={values} errors={errors} providers={providers} onChange={onChange} />}
    </>
  );
}

export function StockEntryFields(props: StockEntryFieldsProps): JSX.Element {
  const { values, errors, items, onChange, categories, ham } = props;
  if (values.category === HAM_CATEGORY) {
    return (
      <div className='space-y-4'>
        <ItemSelects values={values} errors={errors} items={items} onChange={onChange} ham={ham} />
        <HamPriceField values={values} errors={errors} onChange={onChange} />
      </div>
    );
  }
  return (
    <div className='space-y-4'>
      <ItemSelects values={values} errors={errors} items={items} onChange={onChange} categories={categories} ham={ham} />
      {!isPriceOnlyCategory(values.category) && (
        <FormField label='Cantidad que entra' error={errors.quantity}>
          <input inputMode='numeric' value={values.quantity} onChange={(event) => onChange({ ...values, quantity: event.target.value })} placeholder='Ej: 24' className={inputClass(Boolean(errors.quantity))} />
        </FormField>
      )}
      <CostFields {...props} />
    </div>
  );
}
