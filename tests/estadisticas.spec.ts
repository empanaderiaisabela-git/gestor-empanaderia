import { expect, type Locator, type Page, test } from '@playwright/test';

const grupo = (page: Page, nombre: string): Locator => page.getByRole('region', { name: nombre, exact: true });
const gusto = (page: Page, nombre: string): Locator => page.getByRole('list', { name: 'Gustos' }).getByRole('listitem').filter({ hasText: new RegExp(`^${nombre}\\$`) });
const montoDe = async (cuadro: Locator): Promise<number> => Number((await cuadro.locator('p').nth(1).innerText()).replace(/[^\d,]/g, '').replace(',', '.'));

test.describe('Estadísticas de la jornada (US-12)', () => {
  test('una venta de hoy suma en su comida, en las ventas registradas y en su medio de pago', async ({ page }) => {
    await page.goto('/ventas/nueva');
    await grupo(page, 'Pepsi').getByRole('button', { name: /1 unidad/ }).click();
    await gusto(page, 'Pepsi 1,5 L').getByRole('button', { name: 'Agregar' }).click();
    await page.getByRole('button', { name: 'Listo' }).click();
    await page.getByRole('button', { name: /^Ver pedido/ }).click();
    await page.getByRole('region', { name: 'Pedido actual' }).getByLabel('Nombre del cliente').fill('Cliente estadísticas');
    await page.getByRole('region', { name: 'Pedido actual' }).getByRole('button', { name: 'Cobrar $3.200' }).click();
    await page.getByRole('button', { name: 'Transferencia' }).click();
    await page.getByRole('button', { name: 'Efectivo' }).click();
    await page.getByRole('button', { name: 'Confirmar $3.200' }).click();
    await expect(page.getByText('Venta registrada por $3.200')).toBeVisible();

    await page.goto('/');
    await expect(page.getByLabel('Desde')).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
    await expect(page.getByLabel('Hasta')).toHaveValue(await page.getByLabel('Desde').inputValue());
    const pepsi = page.getByRole('region', { name: 'Pepsi', exact: true });
    await expect(pepsi).toBeVisible();
    expect(await montoDe(pepsi)).toBeGreaterThanOrEqual(3200);
    expect(await montoDe(page.getByRole('region', { name: 'Transferencia', exact: true }))).toBeGreaterThanOrEqual(3200);
    expect(Number(await page.getByRole('region', { name: 'Ventas registradas' }).locator('p').nth(1).innerText())).toBeGreaterThanOrEqual(1);
    await expect(page.getByRole('region', { name: 'Promos', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Ganancia', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Total facturado' })).toHaveCount(0);
    await expect(page.getByText('Dinero generado por comida')).toHaveCount(0);
    expect((await pepsi.boundingBox())?.y).toBeLessThan((await page.getByRole('region', { name: 'Ventas registradas' }).boundingBox())?.y ?? 0);

    await expect(page.getByRole('table', { name: 'Vendedores' }).getByRole('row').filter({ hasText: 'admin' }).first()).toContainText(/Mañana|Tarde/);
    await expect(page.getByRole('table', { name: 'Ventas' }).getByRole('row').filter({ hasText: '$3.200' }).first()).toBeVisible();
  });
});
