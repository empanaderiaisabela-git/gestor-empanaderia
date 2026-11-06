import { unitPresentationOf } from '@/features/order/domain/order-groups';
import { mergeLine, type OrderLine, removeFlavor } from '@/features/order/domain/order-line';

export type LineEditActions = {
  removeOne: (lineId: string) => void;
  addOne: (lineId: string) => void;
  addUnit: (lineId: string) => void;
  removeFromOpen: (menuItemId: string) => void;
  toggleHam: (lineId: string) => void;
};

type LineEditState = { lines: OrderLine[]; openLineId: string | null; remove: (lineId: string) => void; removeFromOpenPromo: (menuItemId: string) => void };
type Setter = (partial: { lines: OrderLine[] }) => void;

const withQuantity = (lines: OrderLine[], lineId: string, delta: number): OrderLine[] => lines.map((line) => (line.id === lineId ? { ...line, quantity: line.quantity + delta } : line));

export function lineEditActions(set: Setter, get: () => LineEditState): LineEditActions {
  return {
    removeOne: (lineId) => {
      const line = get().lines.find((candidate) => candidate.id === lineId);
      if (!line || line.quantity <= 1) return get().remove(lineId);
      set({ lines: withQuantity(get().lines, lineId, -1) });
    },
    addOne: (lineId) => set({ lines: withQuantity(get().lines, lineId, 1) }),
    addUnit: (lineId) => {
      const { lines } = get();
      const line = lines.find((candidate) => candidate.id === lineId);
      const unit = line && unitPresentationOf(line.group);
      if (!line || !unit) return;
      const fresh: OrderLine = { id: crypto.randomUUID(), group: line.group, presentationKey: unit.key, flavors: [{ menuItemId: line.flavors[0].menuItemId, units: 1 }], quantity: 1, ham: line.ham };
      set({ lines: mergeLine([...lines, fresh], fresh) });
    },
    toggleHam: (lineId) => set({ lines: get().lines.map((line) => (line.id === lineId ? { ...line, ham: !line.ham } : line)) }),
    removeFromOpen: (menuItemId) => {
      const { lines, openLineId, removeFromOpenPromo } = get();
      const open = lines.find((line) => line.id === openLineId);
      if (!open) return removeFromOpenPromo(menuItemId);
      const next = removeFlavor(open, menuItemId);
      if (next) set({ lines: lines.map((line) => (line.id === next.id ? next : line)) });
    },
  };
}
