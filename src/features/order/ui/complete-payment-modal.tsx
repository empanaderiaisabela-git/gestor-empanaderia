'use client';

import { Wallet } from 'lucide-react';
import { type FormEvent, type JSX, useEffect, useState } from 'react';
import { ErrorAlert } from '@/components/ui/alert';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { completeSalePaymentAction } from '@/features/order/actions/complete-sale-payment';
import { buyerLabel, type SaleDef } from '@/features/order/domain/sale-history.schema';
import { formatMoney } from '@/lib/format-money';
import { BLANK_CHECKOUT, checkCheckout } from './checkout-form';
import { DiscountFields } from './checkout-modal';
import { useActiveCards } from './credit-fields';
import { PaymentPicker } from './payment-picker';

type CompletePaymentModalProps = { sale: SaleDef | null; onClose: () => void; onDone: (message: string) => void };

export function CompletePaymentModal({ sale, onClose, onDone }: CompletePaymentModalProps): JSX.Element {
  const [form, setForm] = useState(BLANK_CHECKOUT);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const cards = useActiveCards();
  const subtotal = sale ? sale.lines.reduce((sum, line) => sum + line.subtotal, 0) : 0;
  const check = checkCheckout(subtotal, form, sale?.shippingAmount ?? 0);

  useEffect(() => {
    setForm(BLANK_CHECKOUT);
    setError(null);
  }, [sale]);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!sale) return;
    if (check.error || check.payments.length === 0) return setError(check.error ?? 'Elegí un medio de pago');
    setPending(true);
    const result = await completeSalePaymentAction({ saleId: sale.id, discountPercentage: check.discount.percentage, discountAmount: check.discount.amount, payments: check.payments });
    setPending(false);
    if (!result.success) return setError(result.error);
    onDone(result.message ?? 'Pago completado');
  };

  return (
    <ResponsiveModal isOpen={Boolean(sale)} onClose={onClose} title='Completar pago' icon={<Wallet className='w-5 h-5 text-brand-600' />} width='sm' onSubmit={submit} submitLabel={`Confirmar ${formatMoney(check.total)}`} isPending={pending}>
      <ErrorAlert error={error} />
      <div className='space-y-4'>
        <p className='text-sm text-zinc-700 dark:text-zinc-200'>{`${sale ? buyerLabel(sale.buyerName) : ''} · Subtotal ${formatMoney(subtotal)}${sale?.shippingTitle ? ` · Envío ${sale.shippingTitle} ${formatMoney(sale.shippingAmount)}` : ''}`}</p>
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
