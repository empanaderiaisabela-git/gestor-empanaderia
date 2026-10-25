import type { JSX, ReactNode } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { ProviderInput } from '@/features/provider/domain/provider.schema';

type ProviderFormFieldsProps = {
  register: UseFormRegister<ProviderInput>;
  errors: FieldErrors<ProviderInput>;
};

const inputClass = (hasError: boolean): string =>
  `w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-brand-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${hasError ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`;

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }): JSX.Element {
  return (
    <div>
      <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>{label}</label>
      {children}
      {error && <p className='text-red-500 text-xs mt-1.5'>{error}</p>}
    </div>
  );
}

export function ProviderFormFields({ register, errors }: ProviderFormFieldsProps): JSX.Element {
  const phone = register('phone');
  return (
    <div className='space-y-4'>
      <Field label='Razón Social / Identificador' error={errors.name?.message}>
        <input type='text' {...register('name')} placeholder='Ej: Distribuidora del Sur SRL' className={inputClass(Boolean(errors.name))} />
      </Field>
      <Field label='Línea Telefónica Directa' error={errors.phone?.message}>
        <input
          type='text'
          {...phone}
          onChange={(event) => {
            event.target.value = event.target.value.replace(/[^0-9+\s]/g, '');
            return phone.onChange(event);
          }}
          placeholder='+54 9 11 1234-5678'
          className={inputClass(Boolean(errors.phone))}
        />
      </Field>
      <Field label='Correo Electrónico Comercial' error={errors.email?.message}>
        <input type='email' {...register('email')} placeholder='ventas@distribuidora.com' className={inputClass(Boolean(errors.email))} />
      </Field>
    </div>
  );
}
