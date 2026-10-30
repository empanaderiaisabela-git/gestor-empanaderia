import { create } from 'zustand';
import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import { type AddMode, addFlavor, isComplete, mergeLine, type OrderLine } from '@/features/order/domain/order-line';
import { type LineEditActions, lineEditActions } from './order-line-actions';
import { type PromoActions, promoActions, type PromoState } from './order-promos';

type OrderState = PromoState &
  PromoActions &
  LineEditActions & {
    lines: OrderLine[];
    openLineId: string | null;
    buyerName: string;
    start: (group: MenuGroup, presentationKey: string) => void;
    add: (menuItemId: string, mode: AddMode) => boolean;
    close: () => void;
    remove: (lineId: string) => void;
    clear: () => void;
    setBuyerName: (buyerName: string) => void;
  };

const newLine = (group: MenuGroup, presentationKey: string): OrderLine => ({ id: crypto.randomUUID(), group, presentationKey, flavors: [], quantity: 1 });
const withoutEmpty = (lines: OrderLine[]): OrderLine[] => lines.filter((line) => line.flavors.length > 0);

export const useOrderStore = create<OrderState>((set, get) => ({
  lines: [],
  openLineId: null,
  buyerName: '',
  promos: [],
  openPromo: null,
  ...promoActions(set, get),
  ...lineEditActions(set, get),
  start: (group, presentationKey) => {
    const line = newLine(group, presentationKey);
    set({ lines: [...withoutEmpty(get().lines), line], openLineId: line.id, openPromo: null });
  },
  add: (menuItemId, mode) => {
    const { lines, openLineId } = get();
    const open = lines.find((line) => line.id === openLineId);
    const next = open && addFlavor(open, menuItemId, mode);
    if (!open || !next) return false;
    if (!isComplete(next)) {
      set({ lines: mergeLine(lines, next) });
      return true;
    }
    const fresh = newLine(open.group, open.presentationKey);
    set({ lines: [...mergeLine(lines, next), fresh], openLineId: fresh.id });
    return true;
  },
  close: () => set({ lines: withoutEmpty(get().lines), openLineId: null, openPromo: null }),
  remove: (lineId) => set({ lines: get().lines.filter((line) => line.id !== lineId), openLineId: get().openLineId === lineId ? null : get().openLineId }),
  clear: () => set({ lines: [], openLineId: null, buyerName: '', promos: [], openPromo: null }),
  setBuyerName: (buyerName) => set({ buyerName }),
}));
