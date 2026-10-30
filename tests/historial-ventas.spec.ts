import { expect, type Locator, type Page, test } from '@playwright/test';

const grupo = (page: Page, nombre: string): Locator => page.getByRole('region', { name: nombre, exact: true });
const gusto = (page: Page, nombre: string): Locator => page.getByRole('list', { name: 'Gustos' }).getByRole('listitem').filter({ hasText: new RegExp(`^${nombre}\\$`) });

async function stockDe(page: Page, nombre: string): Promise<Locator> {
  await page.getByPlaceholder('Buscar gusto o bebida...').filter({ visible: true }).fill(nombre);
  return page.getByRole('row').filter({ has: page.getByRole('cell', { name: nombre, exact: true }) });
}

async function cobrarPedidoDeRocio(page: Page): Promise<void> {
  await page.goto('/ventas');
  await page.getByRole('link', { name: 'Nuevo pedido' }).click();
  await grupo(page, 'Empanadas').getByRole('button', { name: /½ docena/ }).click();
  await gusto(page, 'Carne picante').getByRole('button', { name: 'Completar' }).click();
  await page.getByRole('button', { name: 'Listo' }).click();
  await grupo(page, 'Sanguches').getByRole('button', { name: /3 unidades/ }).click();
  await gusto(page, 'Jamón y queso').getByRole('button', { name: 'Completar' }).click();
  await page.getByRole('button', { name: 'Listo' }).click();
  await page.getByRole('button', { name: /^Ver pedido/ }).click();
  const pedido = page.getByRole('region', { name: 'Pedido actual' });
  await pedido.getByLabel('Nombre del cliente').fill('Rocío');
  await pedido.getByRole('button', { name: 'Cobrar $10.500' }).click();
  await page.getByRole('button', { name: 'Confirmar $10.500' }).click();
  await expect(page.getByText('Venta registrada por $10.500')).toBeVisible();
}

test.describe('Ventas/Pedidos (US-7)', () => {
  test('la venta aparece en la grilla con su comprobante, y anularla repone el stock', async ({ page }) => {
    await cobrarPedidoDeRocio(page);

    await page.goto('/ventas');
    await page.getByPlaceholder('Buscar por comprador o vendedor...').filter({ visible: true }).fill('Rocío');
    const fila = page.getByRole('row').filter({ hasText: 'Rocío' });
    await expect(fila).toContainText('$10.500');
    await expect(fila).toContainText('Efectivo');
    await expect(fila).toContainText('Sanguches · 3 unidades: Jamón y queso');

    await fila.getByTitle('Ver comprobante').click();
    const comprobante = page.getByRole('article', { name: 'Comprobante' });
    await expect(comprobante).toContainText('Empanadería Isabela');
    await expect(comprobante.getByRole('row', { name: /Empanadas · ½ docena Carne picante \$6\.500/ })).toBeVisible();
    await page.getByRole('button', { name: 'Volver' }).click();

    await page.getByPlaceholder('Buscar por comprador o vendedor...').filter({ visible: true }).fill('Rocío');
    await fila.getByTitle('Anular venta').click();
    await page.getByRole('button', { name: 'Confirmar anulación' }).click();
    await expect(page.getByText('Venta anulada y stock repuesto.')).toBeVisible();
    await expect(fila).toHaveCount(0);

    await page.goto('/stock');
    await expect((await stockDe(page, 'Carne picante')).getByText('48', { exact: true })).toBeVisible();
    await expect((await stockDe(page, 'Jamón y queso')).getByText('24', { exact: true })).toBeVisible();
  });
});
