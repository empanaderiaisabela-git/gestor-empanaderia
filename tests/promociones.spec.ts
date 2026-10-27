import { expect, type Page, test } from '@playwright/test';

async function loginComo(page: Page, usuario: string): Promise<void> {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Usuario' }).fill(usuario);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(usuario);
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
}

test.describe('Promociones (US-8)', () => {
  test('el admin arma una promo con dos productos y su precio de venta, la ve en la grilla y la desactiva', async ({ page }) => {
    const nombre = `Promo E2E ${Date.now()}`;
    await page.goto('/promociones');
    await page.getByRole('button', { name: 'Nueva promoción' }).click();
    await page.getByLabel('Nombre de la promo').fill(nombre);
    await page.getByLabel('Presentación del producto 1').selectOption({ label: '1 docena' });
    await page.getByRole('button', { name: /Agregar producto/ }).click();
    await page.getByLabel('Grupo del producto 2').selectOption({ label: 'Coca-Cola' });
    await page.getByLabel('Precio de venta de la promo').fill('15000');
    await page.getByRole('button', { name: 'Crear promoción' }).click();
    await expect(page.getByText('Se registró la promoción')).toBeVisible();

    await page.getByPlaceholder('Buscar promoción por nombre...').filter({ visible: true }).fill(nombre);
    const fila = page.getByRole('row', { name: new RegExp(nombre) });
    await expect(fila.getByText('Empanadas · 1 docena + Coca-Cola · 1 unidad')).toBeVisible();
    await expect(fila.getByText('$15.000')).toBeVisible();
    await fila.getByTitle('Desactivar').click();
    await expect(page.getByText('Se desactivó la promoción')).toBeVisible();
  });

  test.describe('vendedor', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('no puede entrar a Promociones', async ({ page }) => {
      await loginComo(page, 'vendedor');
      await expect(page).toHaveURL(/\/ventas$/);
      await page.goto('/promociones');
      await expect(page).toHaveURL(/\/ventas$/);
    });
  });
});
