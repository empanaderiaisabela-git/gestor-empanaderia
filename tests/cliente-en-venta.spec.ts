import { expect, type Locator, type Page, test } from '@playwright/test';

const gusto = (page: Page, nombre: string): Locator => page.getByRole('list', { name: 'Gustos' }).getByRole('listitem').filter({ hasText: new RegExp(`^${nombre}\\$`) });

async function armarPepsi(page: Page): Promise<Locator> {
  await page.goto('/ventas/nueva');
  await page.getByRole('region', { name: 'Pepsi', exact: true }).getByRole('button', { name: /1 unidad/ }).click();
  await gusto(page, 'Pepsi 1,5 L').getByRole('button', { name: 'Agregar' }).click();
  await page.getByRole('button', { name: 'Listo' }).click();
  await page.getByRole('button', { name: /^Ver pedido/ }).click();
  return page.getByRole('region', { name: 'Pedido actual' });
}

async function cobrar(page: Page, pedido: Locator): Promise<void> {
  await pedido.getByRole('button', { name: /^Cobrar/ }).click();
  await page.getByRole('button', { name: /^Confirmar/ }).click();
  await expect(page.getByText(/Venta registrada/)).toBeVisible();
}

test.describe('cliente en el carrito (US-37)', () => {
  test('un cliente nuevo queda en Clientes con su domicilio, y en la venta siguiente se sugiere', async ({ page }) => {
    const nombre = `Cliente ${Date.now()}`;
    let pedido = await armarPepsi(page);
    await expect(pedido.getByRole('button', { name: /^Cobrar/ })).toBeDisabled();
    await pedido.getByLabel('Nombre del cliente').fill(nombre);
    await pedido.getByLabel('Teléfono (opcional)').fill('11 5555-1234');
    await pedido.getByLabel('Domicilio (opcional)').fill('Mitre 123');
    await cobrar(page, pedido);

    await page.goto('/clientes');
    await expect(page.getByRole('row').filter({ hasText: nombre })).toContainText('Mitre 123');

    pedido = await armarPepsi(page);
    await pedido.getByLabel('Nombre del cliente').fill(nombre.slice(0, 12));
    await pedido.getByRole('list', { name: 'Clientes sugeridos' }).getByRole('button', { name: new RegExp(nombre) }).click();
    await expect(pedido.getByLabel('Domicilio (opcional)')).toHaveValue('Mitre 123');
    await expect(pedido.getByText('Cliente registrado')).toBeVisible();
    await cobrar(page, pedido);

    await page.goto('/clientes');
    await expect(page.getByRole('row').filter({ hasText: nombre })).toHaveCount(1);
  });
});
