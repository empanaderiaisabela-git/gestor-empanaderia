import { test } from '@playwright/test';
import { ProductosPage } from './pages/ProductosPage';
import { LandingPage } from './pages/LandingPage';

test.describe.serial('Pruebas de Landing Page', () => {
  test('el catálogo refleja al instante mostrar y ocultar un producto (T-11)', async ({ page }) => {
    const productosPage = new ProductosPage(page);
    await productosPage.goto();
    const producto = await productosPage.inyectarProductoEfimero({ visibleEnLanding: false });

    const landingPage = new LandingPage(page);
    await productosPage.goto();
    await productosPage.mostrarEnLanding(producto.equipo, producto.proveedor, producto.descripcion);
    await landingPage.esperarQueElCatalogoMuestre(producto.equipo, true);

    await productosPage.goto();
    await productosPage.alternarVisibilidadLanding(producto.equipo, producto.proveedor, producto.descripcion);
    await landingPage.esperarQueElCatalogoMuestre(producto.equipo, false);
  });
});
