import type { JSX } from 'react';
import { FormField, inputClass } from '@/components/ui/form-field';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { costLabelOf } from '@/features/menu/domain/menu-terms';
import type { HamPriceDef } from '@/features/menu/domain/pizza-extra.schema';
import { CATEGORY_LABELS, categoryOf, HAM_CATEGORY, isPriceOnlyCategory, type StockCategory } from '@/features/stock/domain/stock-categories';
import { formatMoney } from '@/lib/format-money';
import type { ProviderDef } from '@/features/provider/domain/provider.schema';
import { HamPriceField, MinStockField, ProviderField } from './stock-entry-optional-fields';
import type { EntryValues, FormErrors } from './stock-forms';
import { ItemSelects } from './stock-item-selects';
import { StockPriceFields } from './stock-price-fields';

type StockEntryFieldsProps = {
  values: EntryValues;
  errors: FormErrors;
  items: MenuItemDef[];
  providers: ProviderDef[];
  onChange: (values: EntryValues) => void;
  categories?: readonly StockCategory[];
  ham?: HamPriceDef;
  editing?: { withProvider: boolean };
};

const itemOf = ({ items, values }: StockEntryFieldsProps): MenuItemDef | null => items.find((candidate) => candidate.id === values.menuItemId) ?? null;

function CostFields(props: StockEntryFieldsProps): JSX.Element {
  const { values, errors, providers, onChange, editing } = props;
  const item = itemOf(props);
  return (
    <>
      {!item?.isBase && (
        <FormField label={costLabelOf(item?.group ?? null)} error={errors.unitCost}>
          <input inputMode='decimal' value={values.unitCost} onChange={(event) => onChange({ ...values, unitCost: event.target.value })} placeholder={item?.unitCost == null ? '' : formatMoney(item.unitCost)} className={inputClass(Boolean(errors.unitCost))} />
        </FormField>
      )}
      {item && !item.isBase && <StockPriceFields item={item} values={values} errors={errors} onChange={onChange} />}
      {!isPriceOnlyCategory(values.category) && values.category !== '' && <MinStockField values={values} errors={errors} onChange={onChange} />}
      {!isPriceOnlyCategory(values.category) && (editing?.withProvider ?? true) && <ProviderField values={values} errors={errors} providers={providers} onChange={onChange} />}
    </>
  );
}

function EditedItem(props: StockEntryFieldsProps): JSX.Element | null {
  const item = itemOf(props);
  if (!item) return null;
  const category = CATEGORY_LABELS[categoryOf(item)];
  return <p className='text-sm font-bold text-zinc-900 dark:text-zinc-50'>{item.isBase ? category : `${category} · ${item.name}`}</p>;
}

export function StockEntryFields(props: StockEntryFieldsProps): JSX.Element {
  const { values, errors, items, onChange, categories, ham, editing } = props;
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
      {editing ? <EditedItem {...props} /> : <ItemSelects values={values} errors={errors} items={items} onChange={onChange} categories={categories} ham={ham} />}
      {!isPriceOnlyCategory(values.category) && (
        <FormField label={editing ? 'Stock' : 'Cantidad que entra'} error={errors.quantity ?? errors.stock}>
          <input inputMode='numeric' value={values.quantity} onChange={(event) => onChange({ ...values, quantity: event.target.value })} placeholder='Ej: 24' className={inputClass(Boolean(errors.quantity ?? errors.stock))} />
        </FormField>
      )}
      <CostFields {...props} />
    </div>
  );
}
