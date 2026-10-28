# Plan: T-16 — Skill para delegar en subagentes según el costo

- **Ítem del backlog**: T-16
- **Autor**: Agente · **Fecha**: 2026-10-26 · **Estado**: Aprobado
- **Rama**: `chore/t-16-delegate-task`

## Objetivo

Que el agente reparta el trabajo entre subagentes baratos (tareas simples) y caros (tareas difíciles), para que lo
simple no gaste como lo difícil. Es una skill propia, `delegate-task`, sin cambios de código.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente (US, dev, cliente) |
|---|---|---|
| ¿Dónde vive? | Sólo en este proyecto: `.agents/skills/` y su copia en `.claude/skills/` | dev |
| ¿Cuántos niveles? | Tres: Haiku, Sonnet y Opus. Opus es el techo, también al escalar | dev |
| ¿Otros modelos? | No. Cualquier modelo por encima de Opus está prohibido: fuera de todo presupuesto | dev |
| ¿Cómo se arman los niveles? | Sólo la skill: usa `Explore`, `Plan` y `general-purpose` y pasa `model` y `effort` en cada llamada | dev |
| ¿Cuándo se usa? | Con `/delegate-task` y también sola, cuando el trabajo se puede repartir | dev |

**Preguntas abiertas**: ninguna.

## Cambios por capa

No aplica: no hay código. Archivos:

| Archivo | Cambio |
|---|---|
| `.agents/skills/delegate-task/SKILL.md` | Nuevo: la skill (fuente) |
| `.claude/skills/delegate-task/SKILL.md` | Copia exacta con `npm run skills:sync` |
| `AGENTS.md`, `docs/workflow.md` §8, `docs/initial_prompt.md` §9 | La listan entre las skills propias |
| `BACKLOG.md` | Ítem T-16 y su fila en el resumen del Sprint 2 |

## Restricciones de base de datos

No aplica.

## Errores

No aplica.

## Tests

| Tipo | Casos |
|---|---|
| Unit, tipos, contrato, fuzz, integración, componente, E2E | No aplica: no hay código |
| Criterios de aceptación → verificación | CA-1: lectura de la skill y `grep` sin modelos fuera de los tres. CA-2: `npm run skills:check`. CA-3: prueba real con `/delegate-task` sobre una tarea de sólo lectura |

## Riesgos y decisiones

- **Delegar de más.** Cada subagente arranca sin contexto: una tarea chica delegada puede costar más que hacerla
  directo. La skill pide no delegar lo que se resuelve en 3 llamadas o menos.
- **Barato que falla no es barato.** Se reintenta una sola vez, en el nivel siguiente; si falla Opus, se frena.
- **`fork` no abarata**: corre siempre con el modelo del agente principal. La skill lo prohíbe para bajar costos.
- **Otras herramientas** (OpenCode, Antigravity) leen `.agents/skills/`: la skill usa la herramienta Agent de
  Claude Code y les indica aplicar la misma clasificación con lo que tengan.
- Sin ADR: es una skill de trabajo, no una decisión de arquitectura.
