'use client';

import { Ticket, X } from 'lucide-react';
import { type JSX, useEffect, useState } from 'react';
import { useOrderStore } from '@/features/order/store/order.store';
import { CurrentOrder } from './current-order';
import type { OrderBoardModel } from './use-order-board';

type OrderDrawerProps = { board: OrderBoardModel; onCheckout: () => void };

function useProductCount(): number {
  const lines = useOrderStore((state) => state.lines);
  const promos = useOrderStore((state) => state.promos.length);
  return lines.filter((line) => line.flavors.length > 0).reduce((sum, line) => sum + line.quantity, 0) + promos;
}

function useCloseOnEscape(isOpen: boolean, setIsOpen: (open: boolean) => void): void {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, setIsOpen]);
}

function CartButton({ count, onOpen }: { count: number; onOpen: () => void }): JSX.Element {
  return (
    <button onClick={onOpen} aria-label={count > 0 ? `Ver pedido (${count})` : 'Ver pedido'} className='fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-brand-600 text-white shadow-lg flex items-center justify-center hover:bg-brand-700'>
      <Ticket className='w-6 h-6' aria-hidden='true' />
      {count > 0 && <span className='absolute -top-1 -right-1 min-w-6 h-6 px-1.5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center'>{count.toLocaleString('es-AR')}</span>}
    </button>
  );
}

export function OrderDrawer({ board, onCheckout }: OrderDrawerProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const count = useProductCount();
  const close = (): void => setIsOpen(false);
  useCloseOnEscape(isOpen, setIsOpen);
  return (
    <>
      <CartButton count={count} onOpen={() => setIsOpen(true)} />
      <div onClick={close} aria-hidden='true' className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-[450ms] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <aside aria-label='Carrito' aria-hidden={!isOpen} inert={!isOpen} className={`fixed inset-y-0 right-0 z-40 w-full sm:max-w-xl lg:w-[45vw] lg:max-w-none flex flex-col bg-zinc-50 dark:bg-zinc-950 shadow-2xl transition-[transform,visibility] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full invisible'}`}>
        <div className='flex justify-end p-2'>
          <button onClick={close} aria-label='Cerrar pedido' className='p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800'>
            <X className='w-5 h-5' aria-hidden='true' />
          </button>
        </div>
        <div className='flex-1 overflow-y-auto px-4 pb-4'>
          <CurrentOrder
            board={board}
            onCheckout={() => {
              close();
              onCheckout();
            }}
          />
        </div>
      </aside>
    </>
  );
}
