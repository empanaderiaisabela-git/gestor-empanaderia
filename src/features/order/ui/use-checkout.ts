import { useState } from 'react';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { checkoutAction } from '@/features/order/actions/checkout';
import type { Discount, Payment } from '@/features/order/domain/order-validation';
import { useOrderStore } from '@/features/order/store/order.store';

export type Notice = { type: 'success' | 'error'; text: string };
export type CheckoutDraft = { discount: Discount; payments: Payment[] };

export type CheckoutModel = {
  isOpen: boolean;
  notice: Notice | null;
  open: () => void;
  close: () => void;
  confirm: (draft: CheckoutDraft) => Promise<string | null>;
};

async function submit({ discount, payments }: CheckoutDraft): ReturnType<typeof checkoutAction> {
  const { lines, buyerName } = useOrderStore.getState();
  const filled = lines.filter((line) => line.flavors.length > 0);
  return checkoutAction({
    buyerName,
    lines: filled.map(({ group, presentationKey, flavors, quantity }) => ({ group, presentationKey, flavors, quantity })),
    discountPercentage: discount.percentage,
    discountAmount: discount.amount,
    payments,
  });
}

export function useCheckout(): CheckoutModel {
  const [isOpen, setOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const confirm = async (draft: CheckoutDraft): Promise<string | null> => {
    const result = await submit(draft);
    useMenuStore.getState().setLoaded(false);
    if (!result.success) return result.error;
    useOrderStore.getState().clear();
    setOpen(false);
    setNotice({ type: 'success', text: result.message ?? 'Venta registrada' });
    return null;
  };

  const open = (): void => {
    setNotice(null);
    setOpen(true);
  };

  return { isOpen, notice, open, close: () => setOpen(false), confirm };
}
