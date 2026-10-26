import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { type DbTransaction, withTransaction } from '@/lib/db/transaction';
import { drizzleExpenseRepository, type ExpenseRepository } from './expense.repository';

export type ExpenseAuditEntry = {
  userId: string;
  action: 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR';
  entityId: string;
  detail: Record<string, unknown>;
};

export type ExpenseScope = {
  expenses: ExpenseRepository;
  audit: (entry: ExpenseAuditEntry) => Promise<void>;
};

export type ExpenseUnitOfWork = {
  read: ExpenseRepository;
  run<T>(work: (scope: ExpenseScope) => Promise<T>): Promise<T>;
};

function auditIn(tx: DbTransaction): ExpenseScope['audit'] {
  return async (entry) => {
    await tx.insert(auditLogs).values({ ...entry, entity: 'EXPENSE' });
  };
}

export const drizzleExpenseUnitOfWork: ExpenseUnitOfWork = {
  read: drizzleExpenseRepository(db),
  run: (work) => withTransaction((tx) => work({ expenses: drizzleExpenseRepository(tx), audit: auditIn(tx) })),
};
