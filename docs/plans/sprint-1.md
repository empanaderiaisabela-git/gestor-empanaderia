# Plan maestro: Sprint 1 · Vender con el modelo de la empanadería

- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-25 · **Estado**: Aprobado (2026-10-25)
- **Ítem que lo produce**: T-10 (backlog de los Sprints 1 y 2 desde `specs.md`).
- Cada ítem conserva su `docs/plans/<ID>-<slug>.md`. Sale de su sección de acá y suma lo que aparezca al arrancarlo
  (skill `start-task`, con el OK del dev).
- El Sprint 2 está en [`sprint-2.md`](sprint-2.md), en borrador.

## Contexto

El cliente, **Empanadería Isabela**, mandó su pedido en
[`docs/requerimientos/specs.md`](../requerimientos/specs.md), con dos wireframes y el logo en
[`docs/wireframes-ventas-gestor/`](../wireframes-ventas-gestor/). Lo que pide:

- Un POS con un tablero por comida.
- Stock por gusto.
- 4 medios de pago.
- Estadísticas del día.
- Promociones, tarjetas y gastos.
- Un menú por rol.
- La app con su marca.
- Que el catálogo deje de gastar ISR Writes en Vercel.

El código heredado es de una casa de celulares:

- Un producto es un "lote" de una categoría (`devices`).
- No existen gustos, presentaciones ni grupos de comida.
- La venta confía en los precios que manda el navegador.

Este sprint deja al local **vendiendo con su modelo real**. Promos, tarjetas, estadísticas nuevas y gastos van en el
Sprint 2.

## Decisiones del dev (2026-10-25)

Respuestas del dev a las preguntas de descubrimiento (`workflow.md` §2) sobre `specs.md`.

| Tema | Decisión | Por qué / consecuencia |
|---|---|---|
| Grupos | **Fijos en el código**: Empanadas, Pizzas, Sanguches (de miga), Ciabattas, Coca-Cola, Pepsi | Cada grupo tiene reglas propias en el POS, así que no se pueden crear desde la UI. Desaparece Categorías (`devices`) |
| Presentaciones | **Fijas**: Empanadas y Sanguches 1, 3, 6 y 12 u · Pizzas de 1 o 2 sabores (siempre entera) · Ciabattas, unidad · Bebidas, unidad | Reemplazan a las del wireframe (porciones, "Combo + bebida"). El combo lo cubren las promos |
| Precio | Empanadas y Ciabattas: **un precio por presentación para todo el grupo**. Sanguches, Pizzas y bebidas: **por gusto** | "Aclaración de precios" del cliente en `specs.md` (reemplaza a la decisión inicial de precio por gusto para todos). Evita cargar 16 veces el mismo precio de empanada |
| Pizza de 2 sabores | Precio del sabor más caro | Regla textual del cliente |
| Surtidas | Dentro de la misma presentación, con "Agregar uno" (+1 de un gusto) y "Completar" (llena lo que falta) | AGREGADO de `specs.md`, para Empanadas y Sanguches |
| Precio de una surtida | Proporcional: Σ (unidades del gusto ÷ unidades de la presentación × precio de esa presentación del gusto), redondeado a 2 decimales | En Empanadas da siempre el precio del grupo; sólo cambia algo en Sanguches |
| Línea incompleta | No se puede cobrar: muestra "faltan N" y deshabilita Cobrar; el servidor la rechaza (`VALIDATION`) | Evita cobrar media docena con 2 empanadas |
| Stock | Por gusto. Pizza mitad y mitad descuenta ½ de cada gusto | El stock de pizzas admite medias |
| Costo de la mitad y mitad | ½ del costo de cada gusto | Ejemplo del dev: $2.000 + $1.500 = $3.500 de costo, $6.500 de ganancia |
| Ciabatta | Se elige 1 sabor por unidad | `specs.md` |
| Comprador | Nombre libre y opcional; vacío = "Sin nombre" | La venta deja de exigir un cliente de Clientes ("Mostrador"). Clientes sigue existiendo |
| Turno | Mañana o tarde según una hora de corte, en hora de Argentina | La hora la consulta el dev con el cliente (bloquea US-13, Sprint 2) |
| Ingresar stock | Cantidad + costo unitario (actualiza el costo del gusto) + proveedor opcional, con historial | El costo alimenta la ganancia en limpio |
| Mermas y descuentos | Se mantienen los dos; las mermas restan de la ganancia | No aparecen en `specs.md`, pero ya existen y el dev los conserva |
| Auditoría | **El vendedor no la tiene** | El dev corrige la lista de `specs.md`. Vendedor: Ventas/Pedidos, Stock, Clientes |
| Pedidos | "Ventas/Pedidos" es el nombre del botón de Ventas | No hay pedidos para más tarde |
| Ventas/Pedidos | Muestra el historial con toda la información de la grilla; **"Nuevo pedido"** abre el tablero y reemplaza a "Nueva Venta" | "Consideraciones del primer sprint" de `specs.md`, aclarado por el dev |
| Colores y emojis | Empanadas naranja 🥟, Pizzas amarillo suave 🍕, Ciabattas marrón claro 🥖, Sanguches verde suave 🥪, Coca-Cola rojo 🥤 y Pepsi azul 🥤 | En el tablero (US-15) y en el KPI de dinero por comida (US-12). Emojis Unicode |
| Base de producción | Ya hay una base real en Supabase | La conecta el dev con su clave; el agente no lee `.env.prod` (nota en T-13) |
| Gastos | Anotador aislado de facturas (número, título, monto) | No afecta Estadísticas (Sprint 2) |
| Tarjetas | Recargo % por plan de cuotas (1, 3, 6, 12) | Sprint 2 |
| Promos | Grupo + presentación + cantidad; los gustos se eligen al vender | Sprint 2 |
| ISR | Revalidación a demanda | El catálogo se regenera sólo cuando cambia algo que muestra |
| Datos de producción | Sólo demo | El modelo viejo se borra sin migrar datos; se conservan los usuarios |
| Marca | Empanadería Isabela, con `logo-empanaderia.jpeg` | Paleta del logo: negro, ámbar y crema |
| Gustos del local | Los de "gustos que disponen" de `specs.md` son el seed | Las bebidas no están en la lista: van de demo |
| Inicio del vendedor | Ventas/Pedidos | — |
| Push | Después de cada ítem integrado a `develop`; el merge a `main` espera el OK del dev | El CI verifica cada ítem |
| Sprints | Sprint 1: vender. Sprint 2: promos, tarjetas, estadísticas y gastos | — |

