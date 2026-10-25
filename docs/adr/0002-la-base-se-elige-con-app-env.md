# 0002 — La base se elige con `APP_ENV`, no con `NODE_ENV`

- **Estado**: Aceptado (2026-10-24)

## Contexto

`src/lib/db/index.ts` y `drizzle.config.ts` elegían la base por `NODE_ENV`: con `production` cargaban `.env.prod` y
usaban `DATABASE_URL` (Supabase). Pero `next build` y `next start` corren siempre con `NODE_ENV=production`, y `/home`
se prerenderiza en el build leyendo los productos. Resultado:

- un `npm run build` en la PC del dev consultaba la base de producción;
- en el CI y en el E2E no había forma de construir ni de levantar la app contra `db-test`;
- si faltaba `LOCAL_DATABASE_URL`, se usaba en silencio la base de desarrollo del 5433.

## Decisión

- La selección vive en una función pura, `src/lib/db/database-config.ts`, con tests unit:
  - `envFileFor(env)`: `.env.prod` sólo con `APP_ENV=production`; si no, `.env.local`.
  - `resolveDatabaseConfig(env)`. En producción: `DATABASE_URL` obligatoria, SSL, sin log de consultas y pool de 10.
    Si no, `LOCAL_DATABASE_URL` obligatoria (sin valor por defecto), sin SSL y con log de consultas.
  - `APP_ENV` sólo acepta `production`, `development`, `test` o vacío. Cualquier otro valor (`prod`, `PRODUCTION`)
    es un error, para que una errata no termine eligiendo una base sin querer.
- `src/lib/db/index.ts` y `drizzle.config.ts` usan esas funciones. `NODE_ENV` deja de elegir la base.
- La guarda de los tests de integración también rechaza `APP_ENV=production`.

## Alternativas descartadas

- **Seguir con `NODE_ENV`**: es una variable de Next y de Node que cambia sola en `build` y `start`; usarla para elegir
  la base es lo que causó el problema.
- **Hacer `/home` dinámico (`force-dynamic`)**: el build dejaría de leer la base, pero `next start` en local seguiría
  apuntando a producción, y se perdería el ISR del catálogo.

## Consecuencias

- Los comandos contra producción pasan a ser `APP_ENV=production npm run …`.
- **Quien despliegue la app** (el hosting está a definir) tiene que definir `APP_ENV=production` y `DATABASE_URL`. Si
  falta `APP_ENV`, la app falla al arrancar por falta de `LOCAL_DATABASE_URL`, en vez de usar otra base en silencio.
- Cualquier proceso que importe `@/lib/db` necesita `LOCAL_DATABASE_URL` (o `APP_ENV=production` con
  `DATABASE_URL`). Los tests unit que lo importen tienen que definirla o reemplazar el módulo (T-4).
- `next build` en el CI usa `db-test` pasando `LOCAL_DATABASE_URL` (T-3).
