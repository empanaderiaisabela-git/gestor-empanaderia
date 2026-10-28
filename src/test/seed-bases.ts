import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { SEED_BASES } from '@/lib/db/scripts/menu-seed-data';

export type BaseIds = { pizzas: string; ciabattas: string };

export async function seedBases(stock = 0): Promise<BaseIds> {
  const rows = await db
    .insert(menuItems)
    .values(SEED_BASES.map((base) => ({ ...base, stock: String(stock) })))
    .returning();
  const idOf = (group: keyof BaseIds): string => rows.find((row) => row.group === group)?.id ?? '';
  return { pizzas: idOf('pizzas'), ciabattas: idOf('ciabattas') };
}
