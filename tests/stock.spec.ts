import { expect, test } from '@playwright/test';

test.describe('Stock (US-4, US-34)', () => {
  test('el admin ingresa stock de un gusto y la grilla lo refleja', async ({ page }) => {
    await page.goto('/stock');
    await page.getByRole('button').filter({ hasText: 'Ingresar stock' }).click();
    await page.getByLabel('Categoría').selectOption({ label: 'Empanadas' });
    await page.getByLabel('Gusto o bebida').selectOption({ label: 'Humita (stock 48)' });
    await page.getByLabel('Cantidad que entra').fill('12');
    await page.getByLabel(/Costo para el local, por unidad/).fill('460');
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
    await expect(page.getByText(/Costo para el local \$450 · Sin proveedor · admin/)).toBeVisible();
  });

  test('con un mínimo mayor al stock, el stock se ve amarillo (US-45)', async ({ page }) => {
    await page.goto('/stock');
    await page.getByPlaceholder('Buscar gusto o bebida...').filter({ visible: true }).fill('Muzza y pepperoni');
    await page.getByRole('row', { name: /Muzza y pepperoni/ }).getByTitle('Ingresar stock').click();
    await page.getByLabel('Cantidad que entra').fill('1');
    await page.getByLabel('Stock mínimo (opcional)').fill('100');
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    await expect(page.getByText('Stock ingresado: Muzza y pepperoni queda con 49')).toBeVisible();
    const badge = page.getByRole('row', { name: /Muzza y pepperoni/ }).getByTitle('Mínimo: 100');
    await expect(badge).toHaveText('49');
    await expect(badge).toHaveClass(/bg-amber-100/);
  });

  test('"Solo sin stock" muestra lo que falta y "Quitar sin stock" lo saca (US-34)', async ({ page }) => {
    await page.goto('/stock');
    const filas = page.getByRole('row').filter({ has: page.getByRole('cell') });
    await page.getByLabel('Ordenar Stock').selectOption({ label: 'Solo sin stock' });
    await expect(filas.filter({ hasText: 'Pan de ciabatta' })).toBeVisible();
    await expect(filas.filter({ hasNotText: 'Sin stock' })).toHaveCount(0);
    await page.getByLabel('Ordenar Stock').selectOption({ label: 'Quitar sin stock' });
    await expect(filas.filter({ hasText: 'Sin stock' })).toHaveCount(0);
  });
});
