# Plan: BUG-6 — Datos sensibles en los logs de desarrollo y lecturas de más

- **Ítem del backlog**: BUG-6
- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-24 · **Estado**: Aprobado (plan del sprint)
- **Rama**: `fix/bug-6-datos-sensibles`

## Objetivo

Que ninguna contraseña aparezca en los logs de desarrollo y que, fuera de `auth`, ninguna consulta lea
`password_hash`.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Apagar o redactar el log de Server Actions? | Apagar `logging.serverFunctions`: Next 16 no tiene opción para redactar | doc de Next, plan del sprint |
| ¿Y el logger de Drizzle? | Se sigue logueando el SQL en desarrollo, pero sin parámetros | plan del sprint |
| ¿Qué lecturas cambian? | `getUserById` (lo usa `verifyAuthOrAdmin`), los chequeos de duplicado de `createUser` y `updateUser`, y el vendedor en `getSaleById`. El dashboard ya se corrigió en BUG-5 | exploración |

## Cambios

| Área | Archivos | Responsabilidad |
|---|---|---|
| Next | `next.config.ts` | `logging.serverFunctions: false` |
| Drizzle | `src/lib/db/query-logger.ts`, `src/lib/db/index.ts` | Logger que imprime el SQL sin parámetros |
| Repositorios | `user.repository.ts`, `sale.repository.ts` | Columnas explícitas, sin `passwordHash` |

## Tests

| Tipo | Casos |
|---|---|
| Unit | `regression BUG-6`: la config de Next apaga el log de Server Actions; el logger de Drizzle no imprime parámetros |
| Integración | `regression BUG-6`: `getUserById`, `getSaleById`, la foto del dashboard y el listado de usuarios no traen el hash |
| Verificación | `next dev` real: un login con una contraseña única la imprimía antes del fix, y después no |

## Riesgos y decisiones

- `user.repository.ts` y `sale.repository.ts` siguen en la lista legacy: sólo se tocaron las consultas del bug.
- Lo que el servidor le devuelve al navegador (crear y editar usuario) es BUG-7.
