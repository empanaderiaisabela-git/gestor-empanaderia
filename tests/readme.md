# Tests E2E (Playwright)

Los tests E2E corren contra la base descartable **`db-test`**, nunca contra la de desarrollo. La estrategia general
está en [`docs/testing.md`](../docs/testing.md).

## Cómo se corren

```bash
docker compose up -d --wait db-test   # base de tests (postgres:15 en el 5434, tmpfs)
npm run test:e2e                      # Chromium
npm run test:e2e:all                  # Chromium, Firefox y WebKit
npx playwright show-report            # reporte HTML de la última corrida
```

`npm run test:e2e` hace todo lo demás:

1. Carga `.env.test` y corre Playwright con `--conditions=react-server`, porque los Page Objects importan
   `src/lib/db`, que lleva `import 'server-only'`.
2. `playwright.config.ts` aborta si `LOCAL_DATABASE_URL` no es la de `db-test`. Por eso un `npx playwright test`
   sin `.env.test` no corre.
3. El `webServer` corre `npm run e2e:server`:
   - `scripts/e2e-prepare.ts` vuelve a verificar la URL;
   - borra `.next-e2e`, aplica las migraciones y carga el seed (`db:seed`: usuarios `admin` y `vendedor`, más datos
     de demo);
   - compila la app con `next build` y la levanta con `next start` en el puerto **3100**, con su propia carpeta
     `.next-e2e`, así no choca con el `npm run dev` del dev (3000, `.next`). Como `APP_ENV` está vacío, la app usa
     `db-test` (ADR 0002).
4. El proyecto `setup` (`auth.setup.ts`) inicia sesión como `admin`, guarda la sesión en
   `playwright/.auth/user.json` y abre cada pantalla del panel una vez, como prueba de humo.

## Reglas

- Cada test inyecta sus propios datos con sufijo único (`inyectarProductoEfimero()`, etc.). No hay datos fijos
  compartidos entre tests.
- Reintentos: 0 en local y 1 en el CI. Un test que pasa sólo al reintentar es inestable y se investiga.
- Por qué `next build` + `next start` y no `next dev`: con `next dev` cada pantalla y cada Server Action compila
  en frío, y con varios workers en paralelo los tests se cortaban por tiempo (en esta PC, sobre OneDrive). El build
  de producción es estable y se parece a lo que corre en producción.
- El catálogo (`/home`) se revalida a demanda (T-11, ADR 0004): un cambio hecho por la UI aparece al instante, pero
  uno insertado directo en la base no aparece hasta la próxima mutación. Por eso `landing.spec.ts` muestra y oculta
  el producto desde Productos, y `esperarQueElCatalogoMuestre` recarga hasta 10 s.
- Selectores por rol y texto visible; `data-testid` (de `src/constants/test-ids.ts`) sólo cuando no hay otro.
- Grabar un flujo nuevo: con `npm run e2e:server` levantado en otra terminal (con `.env.test` cargado),
  `npx playwright codegen http://localhost:3100`.

## Archivos

| Archivo | Qué cubre |
|---|---|
| `auth.setup.ts` | Login de admin y prueba de humo de las pantallas del panel |
| `clientes.spec.ts`, `equipos.spec.ts`, `proveedores.spec.ts`, `productos.spec.ts`, `usuarios.spec.ts` | ABM, validaciones, activar/desactivar y borrar |
| `ventas.spec.ts` | Venta completa con descuento y pago |
| `concurrencia.spec.ts` | Dos sesiones a la vez: edición perdida, venta contra edición, borrado de una entidad relacionada |
| `landing.spec.ts` | Mostrar y ocultar un producto se refleja al instante en el catálogo público (revalidación a demanda) |
| `pruebasCompuestas.spec.ts` | Borrados bloqueados por registros relacionados |
| `pages/` | Page Objects |
