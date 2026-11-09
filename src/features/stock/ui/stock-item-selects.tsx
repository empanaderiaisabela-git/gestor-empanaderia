import type { JSX } from 'react';
import { FormField, inputClass } from '@/components/ui/form-field';
import { DRINK_GROUPS, familySourceOf } from '@/features/menu/domain/drink';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { HAM_CATEGORY_LABEL, type HamPriceDef } from '@/features/menu/domain/pizza-extra.schema';
import { CATEGORY_LABELS, categoryOf, HAM_CATEGORY, isBaseCategory, isPriceOnlyCategory, STOCK_CATEGORIES, type StockCategory } from '@/features/stock/domain/stock-categories';
import { DrinkSelects } from './stock-drink-selects';
import { type EntryValues, type FormErrors, NO_PRICES, pricingValuesOf, textOf } from './stock-forms';

type ItemSelectsProps = {
  values: EntryValues;
  errors: FormErrors;
  items: MenuItemDef[];
  onChange: (values: EntryValues) => void;
  categories?: readonly StockCategory[];
  ham?: HamPriceDef;
};

const isDrinkCategory = (category: string): boolean => DRINK_GROUPS.some((group) => group === category);

function pickedValues({ values, items }: Pick<ItemSelectsProps, 'values' | 'items'>, item: MenuItemDef): EntryValues {
  if (isPriceOnlyCategory(values.category)) return { ...values, ...pricingValuesOf(item), menuItemId: item.id };
  const source = isDrinkCategory(values.category) ? familySourceOf(item, items) : null;
  const prices = source ? { ...NO_PRICES, price1: textOf(source.price1) } : NO_PRICES;
  const cost = source ? { unitCost: textOf(source.unitCost) } : {};
  return { ...values, ...prices, ...cost, menuItemId: item.id, minStock: textOf(item.minStock) };
}

export function ItemSelects({ values, errors, items, onChange, categories = STOCK_CATEGORIES, ham }: ItemSelectsProps): JSX.Element {
  const inCategory = items.filter((item) => categoryOf(item) === values.category);
  const isBase = isBaseCategory(values.category);
  const noFlavor = isBase || values.category === HAM_CATEGORY;
  const pick = (menuItemId: string): void => {
    const item = items.find((candidate) => candidate.id === menuItemId);
    onChange(item ? pickedValues({ values, items }, item) : { ...values, menuItemId });
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
      {!noFlavor && isDrinkCategory(values.category) && <DrinkSelects key={values.category} items={inCategory} menuItemId={values.menuItemId} error={errors.menuItemId} onPick={pick} />}
      {!noFlavor && !isDrinkCategory(values.category) && (
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
