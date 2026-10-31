import { expect, type Locator, type Page, test } from '@playwright/test';

const grupo = (page: Page, nombre: string): Locator => page.getByRole('region', { name: nombre, exact: true });
const gusto = (page: Page, nombre: string): Locator => page.getByRole('list', { name: 'Gustos' }).getByRole('listitem').filter({ hasText: new RegExp(`^${nombre}\\$`) });

async function stockDe(page: Page, nombre: string): Promise<Locator> {
  await page.getByPlaceholder('Buscar gusto o bebida...').filter({ visible: true }).fill(nombre);
  return page.getByRole('row').filter({ has: page.getByRole('cell', { name: nombre, exact: true }) });
}

test.describe('cobrar el pedido (US-6)', () => {
  test('arma el pedido, cobra con efectivo y débito, y el stock queda descontado', async ({ page }) => {
    await page.goto('/ventas/nueva');
    await grupo(page, 'Empanadas').getByRole('button', { name: /½ docena/ }).click();
    await gusto(page, 'Bondiola barbacoa').getByRole('button', { name: 'Agregar uno' }).click();
    await gusto(page, 'Bondiola barbacoa').getByRole('button', { name: 'Agregar uno' }).click();
    await gusto(page, 'Pollo a mostaza').getByRole('button', { name: 'Completar' }).click();
    await page.getByRole('button', { name: 'Listo' }).click();
    await grupo(page, 'Sándwich de miga').getByRole('button', { name: /6 unidades/ }).click();
    await gusto(page, 'Primavera').getByRole('button', { name: 'Completar' }).click();
    await page.getByRole('button', { name: 'Listo' }).click();

    await page.getByRole('button', { name: /^Ver pedido/ }).click();
    const pedido = page.getByRole('region', { name: 'Pedido actual' });
    await pedido.getByLabel('Nombre del cliente').fill('Marta');
    await pedido.getByRole('button', { name: 'Cobrar $15.100' }).click();
    await page.getByRole('button', { name: 'Débito' }).click();
    await page.getByLabel('Monto en Efectivo').fill('10000');
    await expect(page.getByText('Resto en Débito: $5.100')).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar $15.100' }).click();

    await expect(page.getByText('Venta registrada por $15.100')).toBeVisible();
    await page.getByRole('button', { name: /^Ver pedido/ }).click();
    await expect(pedido.getByText('No hay productos en el pedido')).toBeVisible();

    await page.goto('/stock');
    await expect((await stockDe(page, 'Bondiola barbacoa')).getByText('46', { exact: true })).toBeVisible();
    await expect((await stockDe(page, 'Pollo a mostaza')).getByText('44', { exact: true })).toBeVisible();
    await expect((await stockDe(page, 'Primavera')).getByText('18', { exact: true })).toBeVisible();
  });
});
