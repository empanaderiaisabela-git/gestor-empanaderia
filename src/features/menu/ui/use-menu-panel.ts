import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { createMenuItemAction } from '@/features/menu/actions/create-menu-item';
import { deleteMenuItemAction } from '@/features/menu/actions/delete-menu-item';
import { fetchMenuItems } from '@/features/menu/actions/fetch-menu-items';
import { toggleMenuItemActiveAction } from '@/features/menu/actions/toggle-menu-item-active';
import { updateMenuItemAction } from '@/features/menu/actions/update-menu-item';
import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import type { MenuItemDef, MenuItemInput, MenuItemUpdateInput } from '@/features/menu/domain/menu-item.schema';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { normalizeForSearch } from '@/lib/utils';

export type GroupFilter = MenuGroup | 'todos';

export type MenuPanelModel = {
  manager: ReturnType<typeof useEntityManager<MenuItemDef>>;
  actions: ReturnType<typeof useEntityActions<MenuItemDef, MenuItemInput, MenuItemUpdateInput>>;
  visibleItems: MenuItemDef[];
  initialLoading: boolean;
  showInactive: boolean;
  setShowInactive: (value: boolean) => void;
  groupFilter: GroupFilter;
  setGroupFilter: (value: GroupFilter) => void;
};

function visible(items: MenuItemDef[], { search, showInactive, groupFilter }: { search: string; showInactive: boolean; groupFilter: GroupFilter }): MenuItemDef[] {
  const terms = normalizeForSearch(search).split(/\s+/);
  return items.filter((item) => !item.isBase && terms.every((term) => normalizeForSearch(item.name).includes(term)) && (showInactive || item.isActive) && (groupFilter === 'todos' || item.group === groupFilter));
}

function useInitialLoad(isLoaded: boolean): boolean {
  const setItems = useMenuStore((state) => state.setItems);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (isLoaded) return setLoading(false);
    setLoading(true);
    fetchMenuItems()
      .then(setItems)
      .finally(() => setLoading(false));
  }, [isLoaded, setItems]);
  return loading;
}

export function useMenuPanel(): MenuPanelModel {
  const [showInactive, setShowInactive] = useState(false);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('todos');
  const { items, setItems, isLoaded } = useMenuStore();
  const manager = useEntityManager<MenuItemDef>();
  const versionOf = (id: string): number => items.find((item) => item.id === id)?.version ?? 0;
  const actions = useEntityActions<MenuItemDef, MenuItemInput, MenuItemUpdateInput>({
    handlers: {
      fetchData: fetchMenuItems,
      createAction: createMenuItemAction,
      updateAction: updateMenuItemAction,
      deleteAction: (id) => deleteMenuItemAction({ id, version: versionOf(id) }),
      toggleActiveAction: (id, isActive) => toggleMenuItemActiveAction({ id, isActive, version: versionOf(id) }),
    },
    setStoreData: setItems,
    onSuccessMessage: (message) => manager.showGlobalMessage('success', message),
    onErrorMessage: (message) => manager.showGlobalMessage('error', message),
    closeFormModal: manager.closeFormModal,
    setServerError: manager.setServerError,
    setItemToDelete: manager.setItemToDelete,
    editingItem: manager.editingItem,
    showInactive,
  });
  const initialLoading = useInitialLoad(isLoaded);
  const visibleItems = useMemo(() => visible(items, { search: manager.search, showInactive, groupFilter }), [items, manager.search, showInactive, groupFilter]);
  return { manager, actions, visibleItems, initialLoading, showInactive, setShowInactive, groupFilter, setGroupFilter };
}
