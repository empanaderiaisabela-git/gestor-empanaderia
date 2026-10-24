import { db } from './index';

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function withTransaction<T>(work: (tx: DbTransaction) => Promise<T>): Promise<T> {
  return db.transaction(work);
}