## Hallazgos del código

Del mapeo del código del 2026-10-25:

| Hallazgo | Dónde | Ítem |
|---|---|---|
| La venta guarda los precios, costos, totales y pagos que manda el navegador, sin recalcular. Sólo la UI controla que los pagos sumen el total | `sale.repository.ts:54-124`, `sale-payment-modal.tsx` | US-6 CA-2 |
| "Ingresar Stock" crea un producto nuevo (un lote); el producto no tiene nombre propio, se muestra el de `devices` | `products-panel.tsx:157-162`, `product-form-modal.tsx` | US-3, US-4 |
| No hay ningún `CHECK`: el stock puede quedar negativo | `schema.ts` | US-3 CA-1 |
| Estadísticas arranca con todo el historial y arma el día con la hora del servidor | `compute-dashboard-stats.ts:9-14`, `(main)/page.tsx:13-14` | US-12 (Sprint 2) |
| El vendedor puede invocar `fetchDashboardStats` | `stats.actions.ts` | BUG-12 |
| El único ISR es `export const revalidate = 30` en `/home` | `src/app/home/page.tsx:6` | T-11 |
| "ArgenStock" en 5 archivos; textos de Apple en el catálogo; contacto del cliente anterior | ver US-1 | US-1, T-12 |
| El acento de la UI es `indigo-*` escrito a mano (unas 119 líneas en 45 archivos) | `src/**` | US-1 |
| El sidebar mide 320 px (`xl:w-80`) y vive dentro de `(main)/layout.tsx` | `(main)/layout.tsx:128-137` | US-2 |

Casi todo lo que se toca está en `eslint-legacy.json` (`schema.ts`, `sale/*`, `product/*`, paneles, `proxy.ts`). **No
se copia como patrón**: el código nuevo sigue el molde de `provider` (`docs/features/provider/README.md`).

## Estrategia de transición

```
US-3 catálogo nuevo ─▶ US-4 stock nuevo ─▶ US-5/US-6/US-7 POS nuevo ─▶ T-12 borra el modelo viejo
   (tablas nuevas, en paralelo)    (retira /productos viejo)  (retira el POS viejo)   (devices, products, sale_items…)
```

- El modelo nuevo vive en **tablas nuevas**, en paralelo al heredado. Así cada merge a `develop` queda verde y cada
  ítem se revisa por separado.
