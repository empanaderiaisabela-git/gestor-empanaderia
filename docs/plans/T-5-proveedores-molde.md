# Plan: T-5 Proveedores como feature molde

- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-24 · **Estado**: Ejecutado
- Sale de la sección 14 de [`sprint-0.md`](sprint-0.md), aprobada por el dev junto con el plan del sprint.

## Qué se hizo

1. `src/features/provider/` con `domain` (`strictObject`), `repository` (interfaz `ProviderRepository`,
   implementación Drizzle y unidad de trabajo con auditoría), `testing` (fake y suite de comportamiento),
   `services`, una action por archivo y `ui`. Sale de `eslint-legacy.json` (139 → 132).
2. Activar/desactivar y borrar exigen `version`; el panel la envía.
3. Contratos por fila de la tabla de errores y un fuzz de crear.
4. Stryker sobre `provider/{domain,services}` y `src/lib/errors` (`vitest.mutation.config.mts`), `test:mutation`,
   `verify` y job `mutation` en el CI.
5. Proyecto `component` de Vitest (jsdom) con el primer test de componente.
6. `docs/features/provider/README.md`.

## Verificación

- `npm run test:coverage`: 186 tests, 97,75 % de líneas.
- `npm run test:int`: 27 tests.
- `npm run test:mutation`: 97,46.
- `npm run test:e2e -- tests/proveedores.spec.ts`: 24/24.
