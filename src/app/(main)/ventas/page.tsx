'use client';

import type { JSX } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { SaleHistoryPanel } from '@/features/order/ui/sale-history-panel';

export default function SalesPage(): JSX.Element {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <PageHeader title='Ventas/Pedidos' description='Ventas registradas. Para cargar una, tocá "Nuevo pedido".' />
      <SaleHistoryPanel />
    </div>
  );
}
