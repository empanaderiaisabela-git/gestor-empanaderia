import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { type DbTransaction, withTransaction } from '@/lib/db/transaction';
import { type CardRepository, drizzleCardRepository } from './card.repository';

export type CardAuditEntry = {
  userId: string;
  action: 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR';
  entityId: string;
  detail: Record<string, unknown>;
};

export type CardScope = {
  cards: CardRepository;
  audit: (entry: CardAuditEntry) => Promise<void>;
};

export type CardUnitOfWork = {
  read: CardRepository;
  run<T>(work: (scope: CardScope) => Promise<T>): Promise<T>;
};

function auditIn(tx: DbTransaction): CardScope['audit'] {
  return async (entry) => {
    await tx.insert(auditLogs).values({ ...entry, entity: 'CARD' });
  };
}

export const drizzleCardUnitOfWork: CardUnitOfWork = {
  read: drizzleCardRepository(db),
  run: (work) => withTransaction((tx) => work({ cards: drizzleCardRepository(tx), audit: auditIn(tx) })),
};
