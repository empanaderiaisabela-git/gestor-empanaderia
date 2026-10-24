import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { type DbTransaction, withTransaction } from '@/lib/db/transaction';
import { drizzleProviderRepository, type ProviderRepository } from './provider.repository';

export type ProviderAuditEntry = {
  userId: string;
  action: 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR';
  entityId: string;
  detail: Record<string, unknown>;
};

export type ProviderScope = {
  providers: ProviderRepository;
  audit: (entry: ProviderAuditEntry) => Promise<void>;
};

export type ProviderUnitOfWork = {
  read: ProviderRepository;
  run<T>(work: (scope: ProviderScope) => Promise<T>): Promise<T>;
};

function auditIn(tx: DbTransaction): ProviderScope['audit'] {
  return async (entry) => {
    await tx.insert(auditLogs).values({ ...entry, entity: 'PROVIDER' });
  };
}

export const drizzleProviderUnitOfWork: ProviderUnitOfWork = {
  read: drizzleProviderRepository(db),
  run: (work) => withTransaction((tx) => work({ providers: drizzleProviderRepository(tx), audit: auditIn(tx) })),
};
