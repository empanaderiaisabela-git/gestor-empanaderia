import { expect, test } from '@playwright/test';

test.describe('venta con el pago pendiente (US-68, US-69)', () => {
  test('se vende sin medio de pago, la comanda dice PENDIENTE y después se completa el pago', async ({ page }) => {
    const cliente = `Pendiente ${Date.now()}`;
    await page.goto('/ventas/nueva');
    await page.getByRole('region', { name: 'Coca-Cola', exact: true }).getByRole('button', { name: /1 unidad/ }).click();
    await page.getByRole('list', { name: 'Gustos' }).getByRole('listitem').filter({ hasText: /^Coca-Cola 500 ml\$/ }).getByRole('button', { name: 'Agregar' }).click();
    await page.getByRole('button', { name: 'Listo' }).click();
    await page.getByRole('button', { name: /^Ver pedido/ }).click();
    const pedido = page.getByRole('region', { name: 'Pedido actual' });
    await pedido.getByLabel('Nombre del cliente').fill(cliente);
    await pedido.getByRole('button', { name: /^Cobrar/ }).click();
    await page.getByRole('button', { name: 'Confirmar sin pago' }).click();
    await expect(page.getByText(/Venta registrada/)).toBeVisible();

    await page.addInitScript(() => {
      const open = window.open.bind(window);
      window.open = (...args: Parameters<typeof window.open>) => {
        const popup = open(...args);
        if (popup) popup.print = () => undefined;
        return popup;
      };
    });
    await page.goto('/ventas');
    await page.getByPlaceholder('Buscar por comprador o vendedor...').filter({ visible: true }).fill(cliente);
    const venta = page.getByRole('row').filter({ hasText: cliente });
    await expect(venta).toContainText('Pendiente');
    const [comanda] = await Promise.all([page.waitForEvent('popup'), venta.getByTitle('Imprimir comanda').click()]);
    await expect(comanda.locator('pre')).toContainText('METODO PAGO: PENDIENTE');
    await comanda.close();

    await venta.getByTitle('Completar pago').click();
    await page.getByRole('button', { name: 'Efectivo' }).click();
    await page.getByRole('button', { name: 'Confirmar $1.800' }).click();
    await expect(page.getByText('Pago completado por $1.800')).toBeVisible();
    await expect(venta).toContainText('Efectivo');
    await expect(venta.getByTitle('Completar pago')).toHaveCount(0);
  });
});
