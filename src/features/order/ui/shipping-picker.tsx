'use client';

import { type JSX, useEffect } from 'react';
import { FormField, inputClass } from '@/components/ui/form-field';
import { useOrderStore } from '@/features/order/store/order.store';
import { fetchShippingOptions } from '@/features/shipping/actions/fetch-shipping-options';
import type { ShippingDef } from '@/features/shipping/domain/shipping.schema';
import { useShippingStore } from '@/features/shipping/store/shipping.store';
import { formatMoney } from '@/lib/format-money';

export function useChosenShipping(): { options: ShippingDef[]; chosen: ShippingDef | null } {
  const { shippings, isLoaded, setShippings } = useShippingStore();
  const shippingId = useOrderStore((state) => state.shippingId);
  useEffect(() => {
    if (!isLoaded) fetchShippingOptions().then(setShippings);
  }, [isLoaded, setShippings]);
  const options = shippings.filter((shipping) => shipping.isActive);
  return { options, chosen: options.find((shipping) => shipping.id === shippingId) ?? null };
}

type ShippingPickerProps = { options: ShippingDef[]; chosen: ShippingDef | null; missingAddress: boolean };

export function ShippingPicker({ options, chosen, missingAddress }: ShippingPickerProps): JSX.Element {
  const setShipping = useOrderStore((state) => state.setShipping);
  return (
    <div className='w-full sm:w-64'>
      <FormField label='Envío' error={missingAddress ? 'Falta el domicilio' : undefined}>
        <select value={chosen?.id ?? ''} onChange={(event) => setShipping(event.target.value || null)} className={inputClass(missingAddress)}>
          <option value=''>Sin envío</option>
          {options.map((shipping) => (
            <option key={shipping.id} value={shipping.id}>
              {shipping.title} · {formatMoney(shipping.amount)}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
}
