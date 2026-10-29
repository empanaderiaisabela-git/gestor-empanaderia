import { expect, type Locator, type Page, test } from '@playwright/test';

const grupo = (page: Page, nombre: string): Locator => page.getByRole('region', { name: nombre, exact: true });
const gusto = (page: Page, nombre: string): Locator => page.getByRole('list', { name: 'Gustos' }).getByRole('listitem').filter({ hasText: new RegExp(`^${nombre}\\$`) });

test.describe('tablero de ventas (US-5)', () => {
  test('arma una ½ docena surtida; el total respeta las reglas del cliente', async ({ page }) => {
    await page.goto('/ventas/nueva');
    await grupo(page, 'Empanadas').getByRole('button', { name: /½ docena/ }).click();
    await gusto(page, 'Carne').getByRole('button', { name: 'Agregar uno' }).click();
    await expect(page.getByText('Se agregó Carne al pedido')).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'Se agregó Carne' })).toHaveCSS('animation-name', 'toast-drop');
    await gusto(page, 'Carne').getByRole('button', { name: 'Agregar uno' }).click();
    await expect(page.getByText('2 Carne · faltan 4')).toBeVisible();
    await gusto(page, 'Pollo').getByRole('button', { name: 'Completar' }).click();
    await page.getByRole('button', { name: 'Listo' }).click();

    await page.getByRole('button', { name: /^Ver pedido/ }).click();
    const pedido = page.getByRole('region', { name: 'Pedido actual' });
    await expect(pedido.getByText('2 Carne + 4 Pollo')).toBeVisible();
    await expect(pedido.getByText('$6.500').first()).toBeVisible();
  });

  test('los gustos van del más barato al más caro y se buscan sin importar mayúsculas (US-35)', async ({ page }) => {
    await page.goto('/ventas/nueva');
    await grupo(page, 'Empanadas').getByRole('button', { name: /^1 unidad/ }).click();
    await expect(gusto(page, 'Humita')).toBeVisible();
    const montos = (await page.getByRole('list', { name: 'Gustos' }).getByRole('listitem').locator('p:nth-child(2)').allInnerTexts()).map((texto) => Number(texto.split(' · ')[0].replace(/\D/g, '')));
    expect(montos.length).toBeGreaterThan(1);
    expect([...montos].sort((a, b) => a - b)).toEqual(montos);
    await page.getByLabel('Buscar gusto').fill('HUMITA');
    await expect(page.getByRole('list', { name: 'Gustos' }).getByRole('listitem')).toHaveCount(1);
    await expect(gusto(page, 'Humita')).toBeVisible();
  });

  test('una ½ docena a medio armar muestra lo que falta y no deja cobrar', async ({ page }) => {
    await page.goto('/ventas/nueva');
    await grupo(page, 'Empanadas').getByRole('button', { name: /½ docena/ }).click();
    await gusto(page, 'Humita').getByRole('button', { name: 'Agregar uno' }).click();
    await page.getByRole('button', { name: 'Listo' }).click();
    await page.getByRole('button', { name: /^Ver pedido/ }).click();
    const pedido = page.getByRole('region', { name: 'Pedido actual' });
    await expect(pedido.getByText('faltan 5')).toBeVisible();
    await expect(pedido.getByRole('button', { name: /Cobrar/ })).toBeDisabled();
  });

  test.describe('con "menos movimiento" en el sistema', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });

    test('el aviso igual baja desde arriba y se desvanece (US-35)', async ({ page }) => {
      await page.goto('/ventas/nueva');
      await grupo(page, 'Empanadas').getByRole('button', { name: /½ docena/ }).click();
      await gusto(page, 'Humita').getByRole('button', { name: 'Agregar uno' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Se agregó Humita' })).toHaveCSS('animation-name', 'toast-drop');
    });
  });

  test('cada grupo se pinta con su color y lleva su ícono (US-20)', async ({ page }) => {
    await page.goto('/ventas/nueva');
    const colores = { Empanadas: 'rgb(255, 237, 213)', Pizzas: 'rgb(253, 244, 200)', Sanguches: 'rgb(226, 241, 223)', Ciabattas: 'rgb(242, 230, 215)', 'Coca-Cola': 'rgb(253, 227, 227)', Pepsi: 'rgb(223, 233, 251)' };
    for (const [nombre, fondo] of Object.entries(colores)) {
      await expect(grupo(page, nombre)).toHaveCSS('background-color', fondo);
      await expect(grupo(page, nombre).locator('svg.lucide').first()).toBeVisible();
    }
  });
});