- Cada pantalla vieja se retira en el ítem que la reemplaza, junto con su E2E.
- **Hasta T-12, `develop` está en transición.** Por ejemplo, las estadísticas viejas no ven las ventas nuevas hasta
  T-12 CA-3. `main` recibe todo junto en T-13.
- Producción sólo tiene datos de demo: T-12 borra el modelo viejo sin migrar datos.
- Los nombres de tablas, features y rutas de abajo son **propuestas**: se confirman en el plan de cada ítem.

## Orden de ejecución

| # | Ítem | Depende de | Rama |
|---|---|---|---|
| 0 | T-10 Backlog de los Sprints 1 y 2 | — | `docs/t-10-backlog-sprints-1-y-2` |
| 1 | BUG-12 Estadísticas sólo para el admin | T-4 | `fix/bug-12-estadisticas-solo-admin` |
| 2 | BUG-10 Scripts destructivos fuera de BUG-3 | BUG-3 | `fix/bug-10-scripts-destructivos` |
| 3 | T-11 Catálogo con revalidación a demanda | — | `feat/t-11-catalogo-a-demanda` |
| 4 | US-1 Marca Empanadería Isabela | — | `feat/us-1-marca-isabela` |
| 5 | US-2 Menú por rol y sidebar más angosto | — | `feat/us-2-menu-por-rol` |
| 6 | US-3 Alta de productos | US-2 | `feat/us-3-alta-de-productos` |
| 7 | US-4 Stock | US-3 | `feat/us-4-stock` |
| 8 | US-5 Tablero de ventas y pedido actual | US-4 | `feat/us-5-tablero-de-ventas` |
| 9 | US-6 Cobrar con 4 medios de pago | US-5 | `feat/us-6-cobrar-pedido` |
| 10 | US-7 Historial, comprobante y anulación | US-6 | `feat/us-7-historial-de-ventas` |
| 11 | US-15 Colores y emojis de cada grupo | US-5 | `feat/us-15-colores-y-emojis` |
| 12 | T-12 Retirar el modelo heredado | US-7, T-11 | `feat/t-12-retirar-modelo-heredado` |
| 13 | T-13 Cierre del Sprint 1 | todos | `docs/t-13-cierre-sprint-1` |

**Ciclo de cada ítem**, igual que en el Sprint 0:

1. `start-task`: plan del ítem con el OK del dev, y `BACKLOG.md` en `En progreso`.
2. Rama, TDD y `finish-task` con evidencia.
3. Lista simple de lo que entra.
4. Con el OK del dev: merge squash a `develop`, push y borrado de la rama.
5. El ítem pasa a `En revisión`, y el dev lo pasa a `Hecho`.

Los criterios y estimaciones de cada ítem están en [`BACKLOG.md`](../../BACKLOG.md). Acá va el **enfoque**.

---

## 1 · BUG-12 Estadísticas sólo para el admin (S, 25 min)

- `fetchDashboardStats` pasa a `verifyAuthOrAdmin(true)` y devuelve `ActionResult` con `toActionFailure`.
- Test de contrato `regression BUG-12` con `asUser({ role: 'vendedor' })` → `FORBIDDEN`.
- Se actualiza la tabla de roles de `docs/features/stats/README.md`.

## 2 · BUG-10 Scripts destructivos (S, 40 min)

- Sin cambios respecto de lo cargado. Va antes de los seeds nuevos de US-3 y T-12.
- La pregunta abierta (`db:seed-users` contra producción) sigue siendo del dev.

## 3 · T-11 Catálogo con revalidación a demanda (S, 1 h 5 min)

- **Hoy**:
  - `src/app/home/page.tsx:6` exporta `revalidate = 30`.
  - `fetchLandingProducts` (`product.actions.ts:181`) y `fetchLandingCategories` (`device.actions.ts:127`) leen sin
    sesión.
  - `/product/[id]` es dinámica: no tiene `revalidate` ni `generateStaticParams`. Se confirma con `next build`.
- **Enfoque**:
  - Las lecturas del catálogo se cachean con una etiqueta (por ejemplo, `catalog`) y sin vida por tiempo.
  - Un helper único, `revalidateCatalog()`, invalida la etiqueta.
  - El mecanismo se decide con la skill `next-cache-components`: `unstable_cache` + `revalidateTag`, o `'use cache'`
    + `cacheTag` + `updateTag`. Activar `cacheComponents` es un cambio más grande y necesita un ADR propio.
- **Quién invalida**: crear, editar y borrar un producto, la visibilidad en el catálogo, las fotos, y la venta y la
  anulación (si el catálogo muestra stock; se verifica).
