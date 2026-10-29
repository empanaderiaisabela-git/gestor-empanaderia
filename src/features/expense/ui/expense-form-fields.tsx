import type { JSX } from 'react';
import { FormField, inputClass } from '@/components/ui/form-field';
import type { ProviderDef } from '@/features/provider/domain/provider.schema';
import type { ExpenseFormErrors, ExpenseFormValues } from './expense-form';

export type ExpenseFieldsProps = {
  values: ExpenseFormValues;
  errors: ExpenseFormErrors;
  providers: ProviderDef[];
  currentProviderId: string | null;
  onChange: (values: ExpenseFormValues) => void;
};

function ProviderSelect({ values, errors, providers, currentProviderId, onChange }: ExpenseFieldsProps): JSX.Element {
  return (
    <FormField label='Proveedor' error={errors.providerId}>
      <select value={values.providerId} onChange={(event) => onChange({ ...values, providerId: event.target.value })} className={inputClass(Boolean(errors.providerId))}>
        <option value=''>Elegí un proveedor</option>
        {providers.filter((provider) => provider.isActive || provider.id === currentProviderId).map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.name}
          </option>
        ))}
      </select>
    </FormField>
  );
}

export function ExpenseFields(props: ExpenseFieldsProps): JSX.Element {
  const { values, errors, onChange } = props;
  const set = (field: keyof ExpenseFormValues, value: string): void => onChange({ ...values, [field]: value });
  return (
    <div className='space-y-4'>
      <FormField label='Número de factura' error={errors.invoiceNumber}>
        <input value={values.invoiceNumber} onChange={(event) => set('invoiceNumber', event.target.value)} placeholder='Ej: A-0001-00001234' className={inputClass(Boolean(errors.invoiceNumber))} />
      </FormField>
      <FormField label='Título' error={errors.title}>
        <input value={values.title} onChange={(event) => set('title', event.target.value)} placeholder='Ej: Harina 25 kg' className={inputClass(Boolean(errors.title))} />
      </FormField>
      <ProviderSelect {...props} />
      <div className='grid grid-cols-2 gap-3'>
        <FormField label='Monto' error={errors.amount}>
          <input inputMode='decimal' value={values.amount} onChange={(event) => set('amount', event.target.value)} placeholder='Ej: 18500' className={inputClass(Boolean(errors.amount))} />
        </FormField>
        <FormField label='Fecha de la factura' error={errors.invoiceDate}>
          <input type='date' value={values.invoiceDate} onChange={(event) => set('invoiceDate', event.target.value)} className={inputClass(Boolean(errors.invoiceDate))} />
        </FormField>
      </div>
    </div>
  );
}
