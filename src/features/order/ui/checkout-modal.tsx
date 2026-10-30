'use client';

import { Wallet } from 'lucide-react';
import { type FormEvent, type JSX, useEffect, useState } from 'react';
import { ErrorAlert } from '@/components/ui/alert';
import { FormField, inputClass } from '@/components/ui/form-field';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { orderSubtotal } from '@/features/order/domain/promo-line';
import { useOrderStore } from '@/features/order/store/order.store';
import { formatMoney } from '@/lib/format-money';
import { BLANK_CHECKOUT, type CheckoutForm, checkCheckout } from './checkout-form';
import { useActiveCards } from './credit-fields';
import { PaymentPicker } from './payment-picker';
import type { CheckoutModel } from './use-checkout';
import type { OrderBoardModel } from './use-order-board';

type CheckoutModalProps = { model: CheckoutModel; board: OrderBoardModel };
type DiscountFieldsProps = { form: CheckoutForm; onChange: (form: CheckoutForm) => void };

function DiscountFields({ form, onChange }: DiscountFieldsProps): JSX.Element {
  return (
    <div className='grid grid-cols-2 gap-3'>
      <FormField label='Descuento %'>
        <input inputMode='decimal' value={form.percentage} onChange={(event) => onChange({ ...form, percentage: event.target.value })} placeholder='0' className={inputClass(false)} />
      </FormField>
      <FormField label='Descuento $'>
        <input inputMode='decimal' value={form.amount} onChange={(event) => onChange({ ...form, amount: event.target.value })} placeholder='0' className={inputClass(false)} />
      </FormField>
    </div>
  );
}

export function CheckoutModal({ model, board }: CheckoutModalProps): JSX.Element {
  const { lines, promos, buyer } = useOrderStore();
  const [form, setForm] = useState(BLANK_CHECKOUT);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const cards = useActiveCards();
  const subtotal = orderSubtotal(lines.filter((line) => line.flavors.length > 0), promos, board.book) ?? 0;
  const check = checkCheckout(subtotal, form);

  useEffect(() => {
    setForm(BLANK_CHECKOUT);
    setError(null);
  }, [model.isOpen]);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (check.error) return setError(check.error);
    setPending(true);
    setError(await model.confirm(check));
    setPending(false);
  };

  return (
    <ResponsiveModal isOpen={model.isOpen} onClose={model.close} title='Cobrar pedido' icon={<Wallet className='w-5 h-5 text-brand-600' />} width='sm' onSubmit={submit} submitLabel={`Confirmar ${formatMoney(check.total)}`} isPending={pending}>
      <ErrorAlert error={error} />
      <div className='space-y-4'>
        <p className='text-sm text-zinc-700 dark:text-zinc-200'>
          Cliente: {[buyer.name, buyer.phone, buyer.address].map((value) => value.trim()).filter(Boolean).join(' · ')} · Subtotal {formatMoney(subtotal)}
        </p>
        <DiscountFields form={form} onChange={setForm} />
        <PaymentPicker form={form} total={check.total} cards={cards} onChange={setForm} />
        <p className='text-right'>
          <span className='block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-200'>Total a cobrar</span>
          <span className='text-2xl font-black text-zinc-900 dark:text-zinc-50'>{formatMoney(check.total)}</span>
        </p>
      </div>
    </ResponsiveModal>
  );
}
