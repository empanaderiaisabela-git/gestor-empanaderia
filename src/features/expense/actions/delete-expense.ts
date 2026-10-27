'use server';

import { MESSAGES } from '@/config/messages';
import { type ExpenseDeleteInput, expenseDeleteSchema } from '@/features/expense/domain/expense.schema';
import { expenseService } from '@/features/expense/services/expense.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function deleteExpenseAction(input: ExpenseDeleteInput): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = expenseDeleteSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    await expenseService.remove(caller, parsed.data);
    return { success: true, message: MESSAGES.SUCCESS.DELETED('el gasto') };
  } catch (error) {
    return toActionFailure(error, 'el gasto');
  }
}
