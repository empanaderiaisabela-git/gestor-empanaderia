import type { AddMode } from '@/features/order/domain/order-line';
import { addToPromo, firstOpenPart, newPromoLine, type PromoLine, type PromoSource, removeFromPromo } from '@/features/order/domain/promo-line';

export type PromoOpen = { promoId: string; part: number };
export type PromoState = { promos: PromoLine[]; openPromo: PromoOpen | null };

export type PromoActions = {
  startPromo: (promotion: PromoSource) => void;
  addToOpenPromo: (menuItemId: string, mode: AddMode) => boolean;
  removeFromOpenPromo: (menuItemId: string) => void;
  nextPromoPart: () => void;
  reopenPromo: (promoId: string) => void;
  removePromo: (promoId: string) => void;
};

type Setter = (partial: Partial<PromoState> & { openLineId?: string | null }) => void;

function openOne({ promos, openPromo }: PromoState): { promo: PromoLine; part: number } | null {
  const promo = openPromo && promos.find((candidate) => candidate.id === openPromo.promoId);
  return promo && openPromo ? { promo, part: openPromo.part } : null;
}

export function promoActions(set: Setter, get: () => PromoState): PromoActions {
  const openAt = (promo: PromoLine): PromoOpen | null => {
    const part = firstOpenPart(promo);
    return part === null ? null : { promoId: promo.id, part };
  };
  const replace = (next: PromoLine): void => set({ promos: get().promos.map((candidate) => (candidate.id === next.id ? next : candidate)) });
  return {
    startPromo: (promotion) => {
      const promo = newPromoLine(promotion);
      set({ promos: [...get().promos, promo], openPromo: openAt(promo), openLineId: null });
    },
    addToOpenPromo: (menuItemId, mode) => {
      const open = openOne(get());
      const next = open && addToPromo(open.promo, { part: open.part, menuItemId, mode });
      if (next) replace(next);
      return Boolean(next);
    },
    removeFromOpenPromo: (menuItemId) => {
      const open = openOne(get());
      const next = open && removeFromPromo(open.promo, open.part, menuItemId);
      if (next) replace(next);
    },
    nextPromoPart: () => {
      const open = openOne(get());
      const last = !open || open.part >= open.promo.parts.length - 1;
      set({ openPromo: last || !open ? null : { promoId: open.promo.id, part: open.part + 1 } });
    },
    reopenPromo: (promoId) => {
      const promo = get().promos.find((candidate) => candidate.id === promoId);
      set({ openPromo: promo ? openAt(promo) : null, openLineId: null });
    },
    removePromo: (promoId) => {
      const { promos, openPromo } = get();
      set({ promos: promos.filter((promo) => promo.id !== promoId), openPromo: openPromo?.promoId === promoId ? null : openPromo });
    },
  };
}
