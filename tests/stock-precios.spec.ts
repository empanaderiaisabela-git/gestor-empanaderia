import { expect, type Locator, type Page, test } from '@playwright/test';

async function filaDeStock(page: Page, nombre: string): Promise<Locator> {
  await page.getByPlaceholder('Buscar gusto o bebida...').filter({ visible: true }).fill(nombre);
  return page.getByRole('row').filter({ has: page.getByRole('cell', { name: nombre, exact: true }) });
}

test.describe('Precios en Stock (US-17 y US-28)', () => {
  test('el admin fija costo y precio de venta al ingresar el primer stock de una bebida nueva', async ({ page }) => {
    const gusto = `Bebida precio ${Date.now()}`;
    await page.goto('/alta-de-productos');
    await page.getByRole('button').filter({ hasText: 'Nuevo gusto o bebida' }).click();
    await page.getByLabel(/^Grupo/).selectOption({ label: 'Coca-Cola' });
    await page.getByLabel('Nombre del gusto o bebida').fill(gusto);
    await page.getByRole('button', { name: 'Dar de alta' }).click();
    await page.getByPlaceholder('Buscar gusto o bebida por nombre...').filter({ visible: true }).fill(gusto);
    await expect(page.getByRole('row', { name: new RegExp(gusto) })).toBeVisible();

    await page.goto('/stock');
    await page.getByRole('button').filter({ hasText: 'Ingresar stock' }).click();
    await page.getByLabel('Categoría').selectOption({ label: 'Coca-Cola' });
    await page.getByLabel('Gusto o bebida').selectOption({ label: `${gusto} (stock 0)` });
    await page.getByLabel('Cantidad que entra').fill('5');
    await page.getByLabel(/Costo para el local/).fill('3000');
    await page.getByLabel('Precio de venta, 1 unidad').fill('11000');
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();

    await page.getByPlaceholder('Buscar gusto o bebida...').filter({ visible: true }).fill(gusto);
    await expect(page.getByRole('row', { name: new RegExp(gusto) }).getByText('1 unidad: $11.000')).toBeVisible();
  });

  test('Alta ya no tiene precios por grupo; cada ciabatta tiene el suyo en "Costo y precio" y se ingresa sólo el pan (US-28, US-29)', async ({ page }) => {
    await page.goto('/alta-de-productos');
    await expect(page.getByRole('button').filter({ hasText: 'Nuevo gusto o bebida' })).toBeVisible();
    await expect(page.getByRole('form', { name: /^Precios de/ })).toHaveCount(0);

    await page.goto('/stock');
    const bondiola = (await filaDeStock(page, 'Bondiola')).filter({ hasText: 'Ciabattas' });
    await expect(bondiola.getByText('1 unidad: $6.000')).toBeVisible();
    await expect(bondiola.getByTitle('Ingresar stock')).toHaveCount(0);
    await bondiola.getByTitle('Costo y precio').click();
    await expect(page.getByLabel('Precio de venta, 1 unidad')).toHaveValue('6000');
    await page.keyboard.press('Escape');

    await page.getByRole('button').filter({ hasText: 'Ingresar stock' }).click();
    await page.getByLabel('Categoría').selectOption({ label: 'Ciabattas' });
    await expect(page.getByLabel('Gusto o bebida').locator('option')).toHaveText(['Elegí un gusto o bebida', /^Pan de ciabatta \(stock \d+\)$/]);
  });

  test('aumento de la docena: el precio de un gusto se aplica a todos los de Empanadas (US-28 CA-5)', async ({ page }) => {
    await page.goto('/stock');
    await (await filaDeStock(page, 'Carne cheddar')).getByTitle('Costo y precio').click();
    await expect(page.getByLabel('Precio de venta, 1 docena')).toHaveValue('12000');
    await page.getByLabel('Precio de venta, 1 docena').fill('13000');
    await page.getByLabel('Aplicar este precio a todos los gustos de Empanadas').check();
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByText(/^Costo y precio guardados: Carne cheddar\. Precio copiado a \d+ gustos$/)).toBeVisible();

    await expect((await filaDeStock(page, 'Carne cheddar')).getByText('1 docena: $13.000')).toBeVisible();
    await expect((await filaDeStock(page, 'Jamón y muzza')).getByText('1 docena: $13.000')).toBeVisible();
    await expect((await filaDeStock(page, 'Jamón y muzza')).getByText('½ docena: $6.500')).toBeVisible();
  });
});
