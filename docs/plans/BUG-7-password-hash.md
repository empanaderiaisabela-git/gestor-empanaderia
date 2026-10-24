# Plan: BUG-7 — El `password_hash` llega al navegador

- **Ítem del backlog**: BUG-7
- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-24 · **Estado**: Aprobado (plan del sprint)
- **Rama**: `fix/bug-7-password-hash`

## Objetivo

Que ninguna respuesta al cliente, ni el usuario que devuelve `verifyAuthOrAdmin`, lleve el `password_hash`.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Dónde se filtra? | `createUserAction` y `updateUserAction` devolvían la fila de `.returning()` con un cast `as UserDef` | exploración |
| ¿Y `verifyAuthOrAdmin`? | Desde BUG-6, `getUserById` ya no lee el hash; falta que su tipo y su resultado lo garanticen | BUG-6 |
| ¿Cambia la respuesta de las acciones? | No: misma forma (`UserDef`), sin el hash | US |

## Cambios

| Capa | Archivos | Responsabilidad |
|---|---|---|
| repository | `user/repository/user.repository.ts` | Los cinco `.returning()` listan las columnas públicas |
| actions | `user/actions/user.actions.ts` | `userRowSchema.parse(...)` en vez del cast |
| lib/auth | `src/lib/auth/utils.ts` | `verifyAuthOrAdmin(): Promise<UserDef>` con `userRowSchema.parse` |

## Tests

| Tipo | Casos |
|---|---|
| Contrato (integración) | `regression BUG-7`: crear, reactivar y editar un usuario no devuelven el hash, y editar no toca el hash guardado |
| Unit | `regression BUG-7`: aunque el repositorio traiga el hash, `verifyAuthOrAdmin` no lo devuelve |
| Tipos | `expectTypeOf`: el tipo que devuelve `verifyAuthOrAdmin` no tiene `passwordHash` (lo controla `npm run typecheck`; antes del fix el tipo era `any` y fallaba) |
