'use client';

import { type JSX, useEffect } from 'react';
import { fetchCustomers } from '@/features/customer/actions/customer.actions';
import type { CustomerDef } from '@/features/customer/domain/customer.schema';
import { suggestCustomers } from '@/features/customer/domain/customer-search';
import { useCustomerStore } from '@/features/customer/store/customer.store';
import { useOrderStore } from '@/features/order/store/order.store';

const field = 'mt-1 w-full px-3 py-2 border rounded-lg border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950';
const label = 'block text-sm text-zinc-900 dark:text-zinc-100';

function useCustomerList(): CustomerDef[] {
  const { customers, isLoaded, setCustomers } = useCustomerStore();
  useEffect(() => {
    if (!isLoaded) void fetchCustomers().then(setCustomers);
  }, [isLoaded, setCustomers]);
  return customers;
}

function Suggestions({ customers, onPick }: { customers: CustomerDef[]; onPick: (customer: CustomerDef) => void }): JSX.Element | null {
  if (customers.length === 0) return null;
  return (
    <ul aria-label='Clientes sugeridos' className='rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800'>
      {customers.map((customer) => (
        <li key={customer.id}>
          <button type='button' onClick={() => onPick(customer)} className='w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800'>
            <span className='font-semibold text-zinc-900 dark:text-zinc-50'>{customer.name}</span>
            {customer.phone && <span className='text-sm text-zinc-700 dark:text-zinc-200'> · {customer.phone}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function CustomerFields(): JSX.Element {
  const { buyer, setBuyer } = useOrderStore();
  const customers = useCustomerList();
  const suggestions = buyer.customerId ? [] : suggestCustomers(customers, [buyer.name, buyer.phone]);
  const pick = (customer: CustomerDef): void => setBuyer({ customerId: customer.id, name: customer.name, phone: customer.phone, address: customer.address });
  return (
    <div className='space-y-2'>
      <label className={label}>
        Nombre del cliente
        <input value={buyer.name} maxLength={100} autoComplete='off' onChange={(event) => setBuyer({ name: event.target.value, customerId: null })} className={field} />
      </label>
      <Suggestions customers={suggestions} onPick={pick} />
      {buyer.customerId && <p className='text-xs font-semibold text-emerald-700 dark:text-emerald-300'>Cliente registrado</p>}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
        <label className={label}>
          Teléfono (opcional)
          <input value={buyer.phone} maxLength={30} inputMode='tel' autoComplete='off' onChange={(event) => setBuyer({ phone: event.target.value })} className={field} />
        </label>
        <label className={label}>
          Domicilio (opcional)
          <input value={buyer.address} maxLength={150} autoComplete='off' onChange={(event) => setBuyer({ address: event.target.value })} className={field} />
        </label>
      </div>
    </div>
  );
}
