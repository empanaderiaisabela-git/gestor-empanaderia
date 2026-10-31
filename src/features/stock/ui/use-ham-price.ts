import { useEffect, useState } from 'react';
import { fetchHamPrice } from '@/features/menu/actions/fetch-ham-price';
import { type HamPriceDef, NO_HAM_PRICE } from '@/features/menu/domain/pizza-extra.schema';

export function useHamPrice(): { ham: HamPriceDef; setHam: (ham: HamPriceDef) => void } {
  const [ham, setHam] = useState<HamPriceDef>(NO_HAM_PRICE);
  useEffect(() => {
    fetchHamPrice().then(setHam);
  }, []);
  return { ham, setHam };
}
