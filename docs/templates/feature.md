# Feature: <nombre>

- **US relacionadas**: <US-N, …>
- **Código**: `src/features/<f>/` (domain, repository, services, actions, store, ui), tablas en
  `src/lib/db/schema.ts`, pantallas en `src/app/`

## Qué hace

<Comportamiento vigente, en lenguaje de negocio.>

## Reglas de negocio

- <Regla> (fuente: US-N / dev / cliente)

## Roles y permisos

| Acción | admin | vendedor | público (sin sesión) |
|---|---|---|---|
| | | | |

## Server Actions

<Una fila por action exportada. Acceso: los roles que verifica en el servidor, o "público".>

| Action | Acceso | Entrada (schema) | Respuesta |
|---|---|---|---|
| | | | `ActionResult<…>` |

## Datos

<Tabla(s), columnas relevantes, restricciones y si llevan `version`.>

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| | | | |

## Pantallas

<Rutas en `src/app/`, componentes principales y estados (carga, vacío, error).>