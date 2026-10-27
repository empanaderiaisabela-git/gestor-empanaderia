import { expect, test } from '@playwright/test';

test.describe('Precios en Stock (US-17)', () => {
  test('el admin fija costo y precio de venta al ingresar el primer stock de un gusto nuevo', async ({ page }) => {
    const gusto = `Pizza precio ${Date.now()}`;
    await page.goto('/alta-de-productos');
    await page.getByRole('button').filter({ hasText: 'Nuevo gusto o bebida' }).click();
    await page.getByLabel(/^Grupo/).selectOption({ label: 'Pizzas' });
    await page.getByLabel('Nombre del gusto o bebida').fill(gusto);
    await page.getByRole('button', { name: 'Dar de alta' }).click();
    await page.getByPlaceholder('Buscar gusto o bebida por nombre...').filter({ visible: true }).fill(gusto);
    await expect(page.getByRole('row', { name: new RegExp(gusto) })).toBeVisible();

    await page.goto('/stock');
    await page.getByRole('button').filter({ hasText: 'Ingresar stock' }).click();
    await page.getByLabel('Categoría').selectOption({ label: 'Pizzas' });
    await page.getByLabel('Gusto o bebida').selectOption({ label: `${gusto} (stock 0)` });
    await page.getByLabel('Cantidad que entra').fill('5');
    await page.getByLabel(/Costo para el local/).fill('3000');
    await page.getByLabel('Precio de venta, pizza entera').fill('11000');
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();

    await page.getByPlaceholder('Buscar gusto o bebida...').filter({ visible: true }).fill(gusto);
    await expect(page.getByRole('row', { name: new RegExp(gusto) }).getByText('pizza entera: $11.000')).toBeVisible();
  });

  test('el precio único de Ciabattas se guarda en Alta y Stock lo muestra sin pedirlo (US-23)', async ({ page }) => {
    await page.goto('/alta-de-productos');
    const tarjeta = page.getByRole('form', { name: 'Precios de Ciabattas' });
    await expect(tarjeta.getByLabel('1 unidad')).toHaveValue('6000');
    await tarjeta.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Precios del grupo guardados exitosamente')).toBeVisible();

    await page.goto('/stock');
    await page.getByRole('button').filter({ hasText: 'Ingresar stock' }).click();
    await page.getByLabel('Categoría').selectOption({ label: 'Ciabattas' });
    await page.getByLabel('Gusto o bebida').selectOption({ label: 'Capresse (stock 10)' });
    await expect(page.getByLabel(/^Precio de venta/)).toHaveCount(0);
    await page.keyboard.press('Escape');

    await page.getByPlaceholder('Buscar gusto o bebida...').filter({ visible: true }).fill('Capresse');
    await expect(page.getByRole('row', { name: /Capresse/ }).getByText('1 unidad: $6.000')).toBeVisible();
  });
});
