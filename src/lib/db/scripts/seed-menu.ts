import { db } from '..';
import { menuItems } from '../menu-schema';
import { saleLineItems, saleLines } from '../order-schema';
import { stockEntries, stockLosses } from '../stock-schema';
import { SEED_BASES, SEED_MENU_ITEMS } from './menu-seed-data';

export async function clearMenu(): Promise<void> {
  await db.delete(saleLineItems);
  await db.delete(saleLines);
  await db.delete(stockEntries);
  await db.delete(stockLosses);
  await db.delete(menuItems);
}

export async function seedMenu(): Promise<void> {
  await db.insert(menuItems).values(SEED_MENU_ITEMS.map(({ prices, ...item }) => ({ ...item, ...prices, isVisible: true })));
  await db.insert(menuItems).values([...SEED_BASES]);
  console.log(`Menú cargado: ${SEED_MENU_ITEMS.length} gustos y bebidas, cada uno con su costo y sus precios, y las prepizzas y los panes en 0.`);
}
