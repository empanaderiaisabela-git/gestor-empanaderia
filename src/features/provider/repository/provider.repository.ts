import { and, desc, eq, ilike } from 'drizzle-orm';
import { db } from '@/lib/db';
import { products, providers } from '@/lib/db/schema';
import type { DbTransaction } from '@/lib/db/transaction';
import type { ProviderInput } from '@/features/provider/domain/provider.schema';

export type Provider = typeof providers.$inferSelect;
export type ProviderChanges = Partial<Pick<Provider, 'name' | 'phone' | 'email' | 'isActive'>>;
export type VersionedRef = { id: string; version: number };

export type ProviderRepository = {
  findAll(): Promise<Provider[]>;
  findById(id: string): Promise<Provider | null>;
  findByName(name: string): Promise<Provider | null>;
  insert(input: ProviderInput): Promise<Provider>;
  update(ref: VersionedRef, changes: ProviderChanges): Promise<Provider | null>;
  remove(ref: VersionedRef): Promise<boolean>;
  hasProducts(id: string): Promise<boolean>;
};

type Executor = typeof db | DbTransaction;

const escapeLike = (value: string): string => value.replace(/[\\%_]/g, (char) => `\\${char}`);
const sameVersion = ({ id, version }: VersionedRef) => and(eq(providers.id, id), eq(providers.version, version));

export function drizzleProviderRepository(executor: Executor = db): ProviderRepository {
  return {
    findAll: () => executor.select().from(providers).orderBy(desc(providers.createdAt)),
    findById: async (id) => (await executor.select().from(providers).where(eq(providers.id, id)))[0] ?? null,
    findByName: async (name) => (await executor.select().from(providers).where(ilike(providers.name, escapeLike(name))).limit(1))[0] ?? null,
    insert: async (input) => (await executor.insert(providers).values(input).returning())[0],
    update: async (ref, changes) => {
      const rows = await executor.update(providers).set({ ...changes, version: ref.version + 1, updatedAt: new Date() }).where(sameVersion(ref)).returning();
      return rows[0] ?? null;
    },
    remove: async (ref) => (await executor.delete(providers).where(sameVersion(ref)).returning({ id: providers.id })).length > 0,
    hasProducts: async (id) => (await executor.select({ id: products.id }).from(products).where(eq(products.providerId, id)).limit(1)).length > 0,
  };
}
