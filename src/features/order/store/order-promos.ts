import { type AddMode, isComplete } from '@/features/order/domain/order-line';
import { addToPromo, firstOpenPart, newPromoLine, type PromoLine, type PromoSource } from '@/features/order/domain/promo-line';

export type PromoOpen = { promoId: string; part: number };
export type PromoState = { promos: PromoLine[]; openPromo: PromoOpen | null };

export type PromoActions = {
  startPromo: (promotion: PromoSource) => void;
  addToOpenPromo: (menuItemId: string, mode: AddMode) => boolean;
  reopenPromo: (promoId: string) => void;
  removePromo: (promoId: string) => void;
};

type Setter = (partial: Partial<PromoState> & { openLineId?: string | null }) => void;

export function promoActions(set: Setter, get: () => PromoState): PromoActions {
  const openAt = (promo: PromoLine): PromoOpen | null => {
    const part = firstOpenPart(promo);
    return part === null ? null : { promoId: promo.id, part };
  };
  return {
    startPromo: (promotion) => {
      const promo = newPromoLine(promotion);
      set({ promos: [...get().promos, promo], openPromo: openAt(promo), openLineId: null });
    },
    addToOpenPromo: (menuItemId, mode) => {
      const { promos, openPromo } = get();
      const promo = openPromo && promos.find((candidate) => candidate.id === openPromo.promoId);
      const next = promo && addToPromo(promo, { part: openPromo.part, menuItemId, mode });
      if (!openPromo || !next) return false;
      const stillOpen = !isComplete(next.parts[openPromo.part]);
      set({ promos: promos.map((candidate) => (candidate.id === next.id ? next : candidate)), openPromo: stillOpen ? openPromo : openAt(next) });
      return true;
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
