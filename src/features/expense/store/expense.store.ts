import { create } from 'zustand';
import type { ExpenseDef } from '@/features/expense/domain/expense.schema';

type ExpenseState = {
  expenses: ExpenseDef[];
  isLoaded: boolean;
  setExpenses: (expenses: ExpenseDef[]) => void;
  setLoaded: (isLoaded: boolean) => void;
};

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  isLoaded: false,
  setExpenses: (expenses) => set({ expenses, isLoaded: true }),
  setLoaded: (isLoaded) => set({ isLoaded }),
}));
