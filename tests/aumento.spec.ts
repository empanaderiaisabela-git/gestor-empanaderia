import { expect, test } from '@playwright/test';

test.describe('Registrar aumento (US-50)', () => {
  test('el admin aumenta el precio de una sola bebida destildando el resto de la categoría', async ({ page }) => {
    const bebida = `Aum${Date.now() % 1_000_000}`;
    await page.goto('/alta-de-productos');
    await page.getByRole('button').filter({ hasText: 'Nuevo gusto o bebida' }).click();
    await page.getByLabel(/^Grupo/).selectOption({ label: 'Quilmes' });
    await page.getByLabel('Bebida').fill(bebida);
    await page.getByLabel('Litros').fill('1');
    await page.getByRole('button', { name: 'Dar de alta' }).click();
    await expect(page.getByRole('button', { name: 'Dar de alta' })).toHaveCount(0);

    await page.goto('/stock');
    await page.getByRole('button').filter({ hasText: 'Ingresar stock' }).click();
    await page.getByLabel('Categoría').selectOption({ label: 'Quilmes' });
    await page.getByRole('combobox', { name: /^Bebida/ }).selectOption({ label: bebida });
    await page.getByLabel('Litros').selectOption({ label: '1 L' });
    await page.getByLabel('Cantidad que entra').fill('3');
    await page.getByLabel(/Costo para el local/).fill('5000');
    await page.getByLabel('Precio de venta, 1 unidad').fill('11000');
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    await expect(page.getByText(`Stock ingresado: ${bebida} 1 L queda con 3`)).toBeVisible();

    await page.getByRole('button', { name: 'Registrar aumento' }).click();
    await page.getByLabel('Categoría').selectOption({ label: 'Quilmes' });
    const checks = page.getByRole('group', { name: 'Productos' }).getByRole('checkbox');
    for (let index = 0; index < (await checks.count()); index += 1) {
      const label = (await checks.nth(index).locator('xpath=..').textContent()) ?? '';
      if (!label.includes(bebida)) await checks.nth(index).uncheck();
    }
    await page.getByLabel('Aumento del precio de venta (%)').fill('10');
    await page.getByRole('button', { name: 'Aplicar aumento' }).click();
    await expect(page.getByText('Aumento aplicado a 1 producto')).toBeVisible();

    await page.getByPlaceholder('Buscar gusto o bebida...').filter({ visible: true }).fill(bebida);
    await expect(page.getByRole('row', { name: new RegExp(bebida) }).getByText('1 unidad: $12.100')).toBeVisible();
  });
});
