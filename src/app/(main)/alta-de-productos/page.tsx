'use client';

import type { JSX } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { MenuPanel } from '@/features/menu/ui/menu-panel';

export default function MenuItemsPage(): JSX.Element {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <PageHeader title='Alta de productos' description='Gustos de cada comida y bebidas de Coca-Cola y Pepsi, con su costo y sus precios.' />
      <MenuPanel />
    </div>
  );
}
