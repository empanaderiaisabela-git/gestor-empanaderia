import { catalogItemOf, type CatalogItemDef } from '@/features/menu/domain/catalog';
import type { PriceValues } from '@/features/menu/domain/menu-price-list';
import type { MenuGroupPrice } from '@/features/menu/repository/menu-group-price.repository';
import type { MenuItem } from '@/features/menu/repository/menu-item.repository';
import type { MenuPhoto } from '@/features/menu/repository/menu-photo.repository';
import { drizzleMenuUnitOfWork, type MenuRepositories, type MenuUnitOfWork } from '@/features/menu/repository/menu-unit-of-work';

export type CatalogService = {
  list(): Promise<CatalogItemDef[]>;
  item(id: string): Promise<CatalogItemDef | null>;
};

type PriceColumns = Pick<MenuItem, 'price1' | 'price3' | 'price6' | 'price12'>;

const amount = (value: string | null): number | null => (value === null ? null : Number(value));
const pricesOf = (row: PriceColumns): PriceValues => ({ price1: amount(row.price1), price3: amount(row.price3), price6: amount(row.price6), price12: amount(row.price12) });
const isOnCatalog = (item: MenuItem): boolean => item.isActive && item.isVisible;

async function catalogOf(read: MenuRepositories, items: MenuItem[]): Promise<CatalogItemDef[]> {
  const photos: MenuPhoto[] = await read.photos.ofItems(items.map((item) => item.id));
  const groupPrices: MenuGroupPrice[] = await read.groupPrices.findAll();
  const defs = items.map((item) => {
    const images = photos.filter((photo) => photo.menuItemId === item.id).map(({ publicId, url }) => ({ publicId, url }));
    const group = groupPrices.find((row) => row.group === item.group);
    return catalogItemOf({ id: item.id, group: item.group, name: item.name, stock: Number(item.stock), prices: pricesOf(item), images }, group && pricesOf(group));
  });
  return defs.filter((item) => item.prices.length > 0);
}

export function createCatalogService({ unitOfWork }: { unitOfWork: MenuUnitOfWork }): CatalogService {
  const { read } = unitOfWork;
  return {
    list: async () => catalogOf(read, (await read.items.findAll()).filter(isOnCatalog)),
    item: async (id) => {
      const item = await read.items.findById(id);
      return item && isOnCatalog(item) ? ((await catalogOf(read, [item]))[0] ?? null) : null;
    },
  };
}

export const catalogService = createCatalogService({ unitOfWork: drizzleMenuUnitOfWork });