- **E2E**: `tests/landing.spec.ts` espera hoy los 30 s del ISR (T-6). Pasa a esperar el cambio inmediato.
- **Docs**: `architecture.md` (Vista general y Catálogo público), `tests/readme.md` y el ADR "Revalidación a demanda
  del catálogo".
- **Producción**: el arreglo llega en T-13. Si el gasto de Vercel apura, el dev puede pedir un `hotfix/` desde
  `main` (`docs/git.md`).

## 4 · US-1 Marca Empanadería Isabela (M, 1 h 50 min)

- **Logo**: a partir de `docs/wireframes-ventas-gestor/logo-empanaderia.jpeg` (1600 × 1600).
  - El ícono de la app va en `src/app/icon.png` (convención de Next) y reemplaza a `icon.svg`.
  - Para el sidebar, el login y el comprobante va una versión liviana en `public/`.
  - Un componente `BrandLogo` reutilizable lleva el nombre y el logo.
- **Metadata**: `src/app/layout.tsx:11-21`, hoy con "ArgenStock" y "Manage technology store stock effectively";
  `src/app/home/page.tsx:8-24`, con keywords y OpenGraph de Apple.
- **Paleta**:
  - Tokens en `globals.css`, en `@theme`: `brand` (ámbar del logo), `ink` (negro) y `cream`, con variantes para
    claro y oscuro.
  - Hoy `--background` y `--foreground` se usan sin estar definidas.
  - El `indigo-*` se reemplaza en el shell (`(main)/layout.tsx`, login, `src/components/ui/`) y en las pantallas
    que siguen (Clientes, Proveedores, Usuarios, Auditoría, Estadísticas).
  - No se toca en las pantallas que retira T-12 (POS viejo, Productos y Categorías): se borran igual.
  - Contraste: axe sobre el login y el panel, en claro y en oscuro.
- **Textos**:
  - "ArgenStock" en `app/layout.tsx`, `(main)/layout.tsx:62,66`, `home/page.tsx:9,39,53`,
    `lib/contact/message-generator.ts:12` y `sales-print-view.tsx:46`.
  - Apple, accesorios y garantía en `product/[id]/page.tsx:20`, `home/components/product-card.tsx:17,144`,
    `product/components/product-info.tsx:44,60-66` y `catalog-grid.tsx:25`.
  - El fondo `bg-[#F5F5F7]` del catálogo.
- **Contacto**: `src/lib/contact/contact.config.ts` tiene el WhatsApp y el Instagram del cliente anterior. Se
  quitan, y los botones no se muestran hasta tener los datos reales (pregunta para el cliente).
- **Riesgo**: el repo es público, así que el logo y el nombre quedan publicados.

## 5 · US-2 Menú por rol y sidebar más angosto (S, 1 h 15 min)

- **Una sola lista** en `src/config/navigation.ts`, con `{ href, label, icon, roles }`:
  - la usan el sidebar y `proxy.ts`, que hoy repite las rutas en `allowedVendedorPaths`;
  - test unit del orden por rol y de que `proxy.ts` deja pasar exactamente las rutas del menú del vendedor.
- **Sidebar**:
  - Se extrae de `(main)/layout.tsx` (legacy, hoy con el sidebar inline en L55-108) a un componente propio.
  - Escritorio: `xl:w-80` → `xl:w-60` (240 px). El drawer mobile pasa de 320 a 240 px.
  - Se corrige el selector viejo de impresión de `globals.css:90` (`.lg\:w-80`).
- **Redirecciones**:
  - Al loguearse, el admin va a `/` (Estadísticas) y el vendedor a `/ventas`. Hoy va a `/productos`
    (`proxy.ts:38-51` y `(main)/layout.tsx:41-45`).
  - Que el vendedor aterrice en `/ventas` es una propuesta y se confirma en `start-task`.
- **Nombres**: "Dashboard" → "Estadísticas" (menú y título); "Ventas" → "Ventas/Pedidos". Las secciones que todavía
  no existen las suma su ítem.
- **E2E**: `tests/auth.setup.ts:4` (pantallas por rol) y los Page Objects que navegan por el menú.

## 6 · US-3 Alta de productos (L, 4 h)

- **Feature nuevo** (propuesta: `src/features/menu/`), copiando `provider`: `domain`, `repository` con fake,
  `services`, una action por operación, `ui` y `testing`.
