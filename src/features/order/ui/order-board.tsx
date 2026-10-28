'use client';

import type { JSX } from 'react';
import { GlobalMessage } from '@/components/ui/alert';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { MENU_GROUPS } from '@/features/menu/domain/menu-groups';
import { CheckoutModal } from './checkout-modal';
import { FlavorPicker } from './flavor-picker';
import { GroupCard } from './group-card';
import { OrderDrawer } from './order-drawer';
import { PromoCard } from './promo-card';
import { useCheckout } from './use-checkout';
import { useOrderBoard } from './use-order-board';

export function OrderBoard(): JSX.Element {
  const board = useOrderBoard();
  const checkout = useCheckout();
  if (board.loading) return <TableSkeleton />;
  return (
    <div className='flex flex-col gap-4 overflow-y-auto pb-24'>
      <GlobalMessage message={checkout.notice} />
      <div className='grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4'>
        {MENU_GROUPS.map((group) => (
          <GroupCard key={group} group={group} board={board} />
        ))}
        <PromoCard board={board} />
      </div>
      <OrderDrawer board={board} onCheckout={checkout.open} />
      <FlavorPicker board={board} />
      <CheckoutModal model={checkout} board={board} />
    </div>
  );
}
