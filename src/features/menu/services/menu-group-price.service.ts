import type { MenuGroupPrice } from '@/features/menu/repository/menu-group-price.repository';
import { drizzleMenuUnitOfWork, type MenuUnitOfWork } from '@/features/menu/repository/menu-unit-of-work';

export type MenuGroupPriceService = { list(): Promise<MenuGroupPrice[]> };

export function createMenuGroupPriceService({ unitOfWork }: { unitOfWork: MenuUnitOfWork }): MenuGroupPriceService {
  return { list: () => unitOfWork.read.groupPrices.findAll() };
}

export const menuGroupPriceService = createMenuGroupPriceService({ unitOfWork: drizzleMenuUnitOfWork });
