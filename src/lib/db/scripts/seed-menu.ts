import { db } from '..';
import { menuGroupPrices, menuItems } from '../menu-schema';
import { saleLineItems, saleLines } from '../order-schema';
import { stockEntries, stockLosses } from '../stock-schema';
import { SEED_GROUP_PRICES, SEED_MENU_ITEMS } from './menu-seed-data';

export async function clearMenu(): Promise<void> {
  await db.delete(saleLineItems);
  await db.delete(saleLines);
  await db.delete(stockEntries);
  await db.delete(stockLosses);
  await db.delete(menuGroupPrices);
  await db.delete(menuItems);
}

export async function seedMenu(): Promise<void> {
  await db.insert(menuGroupPrices).values(SEED_GROUP_PRICES);
  await db.insert(menuItems).values(SEED_MENU_ITEMS.map(({ prices, ...item }) => ({ ...item, ...prices, isVisible: true })));
  console.log(`Menú cargado: ${SEED_MENU_ITEMS.length} gustos y bebidas, precios de Empanadas y Ciabattas.`);
}
