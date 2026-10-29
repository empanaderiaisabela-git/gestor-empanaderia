import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { type DbTransaction, withTransaction } from '@/lib/db/transaction';
import { drizzleMenuItemRepository, type MenuItemRepository } from './menu-item.repository';
import { drizzleMenuPhotoRepository, type MenuPhotoRepository } from './menu-photo.repository';

export type MenuAuditEntry = {
  userId: string;
  action: 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR';
  entity: 'MENU_ITEM';
  entityId: string | null;
  detail: Record<string, unknown>;
};

export type MenuRepositories = {
  items: MenuItemRepository;
  photos: MenuPhotoRepository;
};

export type MenuScope = MenuRepositories & {
  audit: (entry: MenuAuditEntry) => Promise<void>;
};

export type MenuUnitOfWork = {
  read: MenuRepositories;
  run<T>(work: (scope: MenuScope) => Promise<T>): Promise<T>;
};

function auditIn(tx: DbTransaction): MenuScope['audit'] {
  return async (entry) => {
    await tx.insert(auditLogs).values(entry);
  };
}

function repositoriesOf(executor: typeof db | DbTransaction): MenuRepositories {
  return { items: drizzleMenuItemRepository(executor), photos: drizzleMenuPhotoRepository(executor) };
}

export const drizzleMenuUnitOfWork: MenuUnitOfWork = {
  read: repositoriesOf(db),
  run: (work) => withTransaction((tx) => work({ ...repositoriesOf(tx), audit: auditIn(tx) })),
};
