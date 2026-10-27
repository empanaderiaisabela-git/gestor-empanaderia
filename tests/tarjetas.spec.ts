import { expect, type Page, test } from '@playwright/test';

async function loginComo(page: Page, usuario: string): Promise<void> {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Usuario' }).fill(usuario);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(usuario);
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
}

test.describe('Tarjetas (US-10)', () => {
  test('el admin da de alta una tarjeta con dos planes y la ve en la grilla', async ({ page }) => {
    const nombre = `Tarjeta E2E ${Date.now()}`;
    await page.goto('/tarjetas');
    await page.getByRole('button', { name: 'Nueva tarjeta' }).click();
    await page.getByLabel('Nombre de la tarjeta').fill(nombre);
    await page.getByRole('button', { name: /Agregar plan/ }).click();
    await page.getByLabel('Recargo % del plan 2').fill('15');
    await page.getByRole('button', { name: 'Crear tarjeta' }).click();
    await expect(page.getByText('Se registró la tarjeta')).toBeVisible();

    await page.getByPlaceholder('Buscar tarjeta por nombre...').filter({ visible: true }).fill(nombre);
    await expect(page.getByRole('row', { name: new RegExp(nombre) }).getByText('1 cuota sin recargo · 3 cuotas +15 %')).toBeVisible();
  });

  test.describe('vendedor', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('no puede entrar a Tarjetas', async ({ page }) => {
      await loginComo(page, 'vendedor');
      await expect(page).toHaveURL(/\/ventas$/);
      await page.goto('/tarjetas');
      await expect(page).toHaveURL(/\/ventas$/);
    });
  });
});
