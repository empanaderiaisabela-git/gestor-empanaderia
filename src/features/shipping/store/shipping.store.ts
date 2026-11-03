import { create } from 'zustand';
import type { ShippingDef } from '@/features/shipping/domain/shipping.schema';

type ShippingState = {
  shippings: ShippingDef[];
  isLoaded: boolean;
  setShippings: (shippings: ShippingDef[]) => void;
  setLoaded: (isLoaded: boolean) => void;
};

export const useShippingStore = create<ShippingState>((set) => ({
  shippings: [],
  isLoaded: false,
  setShippings: (shippings) => set({ shippings, isLoaded: true }),
  setLoaded: (isLoaded) => set({ isLoaded }),
}));
