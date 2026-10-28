import { useEffect, useMemo, useState } from 'react';
import { createExpenseAction } from '@/features/expense/actions/create-expense';
import { deleteExpenseAction } from '@/features/expense/actions/delete-expense';
import { fetchExpenses } from '@/features/expense/actions/fetch-expenses';
import { fetchProviders } from '@/features/provider/actions/fetch-providers';
import type { ProviderDef } from '@/features/provider/domain/provider.schema';
import { updateExpenseAction } from '@/features/expense/actions/update-expense';
import type { ExpenseDef, ExpenseInput, ExpenseUpdateInput } from '@/features/expense/domain/expense.schema';
import { useExpenseStore } from '@/features/expense/store/expense.store';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { normalizeForSearch } from '@/lib/utils';

export type ExpensesPanelModel = {
  manager: ReturnType<typeof useEntityManager<ExpenseDef>>;
  actions: ReturnType<typeof useEntityActions<ExpenseDef, ExpenseInput, ExpenseUpdateInput>>;
  visibleExpenses: ExpenseDef[];
  providers: ProviderDef[];
  initialLoading: boolean;
};

function visible(expenses: ExpenseDef[], search: string): ExpenseDef[] {
  const terms = normalizeForSearch(search).split(/\s+/);
  return expenses.filter((expense) => {
    const text = normalizeForSearch(`${expense.invoiceNumber} ${expense.title} ${expense.providerName ?? ''}`);
    return terms.every((term) => text.includes(term));
  });
}

function useInitialLoad(isLoaded: boolean, setExpenses: (rows: ExpenseDef[]) => void): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (isLoaded) return setLoading(false);
    setLoading(true);
    fetchExpenses().then(setExpenses).finally(() => setLoading(false));
  }, [isLoaded, setExpenses]);
  return loading;
}

function useProviders(): ProviderDef[] {
  const [providers, setProviders] = useState<ProviderDef[]>([]);
  useEffect(() => {
    fetchProviders().then(setProviders);
  }, []);
  return providers;
}

export function useExpensesPanel(): ExpensesPanelModel {
  const { expenses, setExpenses, isLoaded } = useExpenseStore();
  const manager = useEntityManager<ExpenseDef>();
  const versionOf = (id: string): number => expenses.find((expense) => expense.id === id)?.version ?? 0;
  const actions = useEntityActions<ExpenseDef, ExpenseInput, ExpenseUpdateInput>({
    handlers: { fetchData: fetchExpenses, createAction: createExpenseAction, updateAction: updateExpenseAction, deleteAction: (id) => deleteExpenseAction({ id, version: versionOf(id) }) },
    setStoreData: setExpenses,
    onSuccessMessage: (message) => manager.showGlobalMessage('success', message),
    onErrorMessage: (message) => manager.showGlobalMessage('error', message),
    closeFormModal: manager.closeFormModal,
    setServerError: manager.setServerError,
    setItemToDelete: manager.setItemToDelete,
    editingItem: manager.editingItem,
    showInactive: true,
  });
  const initialLoading = useInitialLoad(isLoaded, setExpenses);
  const visibleExpenses = useMemo(() => visible(expenses, manager.search), [expenses, manager.search]);
  return { manager, actions, visibleExpenses, providers: useProviders(), initialLoading };
}
