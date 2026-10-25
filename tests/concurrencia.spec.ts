import { test, expect } from '@playwright/test';
import { ClientesPage } from './pages/ClientesPage';
import { ProveedoresPage } from './pages/ProveedoresPage';

test.describe.parallel('Pruebas de Concurrencia', () => {
  test('Escenario A: Edición Concurrente de Cliente (Lost Update)', async ({ browser }) => {
    const errorMessage = "Los datos en el servidor han cambiado. Por favor, sincroniza la lista e intenta nuevamente.";

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const clientesPage1 = new ClientesPage(page1);
    const clientesPage2 = new ClientesPage(page2);

    await clientesPage1.goto();
    const clienteEfimero = await clientesPage1.inyectarClienteEfimero();

    await clientesPage2.goto();

    await clientesPage1.buscarCliente(clienteEfimero.nombre);
    await clientesPage2.buscarCliente(clienteEfimero.nombre);

    const fila1 = clientesPage1.obtenerFilaPorNombre(clienteEfimero.nombre);
    await fila1.getByRole('button', { name: ClientesPage.UI.BTN_EDITAR, exact: true }).click();

    const fila2 = clientesPage2.obtenerFilaPorNombre(clienteEfimero.nombre);
    await fila2.getByRole('button', { name: ClientesPage.UI.BTN_EDITAR, exact: true }).click();

    await clientesPage1.inputTelefono.fill('1111111111');
    await clientesPage1.btnActualizar.click();

    await expect(clientesPage1.inputTelefono).toBeHidden();

    await clientesPage2.inputNombre.fill('Nombre Modificado');
    await clientesPage2.btnActualizar.click();

    await expect(page2.getByText(errorMessage)).toBeVisible();

    await clientesPage2.btnCancelar.click();
    await clientesPage2.sincronizar();
    await clientesPage2.buscarCliente(clienteEfimero.nombre);
    const fila2Sync = clientesPage2.obtenerFilaPorNombre(clienteEfimero.nombre);
    await fila2Sync.getByRole('button', { name: ClientesPage.UI.BTN_EDITAR, exact: true }).click();

    await expect(clientesPage2.inputTelefono).toHaveValue('1111111111');

    await context1.close();
    await context2.close();
  });

  test('Escenario C: el proveedor se borra mientras otro carga un ingreso de stock con él', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const errorMessage = 'Una de las entidades relacionadas ya no existe. Por favor, sincroniza los datos.';
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const proveedoresPage2 = new ProveedoresPage(page2);
    await proveedoresPage2.goto();
    const proveedor = await proveedoresPage2.inyectarProveedorEfimero();

    // Usuario 1 empieza a cargar un ingreso de stock con ese proveedor
    await page1.goto('/stock');
    await page1.getByRole('button').filter({ hasText: 'Ingresar stock' }).click();
    const gusto = await page1.getByLabel('Gusto o bebida').locator('option', { hasText: 'Fanta 1,5 L' }).getAttribute('value');
    await page1.getByLabel('Gusto o bebida').selectOption(gusto ?? '');
    await page1.getByLabel('Cantidad que entra').fill('6');
    await page1.getByLabel('Proveedor (opcional)').selectOption({ label: proveedor });

    // Usuario 2 elimina el proveedor
    await proveedoresPage2.eliminarProveedor(proveedor);
    await expect(page2.getByText('Proveedor eliminado/a exitosamente')).toBeVisible();

    // Usuario 1 confirma el ingreso
    await page1.getByRole('button', { name: 'Ingresar', exact: true }).click();
    await expect(page1.getByText(errorMessage)).toBeVisible();

    await context1.close();
    await context2.close();
  });
});
