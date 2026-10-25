'use client';

import type { JSX } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { OrderBoard } from '@/features/order/ui/order-board';

export default function NewSalePage(): JSX.Element {
  return (
    <div className='flex flex-col h-full overflow-hidden'>
      <PageHeader title='Ventas' description='Tocá una cantidad para sumarla al pedido.' />
      <OrderBoard />
    </div>
  );
}
