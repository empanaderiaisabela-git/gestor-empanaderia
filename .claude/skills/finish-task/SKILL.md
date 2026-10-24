---
name: finish-task
description: Use when a task in the gestor-empanaderia repo seems done, BEFORE claiming completion, committing the final changes. Walks the Definition of Done, runs the full verification suite, updates docs and the backlog, and prepares the push.
---

# finish-task — cerrar una tarea en gestor-empanaderia

No declares la tarea terminada hasta que **todos** los ítems estén verificados con evidencia (salida de
comandos), no con suposiciones.

## 1. Código

- [ ] Cada archivo tiene una sola responsabilidad.
- [ ] Cero comentarios (salvo un *por qué* imposible de expresar en código, en español).
- [ ] Sin `any`, `!`, `as` injustificados; tipos de retorno explícitos en exports.
- [ ] Capas respetadas: `ui → actions → service → repository → db`; sin SQL plano.
- [ ] Toda Server Action nueva verifica sesión y rol en el servidor; toda página nueva está en `src/proxy.ts`.
- [ ] Tablas mutables nuevas con `version`; updates/deletes filtran por versión.

## 2. Errores

- [ ] Cada acción inválida está en el catálogo con mensaje claro en español.
- [ ] Tabla *acción inválida → code → mensaje* en `docs/features/<feature>/README.md`.
- [ ] Un test por fila (contrato para la action, componente para la UI). El fuzz no produce errores fuera del
      catálogo.

## 3. Tests y gates

Corré y mostrá la salida de:

```bash
docker compose up -d db-test
npm run verify
```

- [ ] Unit, contrato, fuzz, integración (si tocó repositorio/schema) en verde.
- [ ] Cobertura ≥ 90% líneas/funciones/statements y ≥ 85% branches.
- [ ] Mutación ≥ 70%.
- [ ] Si se arregló un bug: test `regression BUG-N: …` que fallaba antes del fix.

## 4. Documentación

- [ ] `docs/features/<feature>/README.md` refleja el comportamiento vigente.
- [ ] ADR nuevo si hubo una decisión de arquitectura (`docs/templates/adr.md`).
- [ ] `.env.example`, seed y README actualizados si cambió la configuración o los datos base.
- [ ] Migración generada con nombre descriptivo si cambió el schema.
- [ ] `docs/initial_prompt.md` adaptado y con la fecha al día si fue un avance significativo: cualquier cambio
      que vuelva falsa una línea del prompt (criterios en `docs/how-to-document.md`).

## 5. Backlog y PR

- [ ] `BACKLOG.md`: cada criterio de aceptación con su fecha y hora de cierre (hora de Argentina,
      `AAAA-MM-DD HH:MM`), **horas reales** del ítem, estado `En revisión` y link al PR.
- [ ] Commits en Conventional Commits (español, scope = feature, footer `Refs: <ID>`).
- [ ] Antes de commitear, mostrale al dev una **lista breve en lenguaje simple**, para alguien sin conocimientos
      técnicos, de todo lo esencial que entra en el commit: qué es, por qué importa, adónde va y qué **no** entra.
      Esa lista es lo que el dev aprueba. Los controles técnicos van después, separados.
- [ ] push a `develop` con la plantilla completa explicando que se hizo .