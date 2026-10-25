import { expect, type Locator, type Page, test } from '@playwright/test';

const grupo = (page: Page, nombre: string): Locator => page.getByRole('region', { name: nombre, exact: true });
const gusto = (page: Page, nombre: string): Locator => page.getByRole('list', { name: 'Gustos' }).getByRole('listitem').filter({ hasText: new RegExp(`^${nombre}\\$`) });

test.describe('tablero de ventas (US-5)', () => {
  test('arma una ½ docena surtida y una pizza mitad y mitad; el total respeta las reglas del cliente', async ({ page }) => {
    await page.goto('/ventas/nueva');
    await grupo(page, 'Empanadas').getByRole('button', { name: /½ docena/ }).click();
    await gusto(page, 'Carne').getByRole('button', { name: 'Agregar uno' }).click();
    await gusto(page, 'Carne').getByRole('button', { name: 'Agregar uno' }).click();
    await expect(page.getByText('2 Carne · faltan 4')).toBeVisible();
    await gusto(page, 'Pollo').getByRole('button', { name: 'Completar' }).click();
    await page.getByRole('button', { name: 'Listo' }).click();

    await grupo(page, 'Pizzas').getByRole('button', { name: /2 sabores/ }).click();
    await gusto(page, 'Muzza').getByRole('button', { name: 'Agregar' }).click();
    await gusto(page, 'Napolitana').getByRole('button', { name: 'Agregar' }).click();
    await page.getByRole('button', { name: 'Listo' }).click();

    const pedido = page.getByRole('region', { name: 'Pedido actual' });
    await expect(pedido.getByText('2 Carne + 4 Pollo')).toBeVisible();
    await expect(pedido.getByText('Muzza / Napolitana')).toBeVisible();
    await expect(pedido.getByText('$18.500').first()).toBeVisible();
  });

  test('una ½ docena a medio armar muestra lo que falta y no deja cobrar', async ({ page }) => {
    await page.goto('/ventas/nueva');
    await grupo(page, 'Empanadas').getByRole('button', { name: /½ docena/ }).click();
    await gusto(page, 'Humita').getByRole('button', { name: 'Agregar uno' }).click();
    await page.getByRole('button', { name: 'Listo' }).click();
    const pedido = page.getByRole('region', { name: 'Pedido actual' });
    await expect(pedido.getByText('faltan 5')).toBeVisible();
    await expect(pedido.getByRole('button', { name: /Cobrar/ })).toBeDisabled();
  });
});
