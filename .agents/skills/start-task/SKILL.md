---
name: start-task
description: Use BEFORE writing any code in the gestor-empanaderia repo — when starting a user story, enabler, bug fix or any new task. Runs the mandatory discovery questions, checks the backlog, and produces an approved plan in docs/plans/ before implementation.
---

# start-task — arrancar una tarea en gestor-empanaderia

Seguí estos pasos **en orden**. No escribas código de producción hasta completar el paso 5.

## 1. Contexto obligatorio

Leé `AGENTS.md`, `docs/workflow.md`, `docs/architecture.md` y, si existe, `docs/features/<feature>/README.md`.

## 2. Ubicar la tarea en el backlog

- Buscá el ítem en `BACKLOG.md` (ID `US-N`, `T-N` o `BUG-N`).
- Si no existe: pedile al dev los datos y agregalo antes de seguir.
- Verificá que sus dependencias estén en `Hecho`. Si no, avisá y frená.

## 3. Descubrimiento

Hacele al dev las preguntas de `docs/workflow.md` §2 que **no** estén respondidas por la US, las specs
(`docs/requerimientos/specs.md`) o la doc del feature. Agrupalas en un solo mensaje, numeradas. Como mínimo cubrí:

1. Rol que ejecuta cada acción y qué pasa con los demás roles.
2. Campos de entrada/salida con tipo, obligatoriedad, largo, formato, rango y unicidad.
3. Acciones inválidas → código de error y mensaje en español.
4. Concurrencia (¿dos personas editando lo mismo?) y fechas (¿qué zona horaria se muestra?).
5. Estados de UI: carga, vacío, error.
6. Criterios de aceptación medibles.

Las dudas de negocio que el dev no pueda responder van a "Preguntas abiertas" del ítem en `BACKLOG.md`. 
No inventes reglas de negocio.

## 4. Plan

Copiá `docs/templates/plan.md` a `docs/plans/<ID>-<slug>.md` y completalo: cambios por capa
(domain → repository → service → actions → ui), tabla de errores, restricciones de DB, tests por tipo, riesgos, archivos a crear/modificar
(respetando 100 líneas por archivo y responsabilidad única).

## 5. Aprobación

Mostrale el plan al dev y **esperá su aprobación explícita**. Con la aprobación:

- `BACKLOG.md`: estado `En progreso`, dueño, fecha de inicio.
- Rama desde `develop`: `feat/<id>-<slug>` (ver `docs/git.md`).
- Implementá con TDD siguiendo el orden de `docs/workflow.md` §5 (skill `test-driven-development`).