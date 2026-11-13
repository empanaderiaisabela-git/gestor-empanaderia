import { expect, type Locator, type Page, test } from '@playwright/test';
import { db } from '../src/lib/db';
import { shippingOptions } from '../src/lib/db/shipping-schema';

const gusto = (page: Page, nombre: string): Locator => page.getByRole('list', { name: 'Gustos' }).getByRole('listitem').filter({ hasText: new RegExp(`^${nombre}\\$`) });

async function armarQuilmes(page: Page): Promise<Locator> {
  await page.goto('/ventas/nueva');
  await page.getByRole('region', { name: 'Quilmes', exact: true }).getByRole('button', { name: /1 unidad/ }).click();
  await gusto(page, 'Quilmes 1,5 L').getByRole('button', { name: 'Agregar' }).click();
  await page.getByRole('button', { name: 'Listo' }).click();
  await page.getByRole('button', { name: /^Ver pedido/ }).click();
  return page.getByRole('region', { name: 'Pedido actual' });
}

test.describe('envío en la venta (US-59)', () => {
  test('el envío suma al total, pide el domicilio y queda en el comprobante', async ({ page }) => {
    const titulo = `Centro E2E ${Date.now()}`;
    const cliente = `Envío ${Date.now()}`;
    await db.insert(shippingOptions).values({ title: titulo, amount: '1500.00' });
    const pedido = await armarQuilmes(page);
    await pedido.getByLabel('Nombre del cliente').fill(cliente);
    const sinEnvio = await pedido.getByRole('button', { name: /^Cobrar/ }).textContent();

    await pedido.getByLabel('Envío').selectOption({ label: `${titulo} · $1.500` });
    await expect(pedido.getByText('Falta el domicilio')).toBeVisible();
    await expect(pedido.getByRole('button', { name: /^Cobrar/ })).toBeDisabled();
    await pedido.getByLabel('Domicilio (opcional)').fill('Mitre 123');
    await expect(pedido.getByRole('button', { name: /^Cobrar/ })).not.toHaveText(sinEnvio ?? '');
    await pedido.getByRole('button', { name: /^Cobrar/ }).click();
    await page.getByRole('button', { name: 'Efectivo' }).click();
    await page.getByRole('button', { name: /^Confirmar/ }).click();
    await expect(page.getByText(/Venta registrada/)).toBeVisible();

    await page.goto('/ventas');
    await page.getByPlaceholder('Buscar ventas...').filter({ visible: true }).fill(cliente);
    await page.getByRole('row').filter({ hasText: cliente }).getByTitle('Ver comprobante').click();
    await expect(page.getByRole('article', { name: 'Comprobante' })).toContainText(`Envío · ${titulo}$1.500`);
  });
});
