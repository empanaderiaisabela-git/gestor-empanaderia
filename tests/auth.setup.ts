import { expect, test as setup } from '@playwright/test';

const AUTH_FILE = 'playwright/.auth/user.json';
const SCREENS = ['/stock', '/ventas', '/ventas/nueva', '/clientes', '/proveedores', '/alta-de-productos', '/usuarios', '/logs', '/home'];

setup.describe.configure({ mode: 'serial' });

setup('autenticarse como admin', async ({ page }) => {
  setup.setTimeout(180_000);
  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await expect(page).not.toHaveURL(/login/, { timeout: 120_000 });
  await page.context().storageState({ path: AUTH_FILE });
});

setup('todas las pantallas del panel responden', async ({ browser }) => {
  setup.setTimeout(300_000);
  const page = await browser.newPage({ storageState: AUTH_FILE });
  for (const screen of SCREENS) {
    await page.goto(screen);
  }
  await page.close();
});
