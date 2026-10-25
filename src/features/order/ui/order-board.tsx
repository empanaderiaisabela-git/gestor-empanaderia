'use client';

import type { JSX } from 'react';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { MENU_GROUPS } from '@/features/menu/domain/menu-groups';
import { CurrentOrder } from './current-order';
import { FlavorPicker } from './flavor-picker';
import { GroupCard } from './group-card';
import { useOrderBoard } from './use-order-board';

type OrderBoardProps = { onCheckout?: () => void };

export function OrderBoard({ onCheckout }: OrderBoardProps): JSX.Element {
  const board = useOrderBoard();
  if (board.loading) return <TableSkeleton />;
  return (
    <div className='flex flex-col gap-4 overflow-y-auto pb-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4'>
        {MENU_GROUPS.map((group) => (
          <GroupCard key={group} group={group} board={board} />
        ))}
      </div>
      <CurrentOrder board={board} onCheckout={onCheckout} />
      <FlavorPicker board={board} />
    </div>
  );
}
