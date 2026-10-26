import { create } from 'zustand';
import type { CardDef } from '@/features/card/domain/card.schema';

type CardState = {
  cards: CardDef[];
  isLoaded: boolean;
  setCards: (cards: CardDef[]) => void;
  setLoaded: (isLoaded: boolean) => void;
};

export const useCardStore = create<CardState>((set) => ({
  cards: [],
  isLoaded: false,
  setCards: (cards) => set({ cards, isLoaded: true }),
  setLoaded: (isLoaded) => set({ isLoaded }),
}));
