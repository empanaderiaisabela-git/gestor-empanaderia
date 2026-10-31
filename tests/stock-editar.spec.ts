import { expect, test } from '@playwright/test';

test.describe('editar un ingreso de stock (US-46)', () => {
  test('el admin edita un ingreso desde el historial y lo pasa a otro gusto', async ({ page }) => {
    await page.goto('/stock');
    const buscar = page.getByPlaceholder('Buscar gusto o bebida...').filter({ visible: true });
    await buscar.fill('Bondiola mostaza y miel');
    await page.getByRole('row', { name: /Bondiola mostaza y miel/ }).getByTitle('Ingresar stock').click();
    await page.getByLabel('Cantidad que entra').fill('5');
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    await expect(page.getByText('Stock ingresado: Bondiola mostaza y miel queda con 53')).toBeVisible();

    await page.getByRole('row', { name: /Bondiola mostaza y miel/ }).getByTitle('Historial de ingresos').click();
    await page.getByTitle('Editar ingreso').first().click();
    await expect(page.getByLabel('Cantidad que entra')).toHaveValue('5');
    await page.getByLabel('Gusto o bebida').selectOption({ label: 'Muzza, cebolla y roquefort (stock 48)' });
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByText('Ingreso actualizado: Muzza, cebolla y roquefort queda con 53')).toBeVisible();

    await buscar.fill('Bondiola mostaza y miel');
    await expect(page.getByRole('row', { name: /Bondiola mostaza y miel/ }).getByText('48', { exact: true })).toBeVisible();
  });
});
