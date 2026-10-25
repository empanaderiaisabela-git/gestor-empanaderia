# Plan: BUG-5 — Consultas en paralelo sobre la misma conexión en el dashboard

- **Ítem del backlog**: BUG-5
- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-24 · **Estado**: Aprobado (plan del sprint)
- **Rama**: `fix/bug-5-dashboard-secuencial`

## Objetivo

Que el dashboard calcule los mismos números sin lanzar consultas simultáneas sobre una misma conexión, que `pg` 9 va
a rechazar.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Cambia algún número o la respuesta de la action? | No: mismos totales y misma forma de respuesta (la forma del error es BUG-12) | US |
| ¿Se mantiene la foto consistente? | Sí: transacción `repeatable read` de sólo lectura con las consultas de a una | plan del sprint |
| Roles | Sin cambios (BUG-12 decide si el vendedor puede invocarla) | dev |

## Cambios por capa

| Capa | Archivos | Responsabilidad |
|---|---|---|
| domain | `stats/domain/stats.schema.ts` | Tipos del rango, la foto y los totales |
| repository | `stats/repository/stats.repository.ts` | `getDashboardSnapshot`: tres consultas secuenciales y sólo las columnas que se usan (el vendedor trae sólo `username`) |
| service | `stats/services/compute-dashboard-stats.ts`, `stats/services/dashboard-stats.service.ts` | Cálculo puro de los totales y el rango, y la composición con el repositorio |
| actions | `stats/actions/stats.actions.ts` | Sesión → service → respuesta; sale de la lista legacy |
| testing | `stats/testing/seed-dashboard.ts`, `src/test/truncate-all.ts` | Datos sembrados y tablas vacías antes de cada test (`truncateAll` adelantado de T-4) |

## Tests

| Tipo | Casos |
|---|---|
| Unit | Totales, merma sin producto, cobros por tipo, ranking de vendedores, "Sistema" y rango de fechas |
| Integración | `regression BUG-5`: espía `process.emitWarning` y verifica que no aparece el aviso de `pg`. Con la versión en paralelo falla, y con la secuencial pasa. Además, la foto del rango y los totales sobre datos sembrados (CA-2) |

## Riesgos y decisiones

- Las fechas siguen en la hora local del servidor; es una brecha conocida y no se corrige de paso.
- `truncateAll()` verifica que la base sea `db-test` antes de borrar.
