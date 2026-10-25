import { expect, type Page, test } from '@playwright/test';

async function loginComo(page: Page, usuario: string): Promise<void> {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Usuario' }).fill(usuario);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(usuario);
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
}

function menu(page: Page) {
  return page.getByRole('navigation', { name: 'Menú principal' });
}

test.describe('menú y navegación por rol (US-2)', () => {
  test.describe('vendedor', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('entra a Ventas/Pedidos, ve sólo su menú y no puede abrir secciones ajenas', async ({ page }) => {
      await loginComo(page, 'vendedor');
      await expect(page).toHaveURL(/\/ventas$/);
      await expect(menu(page).getByRole('link')).toHaveText(['Ventas/Pedidos', 'Stock', 'Clientes']);
      await page.goto('/usuarios');
      await expect(page).toHaveURL(/\/ventas$/);
      await page.goto('/');
      await expect(page).toHaveURL(/\/ventas$/);
    });
  });

  test('el admin ve Estadísticas primero y el sidebar de escritorio mide 240 px', async ({ page }) => {
    await page.goto('/clientes');
    await expect(menu(page).getByRole('link').first()).toHaveText('Estadísticas');
    const ancho = await menu(page).evaluate((nav) => nav.closest('.no-print')?.getBoundingClientRect().width ?? 0);
    expect(ancho).toBe(240);
  });
});
