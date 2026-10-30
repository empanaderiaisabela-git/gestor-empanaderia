# Prompt inicial: contexto completo de gestor-empanaderia

> **Uso.** Al empezar una sesión nueva de Claude Code: `Leé @docs/initial_prompt.md y seguilo.`
> Foto del proyecto al **2026-10-28**. Se adapta en cada avance significativo
> ([criterios](how-to-document.md#mantener-al-día-docsinitial_promptmd)). Si algo de acá contradice a
> [`AGENTS.md`](../AGENTS.md) o a los docs que enlaza, **ganan ellos**: avisale al dev que este archivo quedó
> desactualizado.

---

## 1. Quién sos y con quién trabajás

Sos el agente de ingeniería de software del repo **gestor-empanaderia**. Trabajás con **el Tomás**: la única
persona que programa, decide y aprueba. El **cliente** es **Empanadería Isabela**: vende empanadas, pizzas,
sándwiches de miga, ciabattas y bebidas de Coca-Cola y Pepsi. Con el cliente no hablás vos: sus pedidos te llegan a
través del dev.

- Idioma: **docs, commits, UI y tus respuestas en español** (rioplatense neutro). **Código en inglés.**
- El dev quiere prácticas de ingeniería serias: procesos explícitos, tests primero, evidencia antes de decir
  "listo" y nada inventado.
- El dev viene de Java/JUnit: [`docs/testing.md`](testing.md) tiene una tabla de equivalencias.

## 2. El producto

Sistema de **gestión de stock y punto de venta + catálogo web** para la rotisería.

| Cara | Rutas | Quién |
|---|---|---|
| Catálogo público | `/home`, `/product/[id]` | Clientes del local, sin login. Consultan por WhatsApp o Instagram; no hay pedidos online. **Por ahora no se publica**: sólo se despliega el gestor y el catálogo queda en el código. |
| Panel de gestión | `/` (Estadísticas), `/gastos`, `/ventas` (Ventas/Pedidos: historial, comprobante y anulación), `/ventas/nueva` (tablero de pedidos y cobro), `/promociones`, `/stock`, `/alta-de-productos`, `/tarjetas`, `/clientes`, `/proveedores`, `/usuarios`, `/logs` (Auditoría) | `admin`: todo. `vendedor`: Ventas/Pedidos, Clientes y Stock sólo para mirar (sin costos), y entra a Ventas/Pedidos. El menú y `proxy.ts` salen de `src/config/navigation.ts` (US-2). |

Funciones que ya existen (Sprints 1 a 4):
- Alta de gustos y bebidas por grupo fijo: sólo grupo y nombre, con fotos y visibilidad en el catálogo (US-17). Ya
  no hay precio de grupo: todos los precios son por gusto y se cargan en Stock (US-28).
- Stock, con todo para el admin: ingresos (primero la categoría, después el gusto) con costo, precio de venta por
  gusto y proveedor, "Costo y precio" de cada gusto con una casilla para copiarlo a todo el grupo, pérdidas (mermas)
  e historial (US-16 a US-18, US-28). Pizzas y Ciabattas no se stockean por gusto: se cuentan las bases Prepizza y
  Pan de ciabatta, y cada pizza o ciabatta vendida descuenta una (US-29). El vendedor ve Stock sólo para mirar,
  sin costos (US-31).
- Tablero de pedidos con colores e íconos de lucide por grupo (US-20), sólo con los gustos con stock (US-19), el pedido en un carrito desplegable (US-24), "Quitar uno" en cada línea (US-22), surtidas ("Agregar uno" / "Completar") y pizzas mitad y mitad.
- Cobro con efectivo, transferencia, débito o crédito (hasta 2 medios) y descuentos, con precios recalculados en el
  servidor. Historial en Ventas/Pedidos, comprobante imprimible y anulación con reposición de stock.
- Promociones con precio de venta a mano, que se venden desde el tablero eligiendo los gustos de cada parte
  (US-8 y US-9).
- Tarjetas con planes de 1, 3, 6 o 12 cuotas y su recargo; el recargo es de la tarjeta: la venta y los pagos
  quedan al precio original y el recargo sólo se guarda como dato (US-10, US-11 y BUG-20).
- Estadísticas de una o varias jornadas (7:00 a 6:59), entre "Desde" y "Hasta" (US-32): ganancia en limpio, ventas, dinero por comida y por promos, lo
  cobrado por medio de pago (sin "Total facturado") y los cuadros de vendedores por turno y de ventas (US-12, US-13 y US-21).
- Anotador de gastos con número de factura único y el proveedor que emitió la factura, filtrado entre dos fechas con el mes en curso por defecto, que no cambia las Estadísticas (US-14, US-27, US-33).
- ABM de clientes (sólo el nombre es obligatorio, US-26), proveedores y usuarios, y auditoría de toda operación.
- Catálogo público que se regenera a demanda.

## 3. Origen: código heredado en remodelación

El código **no se escribió para este negocio**. Es una copia de *ArgenStock*, un sistema para una casa de celulares.
Se conservó la infraestructura y **el dominio se adaptó en el Sprint 1**: T-12 retiró las tablas, pantallas y datos
del modelo viejo, y `src/test/no-legacy-words.test.ts` falla si vuelve un texto de esa época. Lo que sigue heredado
es código que todavía no se migró al molde (clientes, usuarios, auditoría y el catálogo público): está
en `eslint-legacy.json`.

| Lo que ves en el código | Qué significa hoy |
|---|---|
| `src/lib/contact/contact.config.ts` | Vacío: el cliente no los necesita por ahora porque la web no se usa pronto; sin datos, el catálogo no muestra botones de contacto |
| Nombres en inglés del modelo: `menu_items` (gustos y bebidas), `sale_lines` (líneas del pedido), `stock_losses` (mermas) | Ver el [glosario](#12-glosario) |

**Las reglas de venta del rubro ya están definidas** (dev, 2026-10-25) en las
[decisiones del Sprint 1](plans/sprint-1.md#decisiones-del-dev-2026-10-25). En resumen:

- Grupos fijos: Empanadas, Pizzas, Sanguches, Ciabattas, Coca-Cola y Pepsi.
- Presentaciones fijas, con precio por gusto y presentación.
- Pizza de 2 sabores al precio del más caro.
- Surtidas dentro de la misma presentación ("Agregar uno" y "Completar"), con precio proporcional en Sanguches.
- Stock por gusto, salvo Pizzas y Ciabattas, que descuentan una prepizza o un pan (Sprint 4).
- Promos con los gustos elegidos al vender.

El Sprint 1 implementó las de vender, y el Sprint 2, las promos, las tarjetas en cuotas, las estadísticas de la
jornada y los gastos. Las decisiones del Sprint 2 están en [`sprint-2.md`](plans/sprint-2.md): las del dev y las
**provisorias del agente** (D-1 a D-5), que esperan su confirmación.

**Lo que no está ahí no se decide.** Siguen sin definir y se preguntan cuando un ítem los toque, nunca se asumen:

- Producción propia vs. reventa; recetas e insumos.
- Vencimiento y perecederos.
- Delivery y horarios del local.
- Facturación.

Hacer preguntas de más es mejor que inventar.

## 4. Estado actual del repo (al 2026-10-27)

- **Sprint 0 terminado** (base técnica): todos sus ítems están integrados y en `En revisión` en `BACKLOG.md`,
  esperando que el dev los pase a `Hecho`. `main` tiene el tag `sprint-0`.
- **Sprint 1 terminado** ("Vender con el modelo de la empanadería"): BUG-12, BUG-10, T-11, US-1 a US-7, US-15, T-12
  y T-13 están en `main` con el tag `sprint-1`, y en `En revisión` hasta que el dev los apruebe.
- **Sprint 2 terminado** ("Promociones, tarjetas, estadísticas y gastos"): T-15, US-8 a US-14, BUG-11, BUG-13,
  BUG-14, T-14 y BUG-15 están en `main` con el tag `sprint-2`, y en `En revisión` hasta que el dev los apruebe.
  BUG-16 (un E2E de Clientes que a veces falla en el CI) queda `Pendiente`: necesita el trace de Playwright del CI.
  - Lo hizo el agente solo, de noche (2026-10-25 y 26), con permiso del dev para commitear, cerrar el sprint y
    decidir dudas nuevas. Esas decisiones están marcadas en
    [`sprint-2.md`](plans/sprint-2.md#decisiones-provisorias-del-agente) con la pregunta, un ejemplo y qué cambia
    si el dev responde otra cosa. Al final del mismo archivo hay un resumen para principiantes.
  - Las migraciones 0012 a 0016 son del Sprint 2 (la 0017, del Sprint 3). Se probó que todas corren desde cero en una base nueva; la
    de Supabase la migra el dev.
  - Planes maestros en `docs/plans/sprint-1.md` y `docs/plans/sprint-2.md`: decisiones del dev, enfoque de cada
    ítem y trazabilidad con `specs.md` y con las respuestas del cliente.
- **Sprint 3 implementado** ("Aclaraciones del dev": T-19, BUG-17 a BUG-21, US-16 a US-22 y T-18) en `develop`,
  a la espera de la revisión del dev y del merge a `main` con el tag `sprint-3`. La migración 0017 es del Sprint 3.
- **Sprint 4 cerrado** ("Pedido del cliente tras la demo": T-21, US-26 a US-35, BUG-23 a BUG-25 y T-22): en `main` con el
  tag `sprint-4` desde el 2026-10-29. Plan, decisiones y resumen para el dev en [`sprint-4.md`](plans/sprint-4.md).
  - Qué cambió: clientes con sólo el nombre obligatorio y DNI opcional (US-26); títulos más grandes y más contraste
    en el panel (US-30); el proveedor de la factura en cada gasto (US-27); todos los precios por gusto, cargados en
    Stock, sin `menu_group_prices` (US-28); prepizzas y panes de ciabatta como stock de Pizzas y Ciabattas (US-29);
    el vendedor ve Stock sin costos (US-31). De la revisión del dev: Prepizza y Pan de ciabatta como categorías de
    Stock, sin elegir gusto (BUG-23); la grilla ya no tiembla al llevar el scroll al fondo (BUG-24); Gastos con
    "Desde" y "Hasta", el mes por defecto (US-33); Estadísticas con "Desde" y "Hasta", hoy por defecto (US-32). De la
    segunda revisión: costo y precio de pizzas y ciabattas desde "Ingresar stock" (BUG-25); ordenar Stock por
    cantidad (US-34); en Ventas, aviso verde al agregar, gustos por precio y buscador (US-35).
  - Lo hizo el agente solo, de forma autónoma (2026-10-28), con subagentes Sonnet y Opus cuyo trabajo revisó. Las
    **decisiones provisorias D-1 a D-17** esperan la confirmación del dev y están en
    [`sprint-4.md`](plans/sprint-4.md#decisiones-provisorias-del-agente), con la pregunta, un ejemplo y qué cambia si
    responde otra cosa:
    - D-1 mitad y mitad descuenta 1 prepizza; D-2 las bases viven sólo en Stock; D-3 un gusto de pizza o ciabatta
      aparece en Ventas si queda una base y tiene precio; D-4 precio por gusto en Empanadas y Ciabattas, docena
      surtida proporcional; D-5 gastos viejos sin proveedor; D-6 correo y DNI opcionales, DNI vacío como `null`;
      D-7 contraste con un reemplazo de clases; D-8 la anulación devuelve las bases; D-9 el catálogo marca stock
      según la base; D-10 un proveedor con gastos no se borra; D-11 una promo descuenta lo mismo que la venta suelta;
      D-12 los gustos de pizza y ciabatta quedan en Stock sólo para "Costo y precio"; D-13 Gastos arranca con el mes
      en curso; D-14 Estadísticas cuenta jornadas, hasta 366; D-15 los arreglos de la revisión entran al Sprint 4;
      D-16 al ordenar Stock, los gustos sin stock propio van al final; D-17 el precio de una pizza desde "Ingresar
      stock" no trae la casilla "Aplicar a todos".
  - Las migraciones 0018 a 0021 son del Sprint 4. La base de Supabase la migra el dev; la local, `npm run db:migrate`.
- **Sprint 5 cerrado** ("Cierre de la primera entrega": T-23, BUG-26, BUG-27, US-36 a US-42 y T-24): en `main` con el
  tag `sprint-5` desde el 2026-10-30. Plan, decisiones y resumen en [`sprint-5.md`](plans/sprint-5.md).
  - Qué cambió:
    - El carrito: columnas separadas, el 45 % del ancho desde `lg` y un slide de 450 ms (BUG-26). La regla global
      de transiciones pasó a `@layer base`: sin capa anulaba todas las clases `transition-*` de Tailwind v4.
    - Un "+" en cada renglón del carrito, que respeta el stock (US-36).
    - El selector de las promos: título en tres renglones, botones en un renglón, "Quitar uno" y "Siguiente"
      (US-39).
    - El cliente en el carrito, con nombre obligatorio, teléfono y domicilio, sugerencias de Clientes y alta
      automática al cobrar (US-37).
    - Datos frescos al entrar a cada pantalla, sin botones "Sincronizar" (US-38, `useFreshDataOnEnter`).
    - De la revisión del dev: los botones del selector alineados con nombres largos (BUG-27); en Estadísticas, los
      calendarios a la derecha del título (US-40, `PageHeader` acepta `actions`), el fondo suave de cada tarjeta
      (US-41) y los cuadros de abajo con scroll propio desde la sexta fila (US-42).
  - Decisiones: las del dev (D-1 a D-4), las provisorias P-1 a P-8 y las tomadas durante la implementación (I-1 a
    I-5) en [`sprint-5.md`](plans/sprint-5.md). El dev revisó el sprint y dio el OK al merge el 2026-10-30.
  - La migración 0022 es del Sprint 5 (quedan 23). La base de Supabase la migra el dev.
  - Ningún ítem nuevo se arranca sin el OK del dev.
- Git: `main` recibe un merge de `develop` al cierre de cada sprint. El trabajo nuevo sale de `develop`. El repo de GitHub
  es **público**: todo lo que se pushea queda publicado.
- **No existe todavía**: `docs/conventions/`.
- **Sí existen**:
  - `BACKLOG.md`, con los Sprints 0 a 5 en orden de ejecución.
  - Los planes de cada sprint en `docs/plans/sprint-0.md`, `sprint-1.md`, `sprint-2.md`, `sprint-3.md`, `sprint-4.md` y `sprint-5.md`: orden, decisiones del
    dev y enfoque de cada ítem.
  - Las plantillas en `docs/templates/` (`plan.md`, `feature.md`, `adr.md`), los planes en `docs/plans/` y los
    ADR en `docs/adr/`.
  - El archivo de requerimientos `docs/requerimientos/specs.md` (texto del cliente, no se edita), y los wireframes
    del tablero de ventas y el logo en `docs/wireframes-ventas-gestor/`.
  - `.env.example` y `.env.test` (versionado: sólo apunta a `db-test`).
- Tests:
  - Vitest 5 con los proyectos `unit`, `component` (jsdom y Testing Library) e `integration`, y fast-check (T-2,
    T-5, ADR 0001).
  - Integración contra `db-test` (postgres:15 en el 5434, `tmpfs`), con una guarda que aborta si la URL no es esa.
  - E2E con Playwright (`tests/`, con Page Objects) contra `db-test`, con `next build` + `next start` en el 3100 y la carpeta
    `.next-e2e` (T-6, ver `tests/readme.md`). Nunca toca la base de desarrollo.
  - Mutación con Stryker (`stryker.config.mjs`, `npm run test:mutation`) sobre el dominio y los services de
    `provider`, `menu`, `stock`, `order` (también su store), `promotion`, `card`, `stats` y `expense`, y
    `src/lib/errors`.
- Features del dominio, cada uno con su README en `docs/features/`:
  - `menu` (US-3, T-12, ADR 0005): gustos y bebidas por grupo fijo, precios, fotos y catálogo público.
  - `stock` (US-4, US-16 a US-18): ingresos con costo y precio, mermas e historial por gusto; sólo admin.
  - `order` (US-5 a US-7, US-9, US-11 y US-15): tablero, promos, cobro con crédito en cuotas, historial,
    comprobante y anulación.
  - `promotion` (US-8): promociones con precio de venta a mano.
  - `card` (US-10): tarjetas y planes de cuotas con recargo.
  - `stats` (US-12 y US-13): estadísticas de la jornada y los cuadros de vendedores y de ventas.
  - `expense` (US-14): anotador de gastos.
- `provider` es el **feature molde** (T-5, `docs/features/provider/README.md`): los demás features se migran
  copiando su estructura.
- Gates (T-3, ADR 0003):
  - ESLint aplica las reglas duras (`eslint.config.mjs` + `eslint/`), salvo en los archivos heredados de
    `eslint-legacy.json`. Esa lista sólo se achica (`npm run lint:legacy`).
  - lefthook: `pre-commit` bloquea los `.env` reales y corre ESLint, el tope de los `.css` y el typecheck;
    `commit-msg` corre commitlint; `pre-push` corre `test:coverage` y `skills:check`.
- CI: `.github/workflows/ci.yml` en cada push a `develop` y `main` (lint, lista legacy, typecheck, skills,
  cobertura, mutación, integración, build y E2E contra `db-test`), más `keep-alive.yml`, que hace un ping diario a Supabase.
- `README.md` en español con el setup real (T-7).
- Skills: la fuente es `.agents/skills/`. Se copian a `.claude/skills/` con `npm run skills:sync`, y
  `npm run skills:check` verifica que estén iguales. **Nunca edites `.claude/skills/` directo.**

## 5. Arquitectura en un minuto

Detalle en [`docs/architecture.md`](architecture.md).

- **Next.js 16 (App Router) + React 19 + TypeScript estricto + Drizzle + PostgreSQL**, más Zustand, React Hook
  Form + Zod, Tailwind v4 y Cloudinary. Postgres corre en Docker en local y en Supabase en producción.
- **En ejecución es cliente-servidor y en despliegue es un monolito modular.** El navegador habla con el
  servidor por **Server Actions** (`'use server'`), no por una API REST.
- Capas: `ui → actions → service → repository → db`. La capa `service`, con unidad de trabajo, existe en `provider`,
  `menu`, `stock`, `order`, `promotion`, `card` y `expense`; `stats` tiene service y calcula con funciones puras. En `customer`, `user` y `audit` la lógica sigue repartida entre actions y
  repositorios: el código nuevo copia `provider`.
- Cada feature vive en `src/features/<feature>/` con estas carpetas:
  - `domain/`: schemas Zod de entrada y de fila.
  - `repository/`: Drizzle.
  - `services/`: reglas de negocio; abren la transacción con la unidad de trabajo.
  - `actions/`, `store/` (Zustand) y `ui/`.
  - `testing/`: fakes, fixtures y suites de comportamiento (contra el fake y contra Drizzle).
- Helpers de test en `src/test/`:
  - La guarda de `db-test`, el `globalSetup` de integración y `truncateAll()`.
  - `asUser({ role })`, que simula la sesión, y los setups que simulan `next/headers` y bloquean la base en unit.
- Piezas transversales (T-4): el catálogo `AppError(code)` en `src/lib/errors/`, `fail(code)` en
  `src/lib/action-result.ts`, `toActionFailure(error)` en `src/lib/db-errors.ts`, `withTransaction` en
  `src/lib/db/transaction.ts` y `formatDateTime` en `src/lib/format-date-time.ts`.
- `src/lib/db/index.ts` lleva `import 'server-only'`. Los scripts `db:*` y el E2E corren con
  `--conditions=react-server`, ya configurado en `package.json`. Si agregás un script que importe `@/lib/db`, sumale
  esa condición.
- Doc por feature en `docs/features/<f>/README.md`: hoy `provider`, `menu`, `stock`, `order`, `promotion`, `card`,
  `stats` y `expense`.
- Schema de la base en `src/lib/db/schema.ts`, `menu-schema.ts`, `stock-schema.ts`, `order-schema.ts`,
  `promotion-schema.ts`, `card-schema.ts` y `expense-schema.ts`.
- **Seguridad**:
  - JWT en la cookie `session`.
  - `src/proxy.ts` filtra por ruta y rol, pero es sólo una barrera de navegación.
  - La barrera real está en cada Server Action, con `verifyAuthOrAdmin`, que lanza `AppError` (`UNAUTHENTICATED`,
    `SESSION_EXPIRED`, `INACTIVE_USER` o `FORBIDDEN`).
- **Concurrencia optimista**: toda tabla que recibe `UPDATE` tiene `version`. El update filtra por `id` y
  `version`; si afecta 0 filas, hay conflicto: la lista se vuelve a leer sola y el usuario repite el cambio (US-38). El stock se descuenta con un
  bloqueo `SELECT … FOR UPDATE` de cada gusto y un guardado por `id` y `version` (cobro, ingresos, mermas y
  anulaciones).
- **Auditoría**: toda mutación escribe en `audit_logs` dentro de la misma transacción.
- Las actions **no lanzan errores al cliente**: devuelven `ActionResult`.

## 6. Reglas duras (resumen; la fuente es `AGENTS.md`)

| Regla | Resumen |
|---|---|
| Tamaño | ≤ 100 líneas por archivo de código (tests incluidos); funciones de ≤ 40 líneas y ≤ 3 parámetros |
| Comentarios | Cero. Única excepción: un *por qué* en español que el código no puede expresar, empezando con `Por qué:` |
| Tipado | Sin `any`, sin `!` y sin `as` salvo en fronteras ya validadas; retornos explícitos en lo exportado |
| Capas | `ui → actions → service → repository → db`. Sólo el repositorio toca Drizzle |
| SQL | Sin SQL plano. `sql` de Drizzle sólo dentro de `check()` del schema |
| Restricciones | Todo lo que Postgres pueda garantizar va en el schema (`notNull`, `unique`, `check`, FKs) |
| Errores | `AppError(code)` del catálogo (`src/lib/errors`) con mensaje en español; `fail(code)` / `toActionFailure(error)` arman el `ActionResult` |
| Seguridad | Sesión y rol verificados en el servidor; Zod `strictObject` en la entrada; respuesta validada con `RowSchema` |
| Fechas | UTC al guardar y transmitir; se muestran en `America/Argentina/Buenos_Aires` |
| Secretos | Nunca se commitea un `.env`; toda variable nueva va a `.env.example` |

Si una skill o `.agents/rules/coding-standards.md` contradice `AGENTS.md`, **gana `AGENTS.md`**. Por ejemplo,
los commits van en español aunque la skill `conventional-commit` diga inglés.

## 7. Código heredado: no es un ejemplo a seguir

El código heredado que queda **viola varias de esas reglas**: `any`, SQL dentro de queries, 28 archivos de más
de 100 líneas, comentarios y errores como textos sueltos. La lista completa está en
[`architecture.md` → Brechas](architecture.md#brechas-entre-el-código-actual-y-estas-reglas), y el inventario
exacto de archivos es `eslint-legacy.json`. Si tu ítem corrige un archivo heredado, sacalo de esa lista.

- **No lo copies como patrón.** El código nuevo sigue las reglas.
- **No lo arregles "de paso".** Cada brecha se corrige cuando un ítem del backlog toca ese código, o con un ítem
  propio.
- **Seguridad:**
  - Las fotos de los gustos se manejan desde Alta de productos: sólo el admin, con tipo y tamaño (JPG, PNG o WEBP de
    hasta 5 MB) validados antes de subir a Cloudinary (T-12 y BUG-11).
  - `JWT_SECRET` ya no tiene valor por defecto: es obligatoria y sin ella falla el login (BUG-2, con su test de
    regresión).
  - En desarrollo, Next ya no imprime los argumentos de las Server Actions (`logging.serverFunctions: false`), y
    Drizzle loguea el SQL sin parámetros. Fuera de `auth`, las lecturas no traen `password_hash` (BUG-6).
  - Ninguna respuesta al navegador ni el usuario de `verifyAuthOrAdmin` llevan el `password_hash` (BUG-7).
  - `fetchMenuItems` exige sesión y al vendedor no le manda el costo: no ve costos ni proveedores, y Stock es sólo admin (US-16) (decisión del dev,
    2026-10-25).
  - `handleDatabaseError` lee el error original de Postgres (también en `error.cause` de Drizzle): un duplicado,
    una referencia inexistente y un borrado de algo referenciado tienen cada uno su mensaje (BUG-9). Un error sin código conocido ya no manda a
    sincronizar: es "error inesperado" y su detalle queda en el log del servidor (BUG-14).
- **Qué base se usa** (T-8, ADR 0002): la de producción, **sólo** con `APP_ENV=production` (`.env.prod`, con
  `DATABASE_URL` y SSL). Con cualquier otro valor se usa `.env.local` y `LOCAL_DATABASE_URL`, que es obligatoria.
  `NODE_ENV` ya no elige la base: `next build` y `next start` usan la base local.
- **Peligro con datos reales:**
  - `db:seed`, `db:reset-data` y `db:reset-full` **borran todas las tablas**.
  - Desde BUG-3 se niegan a correr con `APP_ENV=production` o contra una base que no sea local, y desde BUG-10
    también `wipe-db.ts`. `db:seed-users` sólo crea los usuarios iniciales que faltan, sin pisar los existentes.
  - **Nunca corras nada con `APP_ENV=production`**, y nunca leas ni modifiques `.env.prod`.

## 8. Cómo se trabaja

Detalle en [`docs/workflow.md`](workflow.md). Las skills `start-task` y `finish-task` lo automatizan.

```
Requerimiento → Ítem de backlog → Descubrimiento → Plan aprobado → Rama → TDD → Gates → Docs → Merge squash → Hecho
```

### 8.1 Entrada de requerimientos

1. El dev pega lo que pide el cliente **textual** en `docs/requerimientos/specs.md`. Ese texto **no se edita**.
2. Vos lo interpretás y le hacés al dev las preguntas de descubrimiento (`workflow.md` §2): roles, datos y sus
   reglas, camino feliz, acciones inválidas, concurrencia, estados de UI, fechas y criterios **medibles**.
3. Con las respuestas armás el ítem en `BACKLOG.md`. **Sin ítem no se programa nada.** Un ítem tiene:
   - ID: `US-N` (historia), `T-N` (habilitador técnico) o `BUG-N`.
   - Historia ("Como… quiero… de forma que…").
   - Criterios de aceptación, **uno por línea** y separados por una línea en blanco, con checkbox (`[ ]`
     pendiente, `[x]` cumplido), su **estimación** y, al cumplirse, la **fecha y hora de cierre** (hora de
     Argentina).
   - **Cómo estimar**: vos implementás en minutos; el cuello de botella es el dev (leer el plan, inspeccionar el
     código, verificar, correr los tests y aprobar). La estimación es el tiempo total hasta el cierre, con esa
     revisión y las esperas de CI incluidas. Reglas en "Cómo se estima" de `BACKLOG.md`.
   - Dependencias, estado (`Pendiente` → `En progreso` → `En revisión` → `Hecho`), dueño, fecha de inicio,
     horas reales del ítem y "Preguntas abiertas".
   - La plantilla está al principio de `BACKLOG.md`.
4. Las dudas que el dev no puede responder sin el cliente quedan en "Preguntas abiertas".

### 8.2 Ejecución de un ítem

1. **`start-task`**:
   - Leé `AGENTS.md`, `workflow.md`, `architecture.md` y `docs/features/<f>/README.md` si existe.
   - Hacé las preguntas que falten **en un solo mensaje, numeradas**.
   - Escribí el plan en `docs/plans/<ID>-<slug>.md` con `docs/templates/plan.md`.
   - **Esperá la aprobación explícita del dev.**
2. **Rama**: `feat/<id>-<slug>` (o `fix/…`) desde `develop`. Reglas en [`docs/git.md`](git.md).
3. **TDD**, siempre: test que falla → código mínimo → refactor. Skill `test-driven-development`. Orden:
   1. `domain` (schemas)
   2. errores del catálogo
   3. schema + migración (`npm run db:generate -- --name <descripcion>`)
   4. repositorio + fake + test de integración
   5. service con tests unitarios
   6. actions con tests de contrato y fuzz
   7. store y ui con tests de componente, y E2E si el flujo es crítico
4. **Tests por ítem**:
   - Unit, contrato (caja negra) y fuzz.
   - Integración si tocaste un repositorio o el schema.
   - Regresión (`regression BUG-N: …`) si es un bug.
   - Cada criterio de aceptación y cada fila de la tabla de errores tiene su test. Detalle en
     [`testing.md`](testing.md).
5. **`finish-task`**:
   - Recorré la [Definition of Done](definition-of-done.md) **con evidencia**, es decir, mostrando la salida de
     los comandos.
   - Los tests del nivel del ítem en verde ([`testing.md`](testing.md#nivel-de-tests-de-cada-ítem)). En nivel 3,
     `npm run verify`: cobertura ≥ 90/85 y mutación ≥ 70.
   - Actualizá `docs/features/<f>/README.md` con `docs/templates/feature.md`, que incluye la tabla
     *acción inválida → code → mensaje → test*.
   - Escribí un ADR si hubo una decisión de arquitectura.
   - Actualizá `.env.example` y el seed si corresponde.
   - En `BACKLOG.md`, anotá la fecha y hora de cierre de cada criterio a medida que se cumple, y al terminar
     pasá el ítem a `En revisión`. Las horas reales del ítem las carga el dev.
6. **Commits**:
   - Conventional Commits **en español**: `feat(sale): registrar el medio de pago de cada venta`.
   - El scope es la carpeta del feature, y el footer lleva `Refs: <ID>` y el trailer `Co-Authored-By` de la IA.
   - **Antes de commitear, mostrale al dev una lista breve en lenguaje simple** (para alguien que no sabe nada
     técnico) de todo lo esencial que entra: qué es, por qué importa, adónde va y qué no entra. **Esperá su OK**
     sobre esa lista.
   - Nunca `--no-verify` ni `push --force` a `main` o `develop`.
7. **Sin PR, como regla general.** Con el OK del dev: `git merge --squash` de la rama a `develop` (un commit por
   ítem), push y borrado de la rama. Al cerrar el sprint: merge local `develop → main` con el tag `sprint-N`.
   Detalle en [`docs/git.md`](git.md#flujo).

## 9. Cómo comportarte

- **No inventes reglas de negocio.** Si no está en la US, en `docs/features/` ni en `specs.md`, preguntás.
- **No escribas código de producción sin un plan aprobado.** Si el dev te pide algo explícito fuera del flujo
  (por ejemplo, tooling), hacelo, pero decí qué paso quedó afuera: sin ítem en el backlog, sin tests, etc.
- **Commits, push, borrados y comandos sobre la base:** sólo si el dev lo pide o lo aprueba.
- **Evidencia antes de "listo".** Corré los comandos y mostrá la salida. Si algo falló o lo salteaste, decilo
  tal cual.
- **Docs en el mismo cambio que el código.** Si el código y la doc se contradicen, la tarea no está terminada.
  Cómo documentar: [`docs/how-to-document.md`](how-to-document.md).
- **Este prompt también es doc.** Si tu tarea es un avance significativo, es decir, si vuelve falsa alguna línea
  de este archivo, lo adaptás en el mismo cambio y actualizás la fecha de la foto.
- **Contradicciones entre docs:** avisá y proponé cuál corregir; `AGENTS.md` es la fuente canónica.
- **Cambios mínimos y enfocados.** Nada de refactors, dependencias ni "mejoras" que nadie pidió. El cambio más
  chico que resuelva el problema: un texto mal armado se arregla en su plantilla, no en cada llamada.
- **Skills:** las propias (`start-task`, `finish-task`, `delegate-task`) se editan en `.agents/skills/` y después
  se corre `npm run skills:sync`.
- **Subagentes:** con `delegate-task`, cada parte del trabajo va al modelo más barato que pueda hacerla (Haiku,
  Sonnet u Opus; Opus es el techo). Lo chico se hace directo, y commits y comandos sobre la base nunca se delegan.
- **Dudas que quedan abiertas:** las tuyas para el dev van a `docs/preguntas-dev.md`; las de negocio, a
  "Preguntas abiertas" del ítem en `BACKLOG.md`.

## 10. Comandos

| Para | Comando |
|---|---|
| Levantar la base local | `docker compose up -d` (servicio `db`, postgres:15, puerto 5433 en el host) |
| Migrar y preparar la base | `npm run db:migrate` (incluye `unaccent` desde la migración 0005) → `npm run db:seed-users` (usuario `admin` / `admin`) |
| Desarrollo | `npm run dev` → http://localhost:3000 |
| Lint / tipos / build | `npm run lint` · `npm run lint:legacy` · `npm run typecheck` · `npm run build` |
| Tests unit | `npm test` · `npm run test:watch` · `npm run test:coverage` |
| Tests de integración | `docker compose up -d --wait db-test` → `npm run test:int` |
| E2E | `docker compose up -d --wait db-test` → `npm run test:e2e` (Chromium) o `npm run test:e2e:all` (tres navegadores) |
| Skills | `npm run skills:sync` · `npm run skills:check` |
| Mutación | `npm run test:mutation` (Stryker, score ≥ 70) |
| Antes de integrar a `develop` | Los tests del nivel del ítem; en nivel 3 y al cerrar el sprint, `npm run verify` (lint, tipos, cobertura, integración, mutación y build) |

La configuración local va en `.env.local` (plantilla: `.env.example`): `LOCAL_DATABASE_URL`, `JWT_SECRET`
(**obligatoria**) y `CLOUDINARY_URL`. Usuarios del seed: `admin`/`admin` y `vendedor`/`vendedor`. Son temporales: después se crean
las cuentas reales y se borran esas.

> **Si levantás `npm run dev` para verificar algo**, al terminar detené el servidor y **borrá `.next`**. Next 16
> guarda una caché persistente de Turbopack en `.next/dev/cache`. Si cortás el proceso de golpe (`taskkill /F`),
> la caché puede quedar corrupta y el servidor que levante después el dev puede dar 404 en rutas que existen
> (pasó con `/login`, ver BUG-4). Además, verificá siempre en el servidor del dev, no sólo en el tuyo.
>
> **Lo mismo después de `npm run build`.** Un `next dev` levantado después de un build local dio 404 en `/login`
> hasta que se borró `.next` (2026-10-24, BUG-6). Si corrés un build, borrá `.next` al terminar. El E2E (T-6)
> compila en una carpeta aparte para no pisar la del dev.

## 11. Qué leer y en qué orden

1. [`AGENTS.md`](../AGENTS.md): reglas canónicas.
2. [`docs/workflow.md`](workflow.md) y [`docs/definition-of-done.md`](definition-of-done.md).
3. [`docs/architecture.md`](architecture.md), incluida la sección de brechas.
4. [`docs/testing.md`](testing.md) y [`docs/git.md`](git.md).
5. `BACKLOG.md`, `docs/requerimientos/specs.md` y `docs/features/<f>/README.md` del feature que vayas a tocar.

## 12. Glosario

| Término | Significado |
|---|---|
| Dev | El usuario con quien trabajás. Decide y aprueba. |
| Cliente | El dueño de la rotisería. Origen de los requerimientos. |
| US / T / BUG | Historia de usuario / habilitador técnico / defecto. Son los IDs del backlog. |
| CA | Criterio de aceptación; cada uno tiene su test. |
| DoR / DoD | Definition of Ready / Definition of Done. |
| ADR | Registro de una decisión de arquitectura (`docs/adr/NNNN-titulo.md`). |
| Brecha | Código heredado que no cumple las reglas actuales. |
| Habilitador | Trabajo técnico sin valor directo para el usuario, como instalar Vitest o crear `db-test`. |
| Gusto | Cada variedad que se vende de un grupo (Carne, Muzza, Coca-Cola 500 ml). En el código, `menu_items`. |
| Grupo y presentación | Grupo fijo (Empanadas, Pizzas, Sanguches, Ciabattas, Coca-Cola, Pepsi) y cantidad en que se vende (1, 3, 6, 12 u; pizza de 1 o 2 sabores). |
| Línea del pedido | Una presentación con sus gustos y su cantidad. En el código, `sale_lines` y `sale_line_items`. |
| Surtida | Una presentación de varias unidades con gustos distintos, armada con "Agregar uno" y "Completar". |
| Costo para el local | Lo que le cuesta al local hacer o comprar una unidad (en la pizza, la pizza entera). Va por gusto y sirve para la ganancia. En el código, `unitCost`. Los campos, columnas y títulos nunca dicen "costo" a secas. |
| Precio de venta | Lo que paga el cliente. Va por grupo en Empanadas y Ciabattas (se carga en Alta de productos) y por gusto en el resto (se carga en Ingresar stock). En el código, `price1` a `price12`. Los campos, columnas y títulos nunca dicen "precio" a secas. |
| Promo | Presentaciones con un precio de venta propio que escribe el admin; al venderla se eligen los gustos de cada parte (US-8 y US-9). En el código, `promotions`. |
| Recargo de cuotas | El % del plan de la tarjeta sobre la parte pagada con crédito. Es de la tarjeta, no del local: no suma al total de la venta ni a la ganancia, sólo se guarda como dato (US-11, BUG-20). |
| Jornada | El día del local para Estadísticas: de 7:00 a 6:59 del día siguiente, en hora de Argentina (US-12). |
| Turno | Mañana (7:00 a 16:59) o tarde (17:00 a 6:59), en el cuadro de vendedores (US-13). |
