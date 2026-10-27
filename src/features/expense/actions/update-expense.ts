'use server';

import { z } from 'zod';
import { MESSAGES } from '@/config/messages';
import { type ExpenseDef, type ExpenseUpdateInput, expenseRowSchema, expenseUpdateSchema } from '@/features/expense/domain/expense.schema';
import { expenseService } from '@/features/expense/services/expense.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function updateExpenseAction(id: string, input: ExpenseUpdateInput): Promise<ActionResult<ExpenseDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsedId = z.uuid().safeParse(id);
    const parsed = expenseUpdateSchema.safeParse(input);
    if (!parsedId.success || !parsed.success) return fail('VALIDATION');
    const expense = await expenseService.update(caller, parsedId.data, parsed.data);
    return { success: true, message: MESSAGES.SUCCESS.UPDATED('el gasto'), data: expenseRowSchema.parse(expense) };
  } catch (error) {
    return toActionFailure(error, 'el gasto');
  }
}
