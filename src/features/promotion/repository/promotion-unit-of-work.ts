import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { type DbTransaction, withTransaction } from '@/lib/db/transaction';
import { drizzlePromotionRepository, type PromotionRepository } from './promotion.repository';

export type PromotionAuditEntry = {
  userId: string;
  action: 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR';
  entityId: string;
  detail: Record<string, unknown>;
};

export type PromotionScope = {
  promotions: PromotionRepository;
  audit: (entry: PromotionAuditEntry) => Promise<void>;
};

export type PromotionUnitOfWork = {
  read: PromotionRepository;
  run<T>(work: (scope: PromotionScope) => Promise<T>): Promise<T>;
};

function auditIn(tx: DbTransaction): PromotionScope['audit'] {
  return async (entry) => {
    await tx.insert(auditLogs).values({ ...entry, entity: 'PROMOTION' });
  };
}

export const drizzlePromotionUnitOfWork: PromotionUnitOfWork = {
  read: drizzlePromotionRepository(db),
  run: (work) => withTransaction((tx) => work({ promotions: drizzlePromotionRepository(tx), audit: auditIn(tx) })),
};
