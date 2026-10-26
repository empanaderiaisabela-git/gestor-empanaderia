'use server';

import { z } from 'zod';
import { type ExpenseDef, expenseRowSchema } from '@/features/expense/domain/expense.schema';
import { expenseService } from '@/features/expense/services/expense.service';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';

export async function fetchExpenses(): Promise<ExpenseDef[]> {
  try {
    await verifyAuthOrAdmin(true);
    return z.array(expenseRowSchema).parse(await expenseService.list());
  } catch (error) {
    console.error('fetchExpenses error:', error);
    return [];
  }
}
