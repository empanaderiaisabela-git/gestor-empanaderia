# Plan: US-54 — Bebida hasta 50 caracteres

- **Ítem del backlog**: US-54
- **Autor**: Claude Code · **Fecha**: 2026-11-02 · **Estado**: Aprobado por el dev (2026-11-02)
- **Rama**: `feat/us-54-bebida-50`
- **Nivel de tests**: 3 · profundo (cambia el schema y lleva migración)

## Objetivo

El cliente se queda corto con los 30 caracteres del campo **Bebida** (Alta de productos, grupos Coca-Cola y
Quilmes) y le pide más espacio al dev. Pasa a 50, como en US-53 pasó de 25 a 30.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Qué campo cambia? | "Bebida", el único con tope de 30. Los gustos de comida ya aceptan 60. | dev, 2026-11-02 |
| ¿Cambian Litros o Sabor? | No: Litros sigue en 8 y Sabor en 25. | dev, 2026-11-02 |
| ¿Qué rol? | El admin, como hoy. Sin cambios de permisos. | código |
| ¿Concurrencia, fechas, estados de UI? | Sin cambios. | código |

**Preguntas abiertas**: ninguna.

## Cambios por capa

| Capa | Archivos | Responsabilidad |
|---|---|---|
| domain | `src/features/menu/domain/drink.ts` | `MAX_DRINK` pasa de 30 a 50. |
| schema + migración | `src/lib/db/menu-schema.ts`, `0029_bebida-50.sql` | `drink_name` a `varchar(50)` y `name` a `varchar(85)` (50 + 8 + 25 + 2 espacios), para que el nombre armado siempre entre. |
| docs | `docs/features/menu/README.md` | Los nuevos largos. |

Sin repositorio, service, actions ni UI: el formulario ya muestra el error que devuelve el schema.

## Restricciones de base de datos

Sólo se agranda el largo de dos `varchar`. La migración es aditiva según `additive-migrations.test.ts` (desde US-53
acepta `SET DATA TYPE varchar(n)`). No reescribe ni borra datos.

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Bebida de 51 caracteres o más | `VALIDATION` | La bebida no puede superar los 50 caracteres | `drink.test.ts` |

## Tests

| Tipo | Casos |
|---|---|
| Unit | Bebida acepta 50 y con 51 da el mensaje. |
| Fuzz | El nombre armado (bebida ≤ 50, litros ≤ 8, sabor ≤ 25) entra siempre en 85. |
| Integración | `npm run test:int`: la migración corre sobre `db-test`. |
| CA → test | CA-1 → `drink.test.ts`. |

## Riesgos y decisiones

- Supabase tiene que migrarse a mano (lo hace el dev) antes de llevar esto a `main`.
