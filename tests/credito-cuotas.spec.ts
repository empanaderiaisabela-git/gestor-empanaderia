import { expect, type Locator, type Page, test } from '@playwright/test';

const grupo = (page: Page, nombre: string): Locator => page.getByRole('region', { name: nombre, exact: true });
const gusto = (page: Page, nombre: string): Locator => page.getByRole('list', { name: 'Gustos' }).getByRole('listitem').filter({ hasText: new RegExp(`^${nombre}\\$`) });

async function crearTarjeta(page: Page, nombre: string): Promise<void> {
  await page.goto('/tarjetas');
  await page.getByRole('button', { name: 'Nueva tarjeta' }).click();
  await page.getByLabel('Nombre de la tarjeta').fill(nombre);
  await page.getByLabel('Cuotas del plan 1').selectOption('3');
  await page.getByLabel('Recargo % del plan 1').fill('10');
  await page.getByRole('button', { name: 'Crear tarjeta' }).click();
  await expect(page.getByText('Se registró la tarjeta')).toBeVisible();
}

test.describe('cobrar con crédito en cuotas (US-11)', () => {
  test('elige la tarjeta y las cuotas, ve el recargo, cobra con recargo y el historial lo muestra', async ({ page }) => {
    const tarjeta = `Visa E2E ${Date.now()}`;
    await crearTarjeta(page, tarjeta);

    await page.goto('/ventas/nueva');
    await grupo(page, 'Pepsi').getByRole('button', { name: /1 unidad/ }).click();
    await gusto(page, '7up 1,5 L').getByRole('button', { name: 'Agregar' }).click();
    await page.getByRole('button', { name: 'Listo' }).click();

    const pedido = page.getByRole('region', { name: 'Pedido actual' });
    await pedido.getByLabel('Comprador (opcional)').fill('Comprador crédito');
    await pedido.getByRole('button', { name: 'Cobrar $3.000' }).click();
    await page.getByRole('button', { name: 'Efectivo' }).click();
    await page.getByRole('button', { name: 'Crédito' }).click();
    await page.getByRole('combobox', { name: 'Tarjeta', exact: true }).selectOption({ label: tarjeta });
    await page.getByRole('combobox', { name: 'Cuotas', exact: true }).selectOption('3');
    await expect(page.getByText('Recargo de cuotas: $300')).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar $3.300' }).click();
    await expect(page.getByText('Venta registrada por $3.300')).toBeVisible();

    await page.goto('/ventas');
    await page.getByPlaceholder('Buscar por comprador o vendedor...').filter({ visible: true }).fill('Comprador crédito');
    const fila = page.getByRole('row').filter({ hasText: 'Comprador crédito' });
    await expect(fila).toContainText('$3.300');
    await expect(fila).toContainText(`Crédito · ${tarjeta} · 3 cuotas`);
  });
});