- **Schema** (propuesta):
  - Enum `menu_group`: `empanadas`, `pizzas`, `sanguches`, `ciabattas`, `coca_cola`, `pepsi`.
  - Tabla `menu_items` con `id`, `group`, `name varchar(60)`, `unit_cost numeric(10,2)`, `stock`, `is_active`,
    `version` y timestamps.
  - **Precios por gusto como columnas** `price_1`, `price_3`, `price_6` y `price_12`, nulos en Empanadas y Ciabattas.
    Un `CHECK` por grupo garantiza que Sanguches tenga las cuatro, Pizzas y bebidas sólo `price_1`, y los grupos de
    precio único ninguna. En Pizzas, `price_1` es la pizza entera.
  - **Precios del grupo** en otra tabla (propuesta: `menu_group_prices`, una fila por grupo con `version`), sólo para
    Empanadas (1, 3, 6 y 12 u) y Ciabattas (unidad). Sin fila, el grupo no se puede vender.
  - `unique(group, name)`, `CHECK price_* > 0`, `CHECK unit_cost >= 0` y `CHECK stock >= 0`.
  - **Stock con medias**: `numeric(10,1)` con un `CHECK` de que sólo Pizzas admite decimales, o un entero en medias
    unidades. Se decide en el plan, con un test de tipos.
- **Reglas en el dominio**: una constante con los grupos y sus presentaciones (etiqueta, unidades y columna de
  precio). La usan Alta, Stock y el POS, en el cliente y en el servidor.
- **Errores**: `VALIDATION`, `DUPLICATE`, `STALE_VERSION`, `HAS_RELATIONS`, `FORBIDDEN` y `UNAUTHENTICATED`, todos ya
  en el catálogo.
- **Ruta y menú**: `/alta-de-productos`, sólo para el admin, en el menú de US-2 y en `proxy.ts`.
- **Seed** (`db:seed` y el seed del E2E), con los gustos de `specs.md`:
  - Empanadas (15): Carne suave, Carne, Carne picante, Carne cheddar, Pollo, Pollo a mostaza, Bondiola mostaza y
    miel, Bondiola barbacoa, Jamón y muzza, Capresse, Muzza y cebolla, Muzza y pepperoni, Muzza, cebolla y
    roquefort, Verdura y Humita.
  - Pizzas (6): Muzza, Muzza y jamón, Napolitana, Napolitana con jamón, Pepperoni y Roquefort.
  - Sanguches de miga: Primavera y Jamón y queso. Ciabattas: Carne, Capresse, Bondiola y Pollo.
  - Bebidas de demo: Coca-Cola, Sprite y Fanta; Pepsi, 7up y Mirinda.
  - Los precios y costos son de demo.
- **ADR**: "Grupos y presentaciones fijos en el código; precio por gusto y presentación".
- **Mutación**: Stryker suma el `domain` y los `services` del feature nuevo (`stryker.config.mjs`).

## 7 · US-4 Stock (L, 3 h 30 min)

- **Grilla** `/stock`: gustos y bebidas activos por grupo, con stock y precio de venta. Costo y proveedor sólo para
  el admin (hoy lo resuelven `product-columns.tsx:46-63`).
- **Ingresar stock**:
  - Tabla de sólo inserción (propuesta: `stock_entries`) con `menu_item_id`, `quantity`, `unit_cost`,
    `provider_id` (nullable), `user_id` y `created_at`.
  - Actualiza `menu_items.stock` y `unit_cost`.
  - **Sin `sql` plano** (regla dura): la suma atómica se hace en una transacción con `SELECT … FOR UPDATE`
    (`.for('update')` de Drizzle), el valor se calcula en el service y se hace un `UPDATE` por `id`.
  - El test de integración corre un ingreso y una venta simultáneos sobre el mismo gusto. El código heredado usa
    `sql\`stock - q\``: no se copia.
- **Mermas**:
  - Tabla nueva o `product_losses` apuntando a `menu_items` (se decide en el plan).
  - Guarda el **costo unitario del momento**. Hoy la merma se valúa con el precio de compra actual, sin congelar.
- **Error nuevo** en el catálogo: `INSUFFICIENT_STOCK` ("No hay stock suficiente de <gusto>…"). Lo reutilizan US-6 y
  US-9.
- **Retiro**: el panel viejo de `/productos` (`products-panel.tsx`, `product-form-modal.tsx`, `product-columns.tsx`
  y `product-card.tsx`) y `tests/productos.spec.ts`. Las fotos y la visibilidad en el catálogo las mueve T-12.
- **Pregunta abierta** (cliente, junto con BUG-8): ¿el vendedor ingresa stock y ve costos? Mientras tanto se
  mantiene lo de hoy.

