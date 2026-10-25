# Gestor de stock — empanadería

Sistema web de gestión de stock, ventas, clientes, proveedores, usuarios y auditoría para la empanadería de un
cliente. Next.js 16 (App Router), React 19, TypeScript estricto, Drizzle ORM sobre PostgreSQL 15, Zod 4 y Zustand.

- **Contexto completo para arrancar**: [`docs/initial_prompt.md`](docs/initial_prompt.md).
- **Reglas del repo** (humanos y agentes): [`AGENTS.md`](AGENTS.md).
- **Backlog vigente**: [`BACKLOG.md`](BACKLOG.md). Requerimientos del cliente: [`docs/requerimientos/specs.md`](docs/requerimientos/specs.md).
- **Arquitectura**: [`docs/architecture.md`](docs/architecture.md). **Tests**: [`docs/testing.md`](docs/testing.md).
  **Flujo de trabajo**: [`docs/workflow.md`](docs/workflow.md) y [`docs/git.md`](docs/git.md).

## Módulos

| Ruta | Qué hace |
|---|---|
| `/login` | Acceso con bcrypt y JWT en cookie HttpOnly |
| `/home`, `/product/[id]` | Catálogo público: gustos y bebidas visibles, por grupo, con fotos y precios (sin login) |
| `/` | Estadísticas (sólo admin): ingresos, ganancia en limpio, mermas, valor del stock, medios de pago y vendedores |
| `/ventas` | Ventas/Pedidos: historial con comprobante y anulación (sólo admin); "Nuevo pedido" abre el tablero |
| `/ventas/nueva` | Tablero de pedidos por grupo, con colores y emojis, surtidas, mitad y mitad, y cobro en 4 medios de pago |
| `/stock` | Stock por gusto: ingresos con costo y proveedor, mermas (sólo admin) e historial |
| `/alta-de-productos` | Gustos y bebidas, precios del grupo o por gusto, fotos y visibilidad en el catálogo (sólo admin) |
| `/clientes` | Directorio de clientes |
| `/proveedores` | Proveedores, sólo admin (feature molde de la arquitectura: [`docs/features/provider/`](docs/features/provider/README.md)) |
| `/usuarios` | Usuarios internos (sólo admin) |
| `/logs` | Auditoría de todas las escrituras (sólo admin) |

Roles: `admin` (todo) y `vendedor` (Ventas/Pedidos, Stock y Clientes). Cada Server Action verifica sesión y rol en el
servidor; las únicas lecturas públicas son las del catálogo.

## Puesta en marcha local

Requisitos: Node 22.12 o más, Docker y npm.

```bash
npm install                      # instala dependencias y los hooks de lefthook
npx playwright install chromium  # navegador para el E2E
cp .env.example .env.local       # completar los valores (ver abajo)
docker compose up -d --wait db   # Postgres de desarrollo en 127.0.0.1:5433
npm run db:migrate               # aplica las migraciones (incluye la extensión unaccent)
npm run db:seed-users            # usuario admin
npm run dev                      # http://localhost:3000
```

Credenciales del seed: usuario `admin`, contraseña `admin`.

### Entornos y variables

| Archivo | Uso | Versionado |
|---|---|---|
| `.env.local` | Desarrollo: `LOCAL_DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_URL` | No |
| `.env.test` | Tests de integración y E2E: apunta a `db-test` (127.0.0.1:5434) | Sí (sin secretos reales) |
| `.env.prod` | Producción: `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_URL` | **Nunca** |
| `.env.example` | Plantilla de todas las variables | Sí |

La base se elige **sólo** con `APP_ENV`, nunca con `NODE_ENV` ([ADR 0002](docs/adr/0002-la-base-se-elige-con-app-env.md)):
sin `APP_ENV` se usa `.env.local`; con `APP_ENV=production` se usa `.env.prod` con SSL. **Quien despliegue la app
tiene que definir `APP_ENV=production`.** Los scripts destructivos (`db:seed`, `db:reset-data`, `db:reset-full`) se
niegan a correr contra una base que no sea local.

### Puertos

| Servicio | Puerto |
|---|---|
| App en desarrollo (`npm run dev`) | 3000 |
| App del E2E (`next build` + `next start`, carpeta `.next-e2e`) | 3100 |
| Postgres de desarrollo (`db`) | 5433 |
| Postgres de tests (`db-test`, en memoria, perfil `test`) | 5434 |

## Tests y calidad

```bash
docker compose up -d --wait db-test   # requerido por test:int y test:e2e
npm run test:watch                    # mientras desarrollás
npm run lint && npm run typecheck
npm run test:coverage                 # unit, contrato, fuzz y componentes; cobertura ≥ 90/85
npm run test:int                      # integración de repositorios sobre db-test
npm run test:e2e                      # Playwright en Chromium sobre db-test
npm run test:mutation                 # Stryker, score ≥ 70
npm run verify                        # todo lo anterior salvo E2E, más el build. Antes de integrar a develop
```

- **Hooks** (lefthook): `pre-commit` bloquea `.env` reales y corre ESLint y tipos; `commit-msg` corre commitlint;
  `pre-push` corre la cobertura y `skills:check`.
- **CI** (GitHub Actions, en cada push a `develop` y `main`): calidad, unit, mutación, integración, build y E2E.
  Firefox y WebKit sólo en `main`.
- **Reglas duras** (ESLint): 100 líneas por archivo, funciones de 40 líneas y 3 parámetros, cero comentarios
  (salvo `Por qué:`), sin `any`/`!`/`as`, capas `ui → actions → services → repository → db` y sin SQL plano. Los
  archivos heredados de `eslint-legacy.json` las tienen apagadas; esa lista sólo se achica ([ADR 0003](docs/adr/0003-reglas-estrictas-con-lista-legacy.md)).

## Scripts de base de datos

| Comando | Qué hace |
|---|---|
| `npm run db:generate` | Genera una migración a partir del schema |
| `npm run db:migrate` | Aplica las migraciones pendientes |
| `npm run db:seed` / `db:reset-data` | Carga o reinicia los datos base (sólo base local) |
| `npm run db:reset-full` | Borra toda la base local y la recrea (destructivo) |
| `npm run db:seed-users` | Crea los usuarios iniciales |
| `npm run db:stress-test` | Agrega 300 ventas de bebidas para probar el volumen de Ventas/Pedidos |

Contra producción, sólo con `APP_ENV=production` delante y sabiendo lo que se hace (por ejemplo
`APP_ENV=production npm run db:migrate`).

## Flujo de trabajo

Sin pull requests: cada ítem del backlog va en su rama, se integra con `git merge --squash` a `develop` (un commit
por ítem, Conventional Commits en español) con el OK del dev, y cada sprint se cierra con un merge de `develop` a
`main` y un tag. Detalle en [`docs/git.md`](docs/git.md).
