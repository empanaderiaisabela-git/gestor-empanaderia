import { expect, type Locator, type Page, test } from '@playwright/test';

async function filaDeStock(page: Page, nombre: string): Promise<Locator> {
  await page.getByPlaceholder('Buscar gusto o bebida...').filter({ visible: true }).fill(nombre);
  return page.getByRole('row').filter({ has: page.getByRole('cell', { name: nombre, exact: true }) });
}

test.describe('Precios en Stock (US-17 y US-28)', () => {
  test('una bebida nueva: el primer sabor fija costo y precio para toda su familia y el segundo sólo pide la cantidad (US-17, US-49)', async ({ page }) => {
    const bebida = `Aqua${Date.now() % 1_000_000}`;
    await page.goto('/alta-de-productos');
    for (const sabor of ['Manzana', 'Pera']) {
      await page.getByRole('button').filter({ hasText: 'Nuevo gusto o bebida' }).click();
      await page.getByLabel(/^Grupo/).selectOption({ label: 'Coca-Cola' });
      await page.getByLabel('Bebida').fill(bebida);
      await page.getByLabel('Litros').fill('1,5');
      await page.getByLabel('Sabor (opcional)').fill(sabor);
      await page.getByRole('button', { name: 'Dar de alta' }).click();
      await expect(page.getByRole('button', { name: 'Dar de alta' })).toHaveCount(0);
    }

    await page.goto('/stock');
    for (const [sabor, costo] of [['Manzana', '3000'], ['Pera', null]] as const) {
      await page.getByRole('button').filter({ hasText: 'Ingresar stock' }).click();
      await page.getByLabel('Categoría').selectOption({ label: 'Coca-Cola' });
      await page.getByRole('combobox', { name: /^Bebida/ }).selectOption({ label: bebida });
      await page.getByLabel('Litros').selectOption({ label: '1.5 L' });
      await page.getByLabel('Sabor').selectOption({ label: `${sabor} (stock 0)` });
      await page.getByLabel('Cantidad que entra').fill('5');
      if (costo) await page.getByLabel(/Costo para el local/).fill(costo);
      if (costo) await page.getByLabel('Precio de venta, 1 unidad').fill('11000');
      await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
      await expect(page.getByText(`Stock ingresado: ${bebida} 1.5 L ${sabor} queda con 5`)).toBeVisible();
    }

    await page.getByPlaceholder('Buscar gusto o bebida...').filter({ visible: true }).fill(bebida);
    await expect(page.getByRole('row', { name: new RegExp(`${bebida} 1.5 L Pera`) }).getByText('1 unidad: $11.000')).toBeVisible();
  });

  test('Alta ya no tiene precios por grupo; cada ciabatta tiene el suyo en "Costo y precio" o en Ingresar stock, y el pan se ingresa sin gusto (US-28, US-29, BUG-25)', async ({ page }) => {
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
    await page.getByLabel('Categoría').selectOption({ label: 'Pan de ciabatta' });
    await expect(page.getByLabel('Gusto o bebida')).toHaveCount(0);

    await page.getByLabel('Categoría').selectOption({ label: 'Ciabattas' });
    await page.getByLabel('Gusto o bebida').selectOption({ label: 'Bondiola' });
    await expect(page.getByLabel('Precio de venta, 1 unidad')).toHaveValue('6000');
    await expect(page.getByLabel('Cantidad que entra')).toHaveCount(0);
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByText(/^Costo y precio guardados: Bondiola/)).toBeVisible();
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