## 8 · US-5 Tablero de ventas y pedido actual (L, 4 h 25 min)

- **Wireframes**: `venta_vista_general.png` (tablero + "Pedido actual") y
  `venta_vista_panel_desplegable_gustos.png` (desplegable de gustos con precio).
  - Se reemplazan las presentaciones del wireframe por las decididas.
  - No entra "Combo + bebida".
- **Dominio** (funciones puras, compartidas con el servidor en US-6):
  - `addOne` y `complete` sobre una línea abierta: +1 de un gusto o lo que falta, sin superar la presentación.
  - `linePrice(line, prices)`: el precio del grupo (Empanadas, Ciabattas), el proporcional por gusto (Sanguches), el
    del gusto (bebidas) o el más caro de los dos sabores (Pizzas). `lineUsage(line)`: lo que consume de cada gusto
    (mitad y mitad: ½ y ½). `isComplete(line)`.
  - `orderTotal(lines)`.
  - `availableStock(item, lines)`: stock menos lo que ya está en el pedido.
  - Unit con valores frontera y fuzz con fast-check: la suma de unidades nunca supera la presentación, el
    proporcional con precios iguales da el precio del pack, la mitad y mitad cobra el máximo y las unidades nunca
    superan el stock.
- **Estado del pedido**: store de Zustand del feature (líneas y comprador), con tests.
- **UI**:
  - Una `GroupBoard` por grupo, con ícono de lucide, "N en pedido" y botones de presentación.
  - `FlavorPicker`: desplegable de gustos con su precio y deshabilitado sin stock. Para "2 sabores", elige dos.
  - `CurrentOrderTable`.
  - Componentes chicos (tope de 100 líneas) y tests de componente.
- **Fuera de alcance**: cobrar (US-6) y la subdivisión Promos (US-9).
- **Decidido** (2026-10-25): surtidas con "Agregar uno" y "Completar", proporcional, línea incompleta bloquea Cobrar,
  costo de la mitad y mitad = ½ + ½.
- **Si queda grande**, se parte en dos: empanadas y sanguches; pizzas, ciabattas y bebidas.

## 9 · US-6 Cobrar con 4 medios de pago (L, 3 h 50 min)

- **Schema** (propuesta):
  - `sales` suma `buyer_name varchar(60)` (nullable).
  - Tablas nuevas para las líneas (lo cobrado) y para lo que consume cada línea por gusto (unidades y costo
    congelado), en paralelo a `sale_items`, que borra T-12.
  - `payment_type` suma `debito` y `credito` (`ALTER TYPE … ADD VALUE`).
  - Hoy `sales.customer_id` es nullable; la venta nueva no lo usa.
- **Service**:
  - Recibe sólo `{ group, presentation, flavorIds }` por línea, el comprador, los descuentos y los pagos.
  - Lee los gustos con `FOR UPDATE`, ordenados por `id` para evitar deadlocks.
  - Arma las líneas con las mismas funciones de dominio de US-5, verifica stock (`INSUFFICIENT_STOCK`) y que los
    pagos sumen el total (`VALIDATION`), y descuenta.
  - Todo, con la auditoría, en una transacción.
- **Contrato**: un precio, costo o total adulterado desde el navegador no cambia lo que se guarda. Hoy sí lo cambia
  (`sale.repository.ts:54-124`).
- **Pagos**: se conserva la regla actual de hasta 2 pagos con medios distintos (`sale.schema.ts:65-68`), ahora
  validada también en el servidor.
- **Descuentos**: se mantienen el porcentaje y el monto sobre el total (`sales-panel.tsx:148-151`), recalculados en
  el servidor.
- **UI**: el modal de pago con 4 botones, y el texto `btnTranserencia` de `test-ids.ts` se corrige.
- **E2E** del flujo crítico, sobre `db-test`: armar el pedido, cobrar y ver el stock descontado en `/stock`.

## 10 · US-7 Historial, comprobante y anulación (M, 2 h 30 min)

- **Historial**: reemplaza `sales-list-view.tsx` y la tabla y tarjetas de ventas, con fechas en
  `America/Argentina/Buenos_Aires` (`formatDateTime`).
- **Comprobante**: reemplaza `sales-print-view.tsx`, con la marca de US-1 y las líneas nuevas.
- **Anulación**: se conserva el enfoque actual (`SELECT … FOR UPDATE`, reposición y borrado de la venta) sobre las
  tablas nuevas. La reposición de una mitad y mitad devuelve ½ de cada gusto. Una segunda anulación da `NOT_FOUND`.
