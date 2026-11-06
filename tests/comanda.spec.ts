import { expect, type Locator, type Page, test } from '@playwright/test';

const empanadas = (page: Page): Locator => page.getByRole('region', { name: 'Empanadas', exact: true });
const gusto = (page: Page, nombre: string): Locator => page.getByRole('list', { name: 'Gustos' }).getByRole('listitem').filter({ hasText: new RegExp(`^${nombre}\\$`) });

async function cargarSieteCapresse(page: Page): Promise<void> {
  await page.goto('/ventas/nueva');
  await empanadas(page).getByRole('button', { name: /½ docena/ }).click();
  await gusto(page, 'Capresse').getByRole('button', { name: 'Completar' }).click();
  await page.getByRole('button', { name: 'Listo' }).click();
  await empanadas(page).getByRole('button', { name: /1 unidad/ }).click();
  await gusto(page, 'Capresse').getByRole('button', { name: 'Agregar' }).click();
  await page.getByRole('button', { name: 'Listo' }).click();
}

test.describe('gustos agrupados y comanda (US-64, US-65)', () => {
  test('½ docena + 1 unidad de Capresse van en una fila, y la comanda las imprime juntas', async ({ page }) => {
    const cliente = `Comanda ${Date.now()}`;
    await cargarSieteCapresse(page);
    await page.getByRole('button', { name: /^Ver pedido/ }).click();
    const pedido = page.getByRole('region', { name: 'Pedido actual' });
    const fila = pedido.getByRole('row').filter({ hasText: 'Capresse' });
    await expect(fila).toHaveCount(1);
    await expect(fila).toContainText('½ docena + 1 unidad');
    await pedido.getByLabel('Nombre del cliente').fill(cliente);
    await pedido.getByRole('button', { name: /^Cobrar/ }).click();
    await page.getByRole('button', { name: /^Confirmar/ }).click();
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
    const [comanda] = await Promise.all([page.waitForEvent('popup'), venta.getByTitle('Imprimir comanda').click()]);
    const ticket = comanda.locator('pre');
    await expect(ticket).toContainText(/NRO PEDIDO: #\d{6}/);
    await expect(ticket).toContainText('TIPO: RETIRA EN LOCAL');
    await expect(ticket).toContainText(`Cliente: ${cliente}`);
    await expect(ticket).toContainText('7x CAPRESSE');
  });
});
