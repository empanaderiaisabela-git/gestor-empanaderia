# Cómo documentar

La documentación vive en el repo, en Markdown y en español, y se actualiza **en el mismo push** que el código.
Si el código y la doc se contradicen, el push no está terminado.

## Qué va dónde

| Querés registrar… | Archivo | Plantilla |
|---|---|---|
| Reglas que todo agente/dev debe cumplir | `AGENTS.md` (resumen) + `docs/conventions/*.md` (detalle) | — |
| Cómo levantar el proyecto | `README.md` | — |
| Contexto completo para un agente que arranca sin contexto | `docs/initial_prompt.md` (se adapta en cada avance significativo, ver abajo) | — |
| Cómo está armado el sistema | `docs/architecture.md` | — |
| Cómo se trabaja (flujo, git, tests, DoD) | `docs/workflow.md`, `docs/git.md`, `docs/testing.md`, `docs/definition-of-done.md` | — |
| Comportamiento vigente de un feature | `docs/features/<feature>/README.md` | `templates/feature.md` |
| Una decisión de arquitectura | `docs/adr/NNNN-titulo.md` (+ fila en `docs/adr/README.md`) | `templates/adr.md` |
| El plan de una tarea | `docs/plans/<ID>-<slug>.md` | `templates/plan.md` |
| Estado de las tareas | `BACKLOG.md` | — |
| Dudas para el dev y sus respuestas | `docs/preguntas-dev.md` | — |
| Requerimientos del cliente, textuales | `docs/requerimientos/specs.md` (lo pegado no se edita; se interpreta en `BACKLOG.md`) | — |

## Mantener al día `docs/initial_prompt.md`

El prompt inicial es una foto del proyecto. Si queda viejo, el próximo agente arranca con un contexto falso. Por
eso **se adapta en cada avance significativo, en el mismo cambio** que lo produce, y se actualiza la fecha de la
foto.

Es un avance significativo cualquier cambio que haga falsa alguna línea del prompt. Por ejemplo:

- Cambia el estado del repo: primer commit, rama `develop`, `BACKLOG.md`, `.env.example`, CI.
- Se instala o se quita una herramienta: Vitest, Stryker, lefthook, commitlint, `db-test`, una dependencia
  importante.
- Se crea o cambia una capa o pieza transversal: `services`, el catálogo `AppError`, `formatDateTime`.
- Se adapta el dominio: se renombra algo heredado o se define una regla del rubro (docenas, gustos, recetas,
  pedidos).
- Se corrige una brecha o un problema de seguridad de los que lista el prompt.
- Cambia una regla de `AGENTS.md`, el flujo de trabajo o una skill propia.
- Se acepta un ADR.
- Cierra un sprint.

Si la tarea no tocó nada de eso, el prompt no se modifica. Lo que importa es que no mienta, no que crezca: se
resume y se enlaza al doc canónico en lugar de copiar el detalle.

## Crear la documentación de un feature nuevo

1. `mkdir docs/features/<feature>` (kebab-case, mismo nombre que la carpeta del código).
2. Copiá `docs/templates/feature.md` a `docs/features/<feature>/README.md` y completalo.
3. Si el feature crece, agregá archivos al lado (`api.md`, `pantallas.md`) y enlazalos desde el README.
4. Agregá el feature al índice de abajo.

## Estilo

- Español rioplatense neutro, frases cortas, en presente ("la API responde 409", no "respondería").
- Tablas para reglas, permisos y errores; bloques de código para comandos y ejemplos.
- Links relativos entre documentos. Nada de capturas de pantalla para cosas que se pueden escribir.
- Lo que el código ya dice (nombres de funciones, parámetros) no se repite en la doc: se describe el *qué* y el
  *por qué*.