- **Retiro**: el POS viejo (`sales-pos-view.tsx`, `useCart.ts`, los modales viejos) y los E2E de ventas viejos.
- **Nuevo pedido**: reemplaza a "Nueva Venta" y al link provisorio "Tablero de ventas", y abre `/ventas/nueva`.

## 11 · US-15 Colores y emojis de cada grupo (S, 1 h)

- Un color y un emoji por grupo en `menu-groups` (o un config de UI), usados por `GroupCard` y después por el KPI
  de dinero por comida (US-12).
- Tonos suaves para modo claro y oscuro, con el test de contraste WCAG de US-1 extendido a esos colores.
- Los emojis Unicode reemplazan a los íconos de `lucide-react` en el tablero.

## 12 · T-12 Retirar el modelo heredado (L, 3 h 30 min)

- **Migración**: borra `devices`, el `products` viejo y `sale_items`. `product_images` (y las mermas, si US-4 no las
  movió) pasan a apuntar a `menu_items`.
- **Código que se borra**:
  - `src/features/device/*` y `src/app/(main)/categorias/*`.
  - Lo que quede de `src/features/product/*` y de `sale` viejo.
  - `config/tables` y `config/cards` de productos y categorías.
  - `tests/pages/EquiposPage.ts`.
  - Los scripts `seed-stress-test.ts` y `backfill-sale-item-cost.ts` se rehacen o se borran.
  - Cada archivo borrado sale de `eslint-legacy.json`.
- **Fotos y catálogo**:
  - El gestor de fotos y "visible en el catálogo" pasan a Alta de productos.
  - `/home` y `/product/[id]` leen `menu_items` (los grupos fijos reemplazan a `fetchLandingCategories`).
  - Las mutaciones de Alta y Stock llaman a `revalidateCatalog()` (T-11).
- **Estadísticas**: el repositorio de `stats` lee las tablas nuevas. Mismos totales sobre `seed-dashboard`.
  `totalEquipos` pasa a un nombre del rubro.
- **Auditoría**: `DEVICE: 'EQUIPO'` (`audit-columns.tsx:77`, `audit-card.tsx:15`, `log-panel.tsx:22`) y el renderer
  de detalle.
- **Guarda**: un test unit recorre `src/` y falla si encuentra "ArgenStock", "iPhone", "Apple", "accesorio",
  "celular" o "equipo" como texto. Excepción: el font stack `'Apple Color Emoji'` de `globals.css`.

## 13 · T-13 Cierre del Sprint 1 (S, 1 h)

- `README.md` (módulos y rutas nuevas), `architecture.md` (Vista general, Datos, Concurrencia: el stock sin `sql`) e
  `initial_prompt.md` (foto al día, §3 sin "temas no definidos" ya resueltos).
- `npm run verify` en verde y, con el OK del dev, merge local `develop → main` ("chore(release): sprint 1"), tag
  `sprint-1` y push.

---

## Trazabilidad: `specs.md` → ítems

| Línea de `specs.md` | Pedido | Ítem |
|---|---|---|
| 7 | Sólo el gestor de stock; el sitio web no interesa por ahora | Alcance: el catálogo sólo se adapta (T-11, T-12) |
| 9-10 | Ventas con la forma del dashboard: un "pizarrón" por comida | US-5 CA-1 |
| 12-20 | Empanadas, Pizzas, Sanguches, Ciabatta, Coca-Cola y Pepsi | US-3, US-5 |
| 22 | Subdivisión de promos en Ventas | US-9 (Sprint 2) |
| 24 | Un botón por cantidad; sidebar más chico | US-5, US-2 CA-3 |
| 26-27 | Regla de empanadas y AGREGADO ("Agregar uno" / "Completar") | US-5 CA-2 y CA-5 |
| 29 | Pizza de 1 o 2 sabores, precio del más caro | US-5 CA-3, US-6 CA-3 |
| 31-32 | Sándwich de 1, 3, 6 o 12, misma regla y AGREGADO | US-5 CA-2 y CA-5 |
| 34 | Ciabatta: 1 sabor por unidad | US-5 CA-4 |
| 36 | Coca-Cola y Pepsi por unidad, con la lista de bebidas en stock | US-5 CA-4 |
| 38-42 | Efectivo, Transferencia, Débito y Crédito | US-6 CA-1; tarjeta y cuotas en US-11 |
| 46-47 | Stock con grilla, "Ingresar stock" y bebidas | US-3, US-4 |
| 49-55 | KPI de dinero por comida, ganancia en limpio y ventas registradas | US-12 (Sprint 2) |
| 57-69 | Cuadros de vendedores (turno) y de ventas (comprador) | US-13 (Sprint 2) |
| 71 | Estadísticas del día por defecto | US-12 CA-1 |
| 73-78 | Botones del vendedor | US-2 (sin Auditoría, por decisión del dev) |
| 80-91 | Botones del admin | US-2 + la entrada de menú de cada ítem |
| 93-99 | Promociones | US-8 (Sprint 2) |
| 103 | Consultar por los botones nuevos | Decisiones del dev: Gastos, Pedidos, Tarjetas |
| 105 | App tematizada, sin placeholders ni tecnología | US-1, T-12 CA-5 |
| 107 | Quitar el `revalidate = 30` | T-11 |
| 109 | Tarjetas con 1, 3, 6 o 12 cuotas | US-10, US-11 (Sprint 2) |
| 111-126 | Gustos que disponen | US-3 CA-6 (seed) |
| 128-135 | Aclaración de precios: empanadas y ciabattas iguales; sanguches y pizzas por gusto | US-3 CA-1, CA-2 y CA-7; US-5 CA-2 |
| 139-141 | "Nueva Venta" se va: Ventas/Pedidos es el historial y "Nuevo pedido" abre el tablero | US-7 CA-1 |
| 143 | Base real en Supabase | T-13 (nota: la conecta el dev) |
| 145-161 | Colores y emojis de cada grupo, en Ventas y en el KPI de dinero por comida | US-15; US-12 CA-2 (Sprint 2) |

