import { useEffect, useMemo, useState } from 'react';
import { createShippingAction } from '@/features/shipping/actions/create-shipping';
import { deleteShippingAction } from '@/features/shipping/actions/delete-shipping';
import { fetchShippingOptions } from '@/features/shipping/actions/fetch-shipping-options';
import { toggleShippingActiveAction } from '@/features/shipping/actions/toggle-shipping-active';
import { updateShippingAction } from '@/features/shipping/actions/update-shipping';
import type { ShippingDef, ShippingInput, ShippingUpdateInput } from '@/features/shipping/domain/shipping.schema';
import { useShippingStore } from '@/features/shipping/store/shipping.store';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { formatMoney } from '@/lib/format-money';
import { matchesAllWords } from '@/lib/utils';

export type ShippingsPanelModel = {
  manager: ReturnType<typeof useEntityManager<ShippingDef>>;
  actions: ReturnType<typeof useEntityActions<ShippingDef, ShippingInput, ShippingUpdateInput>>;
  visibleShippings: ShippingDef[];
  initialLoading: boolean;
  showInactive: boolean;
  setShowInactive: (value: boolean) => void;
};

function visible(shippings: ShippingDef[], search: string, showInactive: boolean): ShippingDef[] {
  const matches = (shipping: ShippingDef): boolean => matchesAllWords([shipping.title, shipping.detail, formatMoney(shipping.amount), shipping.isActive ? '' : 'Inactivo'].join(' '), search);
  const activeFirst = (a: ShippingDef, b: ShippingDef): number => Number(b.isActive) - Number(a.isActive);
  return shippings.filter((shipping) => matches(shipping) && (showInactive || shipping.isActive)).sort(activeFirst);
}

function useInitialLoad(isLoaded: boolean, setShippings: (rows: ShippingDef[]) => void): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (isLoaded) return setLoading(false);
    setLoading(true);
    fetchShippingOptions().then(setShippings).finally(() => setLoading(false));
  }, [isLoaded, setShippings]);
  return loading;
}

export function useShippingsPanel(): ShippingsPanelModel {
  const [showInactive, setShowInactive] = useState(false);
  const { shippings, setShippings, isLoaded } = useShippingStore();
  const manager = useEntityManager<ShippingDef>();
  const versionOf = (id: string): number => shippings.find((shipping) => shipping.id === id)?.version ?? 0;
  const actions = useEntityActions<ShippingDef, ShippingInput, ShippingUpdateInput>({
    handlers: {
      fetchData: fetchShippingOptions,
      createAction: createShippingAction,
      updateAction: updateShippingAction,
      deleteAction: (id) => deleteShippingAction({ id, version: versionOf(id) }),
      toggleActiveAction: (id, isActive) => toggleShippingActiveAction({ id, isActive, version: versionOf(id) }),
    },
    setStoreData: setShippings,
    onSuccessMessage: (message) => manager.showGlobalMessage('success', message),
    onErrorMessage: (message) => manager.showGlobalMessage('error', message),
    closeFormModal: manager.closeFormModal,
    setServerError: manager.setServerError,
    setItemToDelete: manager.setItemToDelete,
    editingItem: manager.editingItem,
    showInactive,
  });
  const initialLoading = useInitialLoad(isLoaded, setShippings);
  const visibleShippings = useMemo(() => visible(shippings, manager.search, showInactive), [shippings, manager.search, showInactive]);
  return { manager, actions, visibleShippings, initialLoading, showInactive, setShowInactive };
}
