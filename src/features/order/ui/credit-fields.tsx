'use client';

import { type JSX, useEffect } from 'react';
import { FormField, inputClass } from '@/components/ui/form-field';
import { fetchCards } from '@/features/card/actions/fetch-cards';
import { describePlan } from '@/features/card/domain/card-describe';
import type { CardDef } from '@/features/card/domain/card.schema';
import { useCardStore } from '@/features/card/store/card.store';
import type { CheckoutForm } from './checkout-form';

type CreditFieldsProps = { form: CheckoutForm; cards: CardDef[]; onChange: (form: CheckoutForm) => void };

export function useActiveCards(): CardDef[] {
  const { cards, isLoaded, setCards } = useCardStore();
  useEffect(() => {
    if (!isLoaded) fetchCards().then(setCards);
  }, [isLoaded, setCards]);
  return cards.filter((card) => card.isActive);
}

export function CreditFields({ form, cards, onChange }: CreditFieldsProps): JSX.Element {
  const card = cards.find((candidate) => candidate.id === form.cardId);
  if (cards.length === 0) return <p className='text-sm font-semibold text-amber-800 dark:text-amber-300'>No hay tarjetas cargadas: el admin las da de alta en Tarjetas.</p>;
  return (
    <div className='grid grid-cols-2 gap-3'>
      <FormField label='Tarjeta'>
        <select value={form.cardId} onChange={(event) => onChange({ ...form, cardId: event.target.value, installments: '' })} className={inputClass(false)}>
          <option value=''>Elegí una tarjeta</option>
          {cards.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label='Cuotas'>
        <select value={form.installments} disabled={!card} onChange={(event) => onChange({ ...form, installments: event.target.value })} className={inputClass(false)}>
          <option value=''>Elegí las cuotas</option>
          {card?.plans.map((plan) => (
            <option key={plan.installments} value={String(plan.installments)}>
              {describePlan(plan)}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
}
