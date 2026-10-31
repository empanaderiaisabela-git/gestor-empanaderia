import type { JSX } from 'react';
import { FormField, inputClass } from '@/components/ui/form-field';
import type { ProviderDef } from '@/features/provider/domain/provider.schema';
import type { EntryValues, FormErrors } from './stock-forms';

type OptionalFieldsProps = { values: EntryValues; errors: FormErrors; providers: ProviderDef[]; onChange: (values: EntryValues) => void };

export function MinStockField({ values, errors, onChange }: Omit<OptionalFieldsProps, 'providers'>): JSX.Element {
  return (
    <FormField label='Stock mínimo (opcional)' error={errors.minStock}>
      <input inputMode='numeric' value={values.minStock} onChange={(event) => onChange({ ...values, minStock: event.target.value })} placeholder='Sin mínimo' className={inputClass(Boolean(errors.minStock))} />
    </FormField>
  );
}

export function ProviderField({ values, errors, providers, onChange }: OptionalFieldsProps): JSX.Element {
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
