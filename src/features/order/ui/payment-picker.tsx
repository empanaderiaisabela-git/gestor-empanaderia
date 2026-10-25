'use client';

import type { JSX } from 'react';
import { FormField, inputClass } from '@/components/ui/form-field';
import { PAYMENT_LABELS, PAYMENT_TYPES } from '@/features/order/domain/order-validation';
import { formatMoney } from '@/lib/format-money';
import { type CheckoutForm, paymentsOf, toggleMethod } from './checkout-form';

type PaymentPickerProps = { form: CheckoutForm; total: number; onChange: (form: CheckoutForm) => void };

const chip = (pressed: boolean): string =>
  `px-3 py-2 rounded-lg border text-sm font-semibold transition ${pressed ? 'bg-brand-600 border-brand-600 text-white' : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'}`;

export function PaymentPicker({ form, total, onChange }: PaymentPickerProps): JSX.Element {
  const [first, second] = form.methods;
  const rest = paymentsOf(total, form)[1]?.amount ?? 0;
  return (
    <fieldset className='space-y-3'>
      <legend className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>Medio de pago (hasta 2)</legend>
      <div className='grid grid-cols-2 gap-2'>
        {PAYMENT_TYPES.map((type) => (
          <button key={type} type='button' aria-pressed={form.methods.includes(type)} onClick={() => onChange({ ...form, methods: toggleMethod(form.methods, type) })} className={chip(form.methods.includes(type))}>
            {PAYMENT_LABELS[type]}
          </button>
        ))}
      </div>
      {first && second && (
        <>
          <FormField label={`Monto en ${PAYMENT_LABELS[first]}`}>
            <input inputMode='decimal' value={form.split} onChange={(event) => onChange({ ...form, split: event.target.value })} placeholder='0' className={inputClass(false)} />
          </FormField>
          <p className='text-sm text-zinc-600 dark:text-zinc-400'>
            Resto en {PAYMENT_LABELS[second]}: {Number.isFinite(rest) ? formatMoney(rest) : '—'}
          </p>
        </>
      )}
    </fieldset>
  );
}
