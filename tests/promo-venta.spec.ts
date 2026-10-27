import { expect, type Locator, type Page, test } from '@playwright/test';

const gustoEnPromo = (page: Page, nombre: string): Locator => page.getByRole('list', { name: 'Gustos' }).getByRole('listitem').filter({ hasText: new RegExp(`^${nombre}En la promo`) });

async function crearPromo(page: Page, nombre: string): Promise<void> {
  await page.goto('/promociones');
  await page.getByRole('button', { name: 'Nueva promoción' }).click();
  await page.getByLabel('Nombre de la promo').fill(nombre);
  await page.getByLabel('Presentación del producto 1').selectOption({ label: '½ docena' });
  await page.getByRole('button', { name: /Agregar producto/ }).click();
  await page.getByLabel('Grupo del producto 2').selectOption({ label: 'Coca-Cola' });
  await page.getByLabel('Precio de venta de la promo').fill('9000');
  await page.getByRole('button', { name: 'Crear promoción' }).click();
  await expect(page.getByText('Se registró la promoción')).toBeVisible();
}

test.describe('vender una promo desde el tablero (US-9)', () => {
  test('el admin arma una promo, la vende eligiendo los gustos y el historial la muestra', async ({ page }) => {
    const nombre = `Media y Sprite ${Date.now()}`;
    await crearPromo(page, nombre);

    await page.goto('/ventas/nueva');
    await page.getByRole('region', { name: 'Promos', exact: true }).getByRole('button', { name: new RegExp(nombre) }).click();
    await gustoEnPromo(page, 'Muzza y cebolla').getByRole('button', { name: 'Completar' }).click();
    await gustoEnPromo(page, 'Sprite 1,5 L').getByRole('button', { name: 'Agregar' }).click();

    await page.getByRole('button', { name: /^Ver pedido/ }).click();
    const pedido = page.getByRole('region', { name: 'Pedido actual' });
    await expect(pedido.getByText(`Promo · ${nombre}`)).toBeVisible();
    await pedido.getByLabel('Comprador (opcional)').fill('Comprador promo');
    await pedido.getByRole('button', { name: 'Cobrar $9.000' }).click();
    await page.getByRole('button', { name: 'Confirmar $9.000' }).click();
    await expect(page.getByText('Venta registrada por $9.000')).toBeVisible();

    await page.goto('/ventas');
    await page.getByPlaceholder('Buscar por comprador o vendedor...').filter({ visible: true }).fill('Comprador promo');
    await expect(page.getByRole('row').filter({ hasText: 'Comprador promo' })).toContainText(`Promo: ${nombre}: Muzza y cebolla · Sprite 1,5 L`);
  });
});
