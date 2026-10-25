import { expect, test } from '@playwright/test';

test.describe('Stock (US-4)', () => {
  test('el admin ingresa stock de un gusto y la grilla lo refleja', async ({ page }) => {
    await page.goto('/stock');
    await page.getByRole('button').filter({ hasText: 'Ingresar stock' }).click();
    await page.getByLabel('Gusto o bebida').selectOption({ label: 'Humita (stock 48)' });
    await page.getByLabel('Cantidad que entra').fill('12');
    await page.getByLabel(/Costo por unidad/).fill('460');
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();

    await expect(page.getByText('Stock ingresado: Humita queda con 60')).toBeVisible();
    await page.getByPlaceholder('Buscar gusto o bebida...').filter({ visible: true }).fill('Humita');
    await expect(page.getByRole('row', { name: /Humita/ }).getByText('60', { exact: true })).toBeVisible();
  });

  test('el historial muestra el ingreso con su costo y su usuario', async ({ page }) => {
    await page.goto('/stock');
    await page.getByPlaceholder('Buscar gusto o bebida...').filter({ visible: true }).fill('Verdura');
    await page.getByRole('row', { name: /Verdura/ }).getByTitle('Ingresar stock').click();
    await page.getByLabel('Cantidad que entra').fill('6');
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    await expect(page.getByText('Stock ingresado: Verdura queda con 54')).toBeVisible();

    await page.getByRole('row', { name: /Verdura/ }).getByTitle('Historial de ingresos').click();
    await expect(page.getByText('+6')).toBeVisible();
    await expect(page.getByText(/\$450 · Sin proveedor · admin/)).toBeVisible();
  });
});
