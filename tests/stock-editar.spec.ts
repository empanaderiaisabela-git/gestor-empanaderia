import { expect, test } from '@playwright/test';

test.describe('el lápiz pisa el stock (US-70)', () => {
  test('el admin escribe el stock real con el lápiz y desde el historial, y queda tal cual', async ({ page }) => {
    await page.goto('/stock');
    const fila = page.getByRole('row', { name: /Fanta 1,5 L/ });
    const stock = page.getByLabel('Stock', { exact: true });
    const guardar = page.getByRole('button', { name: 'Guardar', exact: true });
    await page.getByPlaceholder('Buscar...', { exact: true }).filter({ visible: true }).fill('Fanta');

    await fila.getByTitle('Editar stock').click();
    await expect(stock).toHaveValue('12');
    await expect(page.getByLabel('Proveedor (opcional)')).toHaveCount(0);
    await stock.fill('3');
    await guardar.click();
    await expect(page.getByText('Stock actualizado: Fanta 1,5 L queda con 3')).toBeVisible();
    await expect(fila.getByText('3', { exact: true })).toBeVisible();

    await fila.getByTitle('Ingresar stock').click();
    await page.getByLabel('Cantidad que entra').fill('5');
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    await expect(page.getByText('Stock ingresado: Fanta 1,5 L queda con 8')).toBeVisible();

    await fila.getByTitle('Historial de ingresos').click();
    await page.getByTitle('Editar ingreso').first().click();
    await expect(stock).toHaveValue('8');
    await stock.fill('20');
    await guardar.click();
    await expect(page.getByText('Stock actualizado: Fanta 1,5 L queda con 20')).toBeVisible();
    await expect(fila.getByText('20', { exact: true })).toBeVisible();
  });
});
