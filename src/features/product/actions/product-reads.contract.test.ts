import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deviceRepository } from '@/features/device/repository/device.repository';
import { productRepository } from '@/features/product/repository/product.repository';
import { providerRepository } from '@/features/provider/repository/provider.repository';
import { asUser } from '@/test/as-user';
import { fetchProducts, fetchSelectorData } from './product.actions';

const DATES = { version: 1, createdAt: new Date(0), updatedAt: new Date(0) };
const DEVICE = { id: '11111111-1111-4111-8111-111111111111', name: 'Empanadas', isActive: true, ...DATES };
const PROVIDER = { id: '22222222-2222-4222-8222-222222222222', name: 'Molino del Sur', phone: '1155550000', email: 'ventas@molino.com', isActive: true, ...DATES };
const PRODUCT = {
  id: '33333333-3333-4333-8333-333333333333',
  deviceId: DEVICE.id,
  providerId: PROVIDER.id,
  description: 'Docena de carne',
  purchasePrice: '5000.00',
  salePrice: '9000.00',
  stock: 4,
  showOnLanding: true,
  device: DEVICE,
  provider: PROVIDER,
  ...DATES,
};

describe('lecturas de productos y proveedores (BUG-8)', () => {
  beforeEach(() => {
    vi.spyOn(productRepository, 'getAllProducts').mockResolvedValue([PRODUCT]);
    vi.spyOn(deviceRepository, 'getAllDevices').mockResolvedValue([DEVICE]);
    vi.spyOn(providerRepository, 'getAllProviders').mockResolvedValue([PROVIDER]);
  });

  it('regression BUG-8: sin sesión fetchProducts no devuelve precios de compra', async () => {
    expect(await fetchProducts()).toEqual([]);
    expect(productRepository.getAllProducts).not.toHaveBeenCalled();
  });

  it('regression BUG-8: sin sesión fetchSelectorData no devuelve el contacto de los proveedores', async () => {
    expect(await fetchSelectorData()).toEqual({ devices: [], providers: [] });
    expect(providerRepository.getAllProviders).not.toHaveBeenCalled();
  });

  it('con sesión de vendedor fetchProducts devuelve los productos', async () => {
    await asUser({ role: 'vendedor' });
    expect(await fetchProducts()).toMatchObject([{ id: PRODUCT.id, purchasePrice: 5000, salePrice: 9000 }]);
  });

  it('con sesión de vendedor fetchSelectorData devuelve categorías y proveedores', async () => {
    await asUser({ role: 'vendedor' });
    expect(await fetchSelectorData()).toMatchObject({ devices: [{ id: DEVICE.id }], providers: [{ id: PROVIDER.id }] });
  });
});
