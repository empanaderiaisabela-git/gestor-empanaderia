import { useEffect, useMemo, useState } from 'react';
import { createCardAction } from '@/features/card/actions/create-card';
import { deleteCardAction } from '@/features/card/actions/delete-card';
import { fetchCards } from '@/features/card/actions/fetch-cards';
import { toggleCardActiveAction } from '@/features/card/actions/toggle-card-active';
import { updateCardAction } from '@/features/card/actions/update-card';
import type { CardDef, CardInput, CardUpdateInput } from '@/features/card/domain/card.schema';
import { useCardStore } from '@/features/card/store/card.store';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { normalizeForSearch } from '@/lib/utils';

export type CardsPanelModel = {
  manager: ReturnType<typeof useEntityManager<CardDef>>;
  actions: ReturnType<typeof useEntityActions<CardDef, CardInput, CardUpdateInput>>;
  visibleCards: CardDef[];
  initialLoading: boolean;
  showInactive: boolean;
  setShowInactive: (value: boolean) => void;
};

function visible(cards: CardDef[], search: string, showInactive: boolean): CardDef[] {
  const terms = normalizeForSearch(search).split(/\s+/);
  return cards.filter((card) => terms.every((term) => normalizeForSearch(card.name).includes(term)) && (showInactive || card.isActive));
}

function useInitialLoad(isLoaded: boolean, setCards: (rows: CardDef[]) => void): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (isLoaded) return setLoading(false);
    setLoading(true);
    fetchCards().then(setCards).finally(() => setLoading(false));
  }, [isLoaded, setCards]);
  return loading;
}

export function useCardsPanel(): CardsPanelModel {
  const [showInactive, setShowInactive] = useState(false);
  const { cards, setCards, isLoaded } = useCardStore();
  const manager = useEntityManager<CardDef>();
  const versionOf = (id: string): number => cards.find((card) => card.id === id)?.version ?? 0;
  const actions = useEntityActions<CardDef, CardInput, CardUpdateInput>({
    handlers: {
      fetchData: fetchCards,
      createAction: createCardAction,
      updateAction: updateCardAction,
      deleteAction: (id) => deleteCardAction({ id, version: versionOf(id) }),
      toggleActiveAction: (id, isActive) => toggleCardActiveAction({ id, isActive, version: versionOf(id) }),
    },
    setStoreData: setCards,
    onSuccessMessage: (message) => manager.showGlobalMessage('success', message),
    onErrorMessage: (message) => manager.showGlobalMessage('error', message),
    closeFormModal: manager.closeFormModal,
    setServerError: manager.setServerError,
    setItemToDelete: manager.setItemToDelete,
    editingItem: manager.editingItem,
    showInactive,
  });
  const initialLoading = useInitialLoad(isLoaded, setCards);
  const visibleCards = useMemo(() => visible(cards, manager.search, showInactive), [cards, manager.search, showInactive]);
  return { manager, actions, visibleCards, initialLoading, showInactive, setShowInactive };
}
