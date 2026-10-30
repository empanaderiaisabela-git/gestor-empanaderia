# Feature: Proveedores

Molde de la arquitectura objetivo (T-5): `domain → repository → services → actions → ui`. Los features nuevos copian
esta estructura.

## Qué hace

Alta, edición, activación y desactivación, borrado y listado de los proveedores (distribuidores y mayoristas) a los
que se les compra mercadería.

## Reglas de negocio

- El nombre es único **entre los activos**. Si se crea uno con el nombre de un proveedor **inactivo**, se lo reactiva
  con los datos nuevos ("Proveedor reactivado") en vez de crear otro.
- El teléfono y el correo son opcionales (US-25). Si se carga un correo, tiene que tener formato válido.
- No se puede borrar un proveedor que tiene productos: se lo desactiva.
- Editar, activar o desactivar y borrar exigen la `version` que tiene la pantalla (concurrencia optimista).
- Toda escritura deja un registro en la auditoría, en la misma transacción.

## Roles y permisos

| Acción | Admin | Vendedor | Sin sesión |
|---|---|---|---|
| Listar (`fetchProviders`) | Sí | Sí | Lista vacía |
| Crear, editar, activar o desactivar, borrar | Sí | `FORBIDDEN` | `UNAUTHENTICATED` |

## Server Actions

Un archivo por operación en `src/features/provider/actions/`: `create-provider.ts`, `update-provider.ts`,
`toggle-provider-active.ts` (`{ id, isActive, version }`), `delete-provider.ts` (`{ id, version }`) y
`fetch-providers.ts`. Todas devuelven `ActionResult` con `code` en el fallo, y validan la entrada con `strictObject`
y la respuesta con `providerRowSchema`.

## Datos

- Tabla `providers` (`src/lib/db/schema.ts`), con `version`, `created_at` y `updated_at`.
- `ProviderRepository` (interfaz) con dos implementaciones: Drizzle (`repository/provider.repository.ts`) y un fake
  en memoria (`testing/fake-provider-unit-of-work.ts`). La suite `testing/provider-repository.behavior.ts` corre
  contra las dos.
- El servicio nunca ve la transacción: `unitOfWork.run(work)` le da `{ providers, audit }` atados a ella.
- Las búsquedas con `ilike` escapan `%` y `_`.

## Errores

| Situación | Código | Mensaje | Test |
|---|---|---|---|
| Sin sesión | `UNAUTHENTICATED` | No autorizado (Token faltante) | `provider-errors.contract.test.ts` |
| Un vendedor escribe | `FORBIDDEN` | Solo los administradores pueden realizar esta acción | `provider-errors.contract.test.ts` |
| Datos inválidos o campos de más | `VALIDATION` | El de la validación de Zod | `provider-errors.contract.test.ts` |
| Ya hay un proveedor activo con ese nombre | `DUPLICATE` | El de `MESSAGES.ERROR.DATABASE.UNIQUE_VIOLATION` | `provider-errors.contract.test.ts` |
| Otra persona cambió el proveedor (versión vieja) | `STALE_VERSION` | El de `MESSAGES.ERROR.DATABASE.CONCURRENCY` | `provider-errors.contract.test.ts` |
| Borrar un proveedor con productos | `HAS_RELATIONS` | El de `MESSAGES.ERROR.DATABASE.FOREIGN_KEY_VIOLATION` | `provider-errors.contract.test.ts` |

## Pantallas

`/proveedores` (`src/app/(main)/proveedores/page.tsx`) monta `ProvidersPanel` (`src/features/provider/ui/`): tabla en
escritorio, tarjetas en el celular, filtro "Ver Inactivos" y el modal del formulario. Sólo el admin ve "Agregar" y
"Eliminar". E2E: `tests/proveedores.spec.ts`.

## Tests

| Tipo | Dónde |
|---|---|
| Unit (schemas y servicio contra el fake) | `domain/*.test.ts`, `services/*.test.ts`, `testing/*.test.ts` |
| Contrato y fuzz (acciones) | `actions/*.contract.test.ts` |
| Integración (repositorio Drizzle sobre `db-test`) | `repository/*.int.test.ts` |
| Componente (jsdom) | `ui/provider-form-fields.test.tsx` |
| Mutación (Stryker) | `npm run test:mutation`: `domain`, `services` y `src/lib/errors`. Score 97,46 al cierre de T-5 |
