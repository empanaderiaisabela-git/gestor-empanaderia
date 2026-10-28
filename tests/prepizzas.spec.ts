import { expect, type Locator, type Page, test } from '@playwright/test';

const grupo = (page: Page, nombre: string): Locator => page.getByRole('region', { name: nombre, exact: true });
const gusto = (page: Page, nombre: string): Locator => page.getByRole('list', { name: 'Gustos' }).getByRole('listitem').filter({ hasText: new RegExp(`^${nombre}\\$`) });

async function filaDeStock(page: Page, nombre: string): Promise<Locator> {
  await page.getByPlaceholder('Buscar gusto o bebida...').filter({ visible: true }).fill(nombre);
  return page.getByRole('row').filter({ has: page.getByRole('cell', { name: nombre, exact: true }) });
}

async function agregarPizza(page: Page, presentacion: RegExp, gustos: string[]): Promise<void> {
  await grupo(page, 'Pizzas').getByRole('button', { name: presentacion }).click();
  for (const nombre of gustos) await gusto(page, nombre).getByRole('button', { name: 'Agregar' }).click();
  await page.getByRole('button', { name: 'Listo' }).click();
}

test.describe('prepizzas (US-29)', () => {
  test('se ingresan 2 prepizzas, se venden una mitad y mitad y una Muzza, y los gustos de pizza desaparecen de Ventas', async ({ page }) => {
    await page.goto('/stock');
    await page.getByLabel('Filtrar por grupo').selectOption({ label: 'Pizzas' });
    await expect(page.getByRole('row').nth(1)).toContainText('Prepizza');
    await (await filaDeStock(page, 'Prepizza')).getByTitle('Ingresar stock').click();
    await expect(page.getByLabel(/Costo para el local/)).toHaveCount(0);
    await page.getByLabel('Cantidad que entra').fill('2');
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    await expect(page.getByText('Stock ingresado: Prepizza queda con 2')).toBeVisible();

    await page.goto('/ventas/nueva');
    await agregarPizza(page, /2 sabores/, ['Muzza', 'Napolitana']);
    await agregarPizza(page, /^1 sabor/, ['Muzza']);
    await page.getByRole('button', { name: /^Ver pedido/ }).click();
    const pedido = page.getByRole('region', { name: 'Pedido actual' });
    await expect(pedido.getByText('Muzza / Napolitana')).toBeVisible();
    await pedido.getByRole('button', { name: 'Cobrar $23.000' }).click();
    await page.getByRole('button', { name: 'Confirmar $23.000' }).click();
    await expect(page.getByText('Venta registrada por $23.000')).toBeVisible();

    await expect(grupo(page, 'Pizzas').getByText('Sin stock de Prepizza')).toBeVisible();
    await expect(grupo(page, 'Pizzas').getByRole('button', { name: /2 sabores/ })).toBeDisabled();

    await page.goto('/stock');
    await expect((await filaDeStock(page, 'Prepizza')).getByText('Sin stock')).toBeVisible();
  });
});
