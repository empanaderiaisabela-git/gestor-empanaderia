import { expect, type Page, test } from '@playwright/test';

async function loginComo(page: Page, usuario: string): Promise<void> {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Usuario' }).fill(usuario);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(usuario);
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
}

test.describe('Envíos (US-58)', () => {
  test('el admin da de alta un envío y lo encuentra en la lista', async ({ page }) => {
    const titulo = `Centro E2E ${Date.now()}`;
    await page.goto('/envios');
    await page.getByRole('button', { name: 'Nuevo envío' }).click();
    await page.getByLabel('Título').fill(titulo);
    await page.getByLabel('Detalle').fill('Barrio A hasta Barrio B');
    await page.getByLabel('Monto').fill('1500');
    await page.getByRole('button', { name: 'Guardar envío' }).click();
    await expect(page.getByText('Se registró el envío')).toBeVisible();

    await page.getByPlaceholder('Buscar por título o detalle...').filter({ visible: true }).fill(titulo);
    const fila = page.getByRole('row', { name: new RegExp(titulo) });
    await expect(fila).toContainText('Barrio A hasta Barrio B');
    await expect(fila).toContainText('$1.500');
  });

  test.describe('vendedor', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('no ve Envíos en el menú ni puede entrar (D-1)', async ({ page }) => {
      await loginComo(page, 'vendedor');
      await expect(page).toHaveURL(/\/ventas$/);
      await expect(page.getByRole('link', { name: 'Envíos' })).toHaveCount(0);
      await page.goto('/envios');
      await expect(page).toHaveURL(/\/ventas$/);
    });
  });
});
