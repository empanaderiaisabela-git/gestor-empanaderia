# Plan: <ID> — <título>

- **Ítem del backlog**: <US-N / T-N / BUG-N>
- **Autor**: <nombre> · **Fecha**: <AAAA-MM-DD> · **Estado**: Borrador | Aprobado
- **Rama**: `feat/<id>-<slug>`

## Objetivo

<Qué problema resuelve y para quién, en 2-3 líneas.>

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente (US, dev, cliente) |
|---|---|---|
| ¿Qué rol ejecuta la acción? | | |
| ¿Qué campos entran/salen y con qué reglas? | | |
| ¿Hay concurrencia? | | |
| ¿Qué se muestra en carga / vacío / error? | | |

**Preguntas abiertas**: <las que el dev no puede responder sin consultar al cliente; se copian también a
`BACKLOG.md`>

## Cambios por capa

| Capa | Archivos a crear/modificar | Responsabilidad |
|---|---|---|
| domain (schemas Zod) | | |
| lib/errors (catálogo) | | |
| schema + migración | | |
| repository (+ fake en `testing/`) | | |
| service | | |
| actions | | |
| store y ui | | |
| página (`src/app/`) y `proxy.ts` | | |

## Restricciones de base de datos

<unique, check, FKs con onDelete, índices, version>

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| | | | |

## Tests

| Tipo | Casos |
|---|---|
| Unit: dominio y service | |
| Tipos (`*.test-d.ts`) | |
| Contrato (caja negra) | |
| Fuzz | |
| Integración | |
| Componente | |
| E2E | |
| Criterios de aceptación → test | |

## Riesgos y decisiones

<Riesgos, alternativas consideradas, si hace falta ADR.>