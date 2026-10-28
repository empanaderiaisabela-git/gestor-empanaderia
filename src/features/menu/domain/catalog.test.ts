import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { CATALOG_GROUPS, catalogItemOf, catalogPriceLabel, catalogPriceSummary, fromPrice } from './catalog';
import { deleteMenuPhotoSchema, uploadMenuPhotoSchema } from './menu-photo.schema';

const ITEM = '11111111-1111-4111-8111-111111111111';
const PNG = 'data:image/png;base64,iVBORw0KGgo=';
const source = { id: ITEM, name: 'Carne', stock: 12, images: [{ publicId: 'p', url: 'https://x/p.png' }] };

describe('ficha de catálogo de un gusto (T-12 CA-4)', () => {
  it('cada gusto de empanadas muestra sus propios precios (US-28)', () => {
    const item = catalogItemOf({ ...source, group: 'empanadas', prices: { price1: 1200, price3: 3400, price6: 6500, price12: 12000 } });
    expect(item.prices.map(({ label, value }) => [label, value])).toEqual([['1 unidad', 1200], ['3 unidades', 3400], ['½ docena', 6500], ['1 docena', 12000]]);
    expect(item).toMatchObject({ inStock: true, images: source.images });
    expect(fromPrice(item)).toBe(1200);
  });

  it('pizzas y bebidas muestran su propio precio; sin stock se marca', () => {
    const pizza = catalogItemOf({ ...source, group: 'pizzas', stock: 0, prices: { price1: 11000 } });
    expect(pizza).toMatchObject({ inStock: false, prices: [{ field: 'price1', label: 'pizza entera', value: 11000 }] });
  });

  it('textos del catálogo: grupos, precio desde y resumen', () => {
    expect(CATALOG_GROUPS.map((group) => group.name)).toEqual(['Empanadas', 'Pizzas', 'Sanguches', 'Ciabattas', 'Coca-Cola', 'Pepsi']);
    const prices = [{ field: 'price1' as const, label: '1 unidad', value: 1200 }, { field: 'price6' as const, label: '½ docena', value: 6500 }];
    expect([catalogPriceLabel({ prices }), catalogPriceLabel({ prices: prices.slice(0, 1) }), catalogPriceLabel({ prices: [] })]).toEqual(['desde $1.200', '$1.200', 'Consultar precio']);
    expect(catalogPriceSummary({ prices })).toBe('1 unidad: $1.200 · ½ docena: $6.500');
  });

  it('un gusto sin precios cargados no tiene precio "desde"', () => {
    const item = catalogItemOf({ ...source, group: 'ciabattas', prices: {} });
    expect([item.prices, fromPrice(item)]).toEqual([[], null]);
  });
});

describe('fotos de un gusto (T-12 CA-1 y BUG-11)', () => {
  it('acepta JPG, PNG o WEBP en base64', () => {
    expect(uploadMenuPhotoSchema.safeParse({ menuItemId: ITEM, image: PNG }).success).toBe(true);
    expect(uploadMenuPhotoSchema.safeParse({ menuItemId: ITEM, image: 'data:image/webp;base64,UklGRg==' }).success).toBe(true);
  });

  it.each([
    { caso: 'un GIF', image: 'data:image/gif;base64,R0lGOD==', message: 'La imagen tiene que ser JPG, PNG o WEBP' },
    { caso: 'una URL', image: 'https://evil.example/x.png', message: 'La imagen tiene que ser JPG, PNG o WEBP' },
    { caso: 'más de 5 MB', image: `data:image/png;base64,${'A'.repeat(7_000_000)}`, message: 'La imagen no puede superar los 5 MB' },
  ])('rechaza $caso', ({ image, message }) => {
    expect(uploadMenuPhotoSchema.safeParse({ menuItemId: ITEM, image }).error?.issues[0]?.message).toBe(message);
  });

  it('pide un gusto válido y nada más; borrar pide una foto', () => {
    expect(uploadMenuPhotoSchema.safeParse({ menuItemId: 'x', image: PNG }).error?.issues[0]?.message).toBe('Elegí un gusto o bebida');
    expect(uploadMenuPhotoSchema.safeParse({ menuItemId: ITEM, image: PNG, folder: 'otro' }).success).toBe(false);
    expect(deleteMenuPhotoSchema.safeParse({ publicId: '' }).error?.issues[0]?.message).toBe('Elegí una foto');
  });

  it('fuzz: nunca lanza', () => {
    fc.assert(fc.property(fc.anything(), (input) => typeof uploadMenuPhotoSchema.safeParse(input).success === 'boolean'));
  });
});
