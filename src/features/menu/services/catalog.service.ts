import { catalogItemOf, type CatalogItemDef } from '@/features/menu/domain/catalog';
import type { PriceValues } from '@/features/menu/domain/menu-price-list';
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
const isOnCatalog = (item: MenuItem): boolean => item.isActive && item.isVisible && !item.isBase;

async function catalogOf(read: MenuRepositories, items: MenuItem[], all: MenuItem[]): Promise<CatalogItemDef[]> {
  const photos: MenuPhoto[] = await read.photos.ofItems(items.map((item) => item.id));
  const stockOf = (item: MenuItem): number => Number((all.find((base) => base.isBase && base.group === item.group) ?? item).stock);
  const defs = items.map((item) => {
    const images = photos.filter((photo) => photo.menuItemId === item.id).map(({ publicId, url }) => ({ publicId, url }));
    return catalogItemOf({ id: item.id, group: item.group, name: item.name, stock: stockOf(item), prices: pricesOf(item), images });
  });
  return defs.filter((item) => item.prices.length > 0);
}

export function createCatalogService({ unitOfWork }: { unitOfWork: MenuUnitOfWork }): CatalogService {
  const { read } = unitOfWork;
  return {
    list: async () => {
      const all = await read.items.findAll();
      return catalogOf(read, all.filter(isOnCatalog), all);
    },
    item: async (id) => {
      const all = await read.items.findAll();
      const item = all.find((candidate) => candidate.id === id);
      return item && isOnCatalog(item) ? ((await catalogOf(read, [item], all))[0] ?? null) : null;
    },
  };
}

export const catalogService = createCatalogService({ unitOfWork: drizzleMenuUnitOfWork });
