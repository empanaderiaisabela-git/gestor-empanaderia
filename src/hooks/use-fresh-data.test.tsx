import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCardStore } from '@/features/card/store/card.store';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { useStatsStore } from '@/features/stats/store/stats.store';
import { useFreshDataOnEnter } from './use-fresh-data';

const route = vi.hoisted(() => ({ pathname: '/stock' }));
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }));

const loaded = (): boolean[] => [useMenuStore, useCardStore, useStatsStore].map((store) => store.getState().isLoaded);

describe('datos al día al entrar a cada pantalla (US-38 CA-1)', () => {
  beforeEach(() => {
    route.pathname = '/stock';
    [useMenuStore, useCardStore, useStatsStore].forEach((store) => store.getState().setLoaded(true));
  });

  it('al entrar a otra pantalla, todas las cachés quedan para volver a leer', () => {
    const { rerender } = renderHook(() => useFreshDataOnEnter());
    expect(loaded()).toEqual([false, false, false]);
    [useMenuStore, useCardStore, useStatsStore].forEach((store) => store.getState().setLoaded(true));
    rerender();
    expect(loaded()).toEqual([true, true, true]);
    route.pathname = '/';
    rerender();
    expect(loaded()).toEqual([false, false, false]);
  });
});
