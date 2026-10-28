'use server';

import { MESSAGES } from '@/config/messages';
import { type ExpenseDef, type ExpenseInput, expenseCreateSchema, expenseRowSchema } from '@/features/expense/domain/expense.schema';
import { expenseService } from '@/features/expense/services/expense.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function createExpenseAction(input: ExpenseInput): Promise<ActionResult<ExpenseDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = expenseCreateSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    const expense = await expenseService.create(caller, parsed.data);
    return { success: true, message: MESSAGES.SUCCESS.CREATED('el gasto'), data: expenseRowSchema.parse(expense) };
  } catch (error) {
    return toActionFailure(error, 'el gasto');
  }
}
