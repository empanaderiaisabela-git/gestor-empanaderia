import { useEffect, useMemo, useState } from 'react';
import { createPromotionAction } from '@/features/promotion/actions/create-promotion';
import { deletePromotionAction } from '@/features/promotion/actions/delete-promotion';
import { fetchPromotions } from '@/features/promotion/actions/fetch-promotions';
import { togglePromotionActiveAction } from '@/features/promotion/actions/toggle-promotion-active';
import { updatePromotionAction } from '@/features/promotion/actions/update-promotion';
import type { PromotionDef, PromotionInput, PromotionUpdateInput } from '@/features/promotion/domain/promotion.schema';
import { usePromotionStore } from '@/features/promotion/store/promotion.store';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { normalizeForSearch } from '@/lib/utils';

export type PromotionsPanelModel = {
  manager: ReturnType<typeof useEntityManager<PromotionDef>>;
  actions: ReturnType<typeof useEntityActions<PromotionDef, PromotionInput, PromotionUpdateInput>>;
  visiblePromotions: PromotionDef[];
  initialLoading: boolean;
  showInactive: boolean;
  setShowInactive: (value: boolean) => void;
};

function visible(promotions: PromotionDef[], search: string, showInactive: boolean): PromotionDef[] {
  const terms = normalizeForSearch(search).split(/\s+/);
  return promotions.filter((promotion) => terms.every((term) => normalizeForSearch(promotion.name).includes(term)) && (showInactive || promotion.isActive));
}

function useInitialLoad(isLoaded: boolean, setPromotions: (rows: PromotionDef[]) => void): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (isLoaded) return setLoading(false);
    setLoading(true);
    fetchPromotions().then(setPromotions).finally(() => setLoading(false));
  }, [isLoaded, setPromotions]);
  return loading;
}

export function usePromotionsPanel(): PromotionsPanelModel {
  const [showInactive, setShowInactive] = useState(false);
  const { promotions, setPromotions, isLoaded } = usePromotionStore();
  const manager = useEntityManager<PromotionDef>();
  const versionOf = (id: string): number => promotions.find((promotion) => promotion.id === id)?.version ?? 0;
  const actions = useEntityActions<PromotionDef, PromotionInput, PromotionUpdateInput>({
    handlers: {
      fetchData: fetchPromotions,
      createAction: createPromotionAction,
      updateAction: updatePromotionAction,
      deleteAction: (id) => deletePromotionAction({ id, version: versionOf(id) }),
      toggleActiveAction: (id, isActive) => togglePromotionActiveAction({ id, isActive, version: versionOf(id) }),
    },
    setStoreData: setPromotions,
    onSuccessMessage: (message) => manager.showGlobalMessage('success', message),
    onErrorMessage: (message) => manager.showGlobalMessage('error', message),
    closeFormModal: manager.closeFormModal,
    setServerError: manager.setServerError,
    setItemToDelete: manager.setItemToDelete,
    editingItem: manager.editingItem,
    showInactive,
  });
  const initialLoading = useInitialLoad(isLoaded, setPromotions);
  const visiblePromotions = useMemo(() => visible(promotions, manager.search, showInactive), [promotions, manager.search, showInactive]);
  return { manager, actions, visiblePromotions, initialLoading, showInactive, setShowInactive };
}
