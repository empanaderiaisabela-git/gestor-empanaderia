import { type DrinkFields, drinkNameOf } from '@/features/menu/domain/drink';
import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import type { MenuItemInput, MenuItemUpdateInput } from '@/features/menu/domain/menu-item.schema';
import type { MenuPrices } from '@/features/menu/domain/menu-prices';
import type { MenuItemRepository } from '@/features/menu/repository/menu-item.repository';

export type Identity = { name: string; drink?: DrinkFields };
export type FamilyPricing = { unitCost?: number; prices?: MenuPrices };
type Joining = { group: MenuGroup; drink?: DrinkFields; exceptId?: string };

export function identityOf(input: MenuItemInput | MenuItemUpdateInput): Identity {
  if (!('drinkName' in input)) return { name: input.name };
  const drink = { drinkName: input.drinkName, liters: input.liters, flavor: input.flavor ?? null };
  return { name: drinkNameOf(drink), drink };
}

export async function familyPricing(items: MenuItemRepository, { group, drink, exceptId }: Joining): Promise<FamilyPricing> {
  if (!drink) return {};
  const priced = (await items.findFamily(group, drink)).find((row) => row.id !== exceptId && row.price1 !== null);
  if (!priced?.price1) return {};
  return { ...(priced.unitCost === null ? {} : { unitCost: Number(priced.unitCost) }), prices: { price1: Number(priced.price1) } };
}
