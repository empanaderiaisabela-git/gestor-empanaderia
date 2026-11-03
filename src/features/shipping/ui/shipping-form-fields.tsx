import type { JSX } from 'react';
import { FormField, inputClass } from '@/components/ui/form-field';
import type { ShippingFormErrors, ShippingFormValues } from './shipping-form';

type ShippingFieldsProps = { values: ShippingFormValues; errors: ShippingFormErrors; onChange: (values: ShippingFormValues) => void };

export function ShippingFields({ values, errors, onChange }: ShippingFieldsProps): JSX.Element {
  const set = (field: keyof ShippingFormValues, value: string): void => onChange({ ...values, [field]: value });
  return (
    <div className='space-y-4'>
      <FormField label='Título' error={errors.title}>
        <input value={values.title} onChange={(event) => set('title', event.target.value)} placeholder='Ej: Centro' className={inputClass(Boolean(errors.title))} />
      </FormField>
      <FormField label='Detalle' error={errors.detail}>
        <input value={values.detail} onChange={(event) => set('detail', event.target.value)} placeholder='Ej: Barrio A hasta Barrio B' className={inputClass(Boolean(errors.detail))} />
      </FormField>
      <FormField label='Monto' error={errors.amount}>
        <input inputMode='decimal' value={values.amount} onChange={(event) => set('amount', event.target.value)} placeholder='Ej: 1500' className={inputClass(Boolean(errors.amount))} />
      </FormField>
    </div>
  );
}
