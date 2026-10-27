# Definition of Ready y Definition of Done

## Definition of Ready (para empezar un ítem)

Un ítem del backlog se puede tomar cuando:

- [ ] Tiene ID, historia ("Como… quiero… de forma que…") y criterios de aceptación, cada uno con su
      estimación: tiempo total hasta cerrarlo, incluida la revisión del dev (ver "Cómo se estima" en
      `BACKLOG.md`).
- [ ] Sus dependencias están en `Hecho`.
- [ ] Las preguntas de descubrimiento (`workflow.md` §2) están respondidas o registradas como "Preguntas
      abiertas" que no bloquean el inicio.
- [ ] Existe un plan aprobado en `docs/plans/<ID>-<slug>.md`.

## Definition of Done (para cerrarlo)

### Código
- [ ] Respeta todas las reglas duras de `AGENTS.md` (cero comentarios, tipado estricto, capas,
      sin SQL plano, restricciones en el schema, concurrencia optimista).
- [ ] Componentes y funciones con una sola responsabilidad; lo reutilizable está en `src/components/ui`,
      `src/hooks` o `src/lib` y no duplicado.

### Errores
- [ ] Cada acción inválida tiene código en el catálogo y mensaje claro en español.
- [ ] La tabla *acción inválida → code → mensaje* está en `docs/features/<f>/README.md`, con un test por fila.
- [ ] La UI muestra estados de carga, vacío y error; ningún error deja la pantalla en blanco.

### Tests
- [ ] Unit + contrato + fuzz para la lógica nueva; integración si cambió un repositorio o el schema; regresión si es
      un bug.
- [ ] Cada criterio de aceptación tiene su test.
- [ ] Los tests del nivel del ítem en verde (`testing.md` § Nivel de tests). En nivel 3, `npm run verify`: cobertura
      ≥ 90/85, mutación ≥ 70, build OK.
- [ ] Al cerrar el sprint: `npm run verify` y todos los E2E en verde, sin importar el nivel de los ítems.

### Documentación
- [ ] `docs/features/<f>/README.md` actualizado (comportamiento vigente, Server Actions, pantallas, roles).
- [ ] ADR si hubo una decisión de arquitectura.
- [ ] Migración con nombre descriptivo si cambió el schema; seed actualizado si hacen falta datos de demo.
- [ ] `.env.example` y `README.md` actualizados si cambió la configuración o el setup.
- [ ] `docs/initial_prompt.md` adaptado (con la fecha de la foto al día) si fue un avance significativo
      (criterios en `docs/how-to-document.md`).

### Proceso
- [ ] `BACKLOG.md`: cada criterio con su fecha y hora de cierre (hora de Argentina), **horas reales** del ítem y
      estado.
- [ ] Commits Conventional Commits. Sin PR: con el OK del dev, merge squash local a `develop`, push y CI verde.
- [ ] Aprobado por el dev. Recién ahí el estado pasa a `Hecho`.