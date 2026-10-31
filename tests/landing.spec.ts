import { expect, type Page, test } from '@playwright/test';
import { LandingPage } from './pages/LandingPage';

const GUSTO = 'Quilmes 500 ml';

async function alternarEnAlta(page: Page, boton: 'Ocultar del catálogo' | 'Mostrar en el catálogo'): Promise<void> {
  await page.goto('/alta-de-productos');
  await page.getByPlaceholder('Buscar gusto o bebida por nombre...').filter({ visible: true }).fill(GUSTO);
  await page.getByRole('row').filter({ hasText: GUSTO }).getByTitle(boton).focus();
  await page.keyboard.press('Enter');
}

test.describe.serial('catálogo público (T-11 y T-12)', () => {
  test('ocultar y mostrar un gusto desde Alta de productos se refleja al instante en el catálogo', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.esperarQueElCatalogoMuestre(GUSTO, true);

    await alternarEnAlta(page, 'Ocultar del catálogo');
    await expect(page.getByText(`${GUSTO} ya no se muestra en el catálogo`)).toBeVisible();
    await landing.esperarQueElCatalogoMuestre(GUSTO, false);

    await alternarEnAlta(page, 'Mostrar en el catálogo');
    await expect(page.getByText(`${GUSTO} se muestra en el catálogo`)).toBeVisible();
    await landing.esperarQueElCatalogoMuestre(GUSTO, true);
  });
});
