import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { createProviderAction } from '@/features/provider/actions/create-provider';
import { deleteProviderAction } from '@/features/provider/actions/delete-provider';
import { fetchProviders } from '@/features/provider/actions/fetch-providers';
import { toggleProviderActiveAction } from '@/features/provider/actions/toggle-provider-active';
import { updateProviderAction } from '@/features/provider/actions/update-provider';
import type { ProviderDef, ProviderInput, ProviderUpdateInput } from '@/features/provider/domain/provider.schema';
import { useProviderStore } from '@/features/provider/store/provider.store';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { normalizeForSearch } from '@/lib/utils';

export type ProvidersPanelModel = {
  role: string | undefined;
  manager: ReturnType<typeof useEntityManager<ProviderDef>>;
  actions: ReturnType<typeof useEntityActions<ProviderDef, ProviderInput, ProviderUpdateInput>>;
  visibleProviders: ProviderDef[];
  initialLoading: boolean;
  showInactive: boolean;
  setShowInactive: (value: boolean) => void;
};

function visible(providers: ProviderDef[], search: string, showInactive: boolean): ProviderDef[] {
  const terms = normalizeForSearch(search).split(/\s+/);
  const matches = (provider: ProviderDef): boolean => {
    const text = [provider.name, provider.email, provider.phone].map((value) => normalizeForSearch(value)).join(' ');
    return terms.every((term) => text.includes(term));
  };
  const activeFirst = (a: ProviderDef, b: ProviderDef): number => Number(b.isActive) - Number(a.isActive);
  return providers.filter((provider) => matches(provider) && (showInactive || provider.isActive)).sort(activeFirst);
}

function useInitialLoad(isLoaded: boolean, setProviders: (rows: ProviderDef[]) => void): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (isLoaded) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchProviders().then(setProviders).finally(() => setLoading(false));
  }, [isLoaded, setProviders]);
  return loading;
}

export function useProvidersPanel(): ProvidersPanelModel {
  const role = useAuthStore((state) => state.user?.role);
  const [showInactive, setShowInactive] = useState(false);
  const { providers, setProviders, isLoaded } = useProviderStore();
  const manager = useEntityManager<ProviderDef>();
  const versionOf = (id: string): number => providers.find((provider) => provider.id === id)?.version ?? 0;
  const actions = useEntityActions<ProviderDef, ProviderInput, ProviderUpdateInput>({
    handlers: {
      fetchData: fetchProviders,
      createAction: createProviderAction,
      updateAction: updateProviderAction,
      deleteAction: (id) => deleteProviderAction({ id, version: versionOf(id) }),
      toggleActiveAction: (id, isActive) => toggleProviderActiveAction({ id, isActive, version: versionOf(id) }),
    },
    setStoreData: setProviders,
    onSuccessMessage: (message) => manager.showGlobalMessage('success', message),
    onErrorMessage: (message) => manager.showGlobalMessage('error', message),
    closeFormModal: manager.closeFormModal,
    setServerError: manager.setServerError,
    setItemToDelete: manager.setItemToDelete,
    editingItem: manager.editingItem,
    showInactive,
  });
  const initialLoading = useInitialLoad(isLoaded, setProviders);
  const visibleProviders = useMemo(() => visible(providers, manager.search, showInactive), [providers, manager.search, showInactive]);
  return { role, manager, actions, visibleProviders, initialLoading, showInactive, setShowInactive };
}
