import { expect, test } from '@playwright/test';
import { MESSAGES } from '@/config/messages';

const GUSTO = 'Mirinda 1,5 L';

test.describe.serial('Pruebas compuestas: restricciones de eliminación', () => {
  test('un gusto que ya se vendió no se puede eliminar: hay que desactivarlo', async ({ page }) => {
    await page.goto('/ventas/nueva');
    await page.getByRole('region', { name: 'Pepsi', exact: true }).getByRole('button', { name: /1 unidad/ }).click();
    await page.getByRole('list', { name: 'Gustos' }).getByRole('listitem').filter({ hasText: GUSTO }).getByRole('button', { name: 'Agregar' }).click();
    await page.getByRole('button', { name: 'Listo' }).click();
    await page.getByRole('region', { name: 'Pedido actual' }).getByRole('button', { name: /Cobrar/ }).click();
    await page.getByRole('button', { name: /Confirmar/ }).click();
    await expect(page.getByText(/Venta registrada por/)).toBeVisible();

    await page.goto('/alta-de-productos');
    await page.getByPlaceholder('Buscar gusto o bebida por nombre...').filter({ visible: true }).fill(GUSTO);
    await page.getByRole('row').filter({ hasText: GUSTO }).getByTitle('Eliminar').focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Eliminar', exact: true }).last().click();
    await expect(page.getByText(MESSAGES.ERROR.DATABASE.FOREIGN_KEY_VIOLATION)).toBeVisible();
  });
});
