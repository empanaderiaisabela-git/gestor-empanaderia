import { expect, type Page, test } from '@playwright/test';
import { db } from '../src/lib/db';
import { providers } from '../src/lib/db/schema';

async function loginComo(page: Page, usuario: string): Promise<void> {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Usuario' }).fill(usuario);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(usuario);
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
}

test.describe('Gastos (US-14)', () => {
  test('el admin anota un gasto con su proveedor y lo encuentra por su número de factura', async ({ page }) => {
    const numero = `E2E-${Date.now()}`;
    const proveedor = `Molino E2E ${Date.now()}`;
    await db.insert(providers).values({ name: proveedor });
    await page.goto('/gastos');
    await page.getByRole('button', { name: 'Nuevo gasto' }).click();
    await page.getByLabel('Número de factura').fill(numero);
    await page.getByLabel('Título').fill('Harina 25 kg');
    await page.getByLabel('Proveedor').selectOption({ label: proveedor });
    await page.getByLabel('Monto').fill('18500');
    await page.getByLabel('Fecha de la factura').fill('2026-10-24');
    await page.getByRole('button', { name: 'Anotar gasto' }).click();
    await expect(page.getByText('Se registró el gasto')).toBeVisible();

    await page.getByPlaceholder('Buscar por número de factura o título...').filter({ visible: true }).fill(numero);
    const fila = page.getByRole('row', { name: new RegExp(numero) });
    await expect(fila).toContainText('24/10/2026');
    await expect(fila).toContainText(proveedor);
    await expect(fila).toContainText('$18.500');
  });

  test.describe('vendedor', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('no puede entrar a Gastos', async ({ page }) => {
      await loginComo(page, 'vendedor');
      await expect(page).toHaveURL(/\/ventas$/);
      await page.goto('/gastos');
      await expect(page).toHaveURL(/\/ventas$/);
    });
  });
});