## Preguntas para el cliente

Para llevarlas en una sola charla. Las respuestas pasan al ítem en `BACKLOG.md` y la pregunta se borra de acá.

| # | Pregunta | Ítems | ¿Bloquea? | Mientras tanto |
|---|---|---|---|---|
| 1 | ¿A qué hora termina el turno mañana y empieza el turno tarde? | US-13 | **Sí** | — |
| 2 | ¿El vendedor puede ingresar stock? ¿Ve costos y proveedores? | US-4, BUG-8 | No | Ingresa stock y no ve costos ni proveedores (como hoy) |
| 3 | ¿Cuáles son el WhatsApp y el Instagram del local? | US-1 | No | El catálogo no muestra botones de contacto |
| 4 | Promos: ¿qué precio de referencia se muestra para un componente cuyo gusto se elige al vender? ¿Tienen vigencia? | US-8 | No | Rango mín.–máx.; sin vigencia |
| 5 | ¿Cómo se reparte el precio de una promo en los KPI por comida? | US-12 | No | En proporción a los precios de lista |
| 6 | ¿El recargo de las cuotas cuenta como ingreso y ganancia? ¿El débito pide tarjeta? | US-11, US-12 | No | Se decide al tomar US-11 |
| 7 | Gastos: ¿se adjunta foto de la factura? ¿El número es único? ¿Hace falta la fecha de la factura? | US-14 | No | Sin foto, número no único, sólo fecha de carga |
| 8 | ¿Se conservan los KPI de hoy que no nombró (efectivo y transferencia, valor del stock, mermas)? | US-12 | No | Quedan debajo de los nuevos |

## Para confirmar con el dev en `start-task`

- **US-8**: "una vez agregada, va seleccionada" significa que la promo queda activa en Ventas.

## Riesgos

- **`develop` en transición**: hasta T-12 conviven el modelo viejo y el nuevo, y las estadísticas viejas no cuentan
  las ventas nuevas. No se mergea a `main` antes de T-13.
- **US-3, US-5 y US-6 son grandes.** Si en `start-task` superan una sesión, se parten en ítems más chicos antes de
  empezar.
- **La regla "sin `sql`"** obliga a resolver los movimientos de stock con `SELECT … FOR UPDATE` y el valor
  calculado. Necesita un test de integración de concurrencia en US-4 y en US-6.
- **El repo es público**: el nombre y el logo del cliente quedan publicados (T-10 y US-1).
- **El fix del ISR** llega a producción en T-13, salvo un hotfix.

## Verificación del sprint

- **Por ítem**: la salida de `npm run test`, `test:int`, `typecheck` y `lint` (y `test:e2e` y `test:mutation` cuando
  apliquen), pegada en el cierre.
- **Al final**:
  - `npm run verify` y el CI en verde sobre `develop` y `main`;
  - un commit por ítem en `develop`;
  - el test de T-12 sin restos de la casa de celulares;
  - cada línea de la trazabilidad de arriba está cubierta por un ítem en `Hecho` o en el Sprint 2.
