import { create } from 'zustand';
import type { PromotionDef } from '@/features/promotion/domain/promotion.schema';

type PromotionState = {
  promotions: PromotionDef[];
  isLoaded: boolean;
  setPromotions: (promotions: PromotionDef[]) => void;
  setLoaded: (isLoaded: boolean) => void;
};

export const usePromotionStore = create<PromotionState>((set) => ({
  promotions: [],
  isLoaded: false,
  setPromotions: (promotions) => set({ promotions, isLoaded: true }),
  setLoaded: (isLoaded) => set({ isLoaded }),
}));
