import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { type DbTransaction, withTransaction } from '@/lib/db/transaction';
import { drizzleShippingRepository, type ShippingRepository } from './shipping.repository';

export type ShippingAuditEntry = {
  userId: string;
  action: 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR';
  entityId: string;
  detail: Record<string, unknown>;
};

export type ShippingScope = {
  shippings: ShippingRepository;
  audit: (entry: ShippingAuditEntry) => Promise<void>;
};

export type ShippingUnitOfWork = {
  read: ShippingRepository;
  run<T>(work: (scope: ShippingScope) => Promise<T>): Promise<T>;
};

function auditIn(tx: DbTransaction): ShippingScope['audit'] {
  return async (entry) => {
    await tx.insert(auditLogs).values({ ...entry, entity: 'SHIPPING' });
  };
}

export const drizzleShippingUnitOfWork: ShippingUnitOfWork = {
  read: drizzleShippingRepository(db),
  run: (work) => withTransaction((tx) => work({ shippings: drizzleShippingRepository(tx), audit: auditIn(tx) })),
};
