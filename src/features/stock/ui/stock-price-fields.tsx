import type { JSX } from 'react';
import { FormField, inputClass } from '@/components/ui/form-field';
import { priceFieldsOf, priceLabelOf } from '@/features/menu/domain/menu-groups';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { SALE_PRICE_TERM } from '@/features/menu/domain/menu-terms';
import { formatMoney } from '@/lib/format-money';
import type { EntryValues, FormErrors } from './stock-forms';

type StockPriceFieldsProps = {
  item: MenuItemDef;
  values: EntryValues;
  errors: FormErrors;
  onChange: (values: EntryValues) => void;
};

export function StockPriceFields({ item, values, errors, onChange }: StockPriceFieldsProps): JSX.Element {
  return (
    <>
      {priceFieldsOf(item.group).map((field) => {
        const value = item[field];
        return (
          <FormField key={field} label={`${SALE_PRICE_TERM}, ${priceLabelOf(item.group, field)}`} error={errors[field]}>
            <input inputMode='decimal' value={values[field]} onChange={(event) => onChange({ ...values, [field]: event.target.value })} placeholder={value === null || value === undefined ? '' : formatMoney(value)} className={inputClass(Boolean(errors[field]))} />
          </FormField>
        );
      })}
    </>
  );
}
