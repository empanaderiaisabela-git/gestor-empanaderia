# 0003 — Reglas estrictas en código nuevo, con una lista legacy que sólo se achica

- **Estado**: Aceptado (2026-10-24)

## Contexto

`AGENTS.md` fija reglas duras: 100 líneas por archivo, funciones de 40 líneas y 3 parámetros como máximo, cero
comentarios, sin `any`, `!` ni `as`, tipos de retorno explícitos, sin SQL plano y capas
`ui → actions → services → repository → db`. El código heredado de ArgenStock viola casi todas: al activarlas, 142
archivos de código y `globals.css` tienen errores. Corregirlos de una vez es un refactor enorme y fuera del alcance
del backlog. No activarlas deja que el código nuevo repita los mismos problemas.

## Decisión

- **ESLint** (`eslint.config.mjs` + `eslint/`) hace cumplir las reglas en todo el código:
  - Para todos los archivos de código: `max-lines` 100 (líneas físicas), `max-lines-per-function` 40, `max-params`
    3 y la regla local `local/no-comments`.
  - Para TypeScript: `no-explicit-any`, `no-non-null-assertion`, `consistent-type-assertions: never` (permite
    `as const`) y `explicit-module-boundary-types`.
  - `no-restricted-imports`: `sql` de Drizzle y `pg` fuera de `schema.ts`, `src/lib/db/index.ts` y `src/test/`, más
    las capas de `docs/architecture.md`, definidas por carpeta.
- **Comentarios**: la única excepción de `AGENTS.md` (un *por qué* en español que el código no puede expresar) se
  marca empezando el comentario con `Por qué:`. Las directivas `eslint-disable` también son comentarios, así que en
  código nuevo no hay forma de apagar una regla desde el archivo.
- **Tests**: no tienen `max-lines-per-function`, porque los `describe` son estructura y no lógica. El tope de 100
  líneas por archivo y `max-params` sí aplican.
- **CSS**: ESLint no lo analiza; `scripts/line-limit.mjs` controla el tope de 100 líneas (se corre con `npm run lint`).
- **Lista legacy**: `eslint-legacy.json` contiene los archivos que ya violaban alguna regla al activarlas. En esos
  archivos se apagan **sólo** las reglas nuevas; las de antes (Next, React Hooks) siguen activas.
- **La lista sólo se achica**: `scripts/legacy-check.mjs <ref>` (`npm run lint:legacy`) falla si la lista tiene
  entradas que no estaban en `<ref>`, si hay repetidas o si apunta a archivos que ya no existen. El CI lo corre contra
  el commit anterior del push.
- **Hooks (lefthook)**: `pre-commit` bloquea los `.env` reales (sólo se versionan `.env.example` y `.env.test`), corre
  ESLint sobre los archivos en stage, controla el tope de los `.css` y corre el typecheck. `commit-msg` corre
  commitlint (Conventional Commits). `pre-push` corre `test:coverage` y `skills:check`.
- **CI** (`.github/workflows/ci.yml`), en cada push a `develop` y `main`: lint, lista legacy, typecheck,
  `skills:check`, cobertura, integración contra un Postgres de servicio y `next build` contra `db-test`.

## Alternativas descartadas

- **Corregir todo el código heredado ahora**: son 142 archivos; sería un refactor sin ítem en el backlog y con mucho
  riesgo de romper comportamiento.
- **`eslint-disable` por archivo en el código heredado**: llena el código de comentarios, que es justamente una de las
  reglas.
- **Activar las reglas como `warn`**: los avisos se ignoran, y el código nuevo no quedaría protegido.
- **`eslint-plugin-boundaries` para las capas**: suma una dependencia; `no-restricted-imports` por carpeta alcanza.

## Consecuencias

- Cuando un ítem toca un archivo heredado, lo corrige y lo saca de la lista. Si no lo saca, la lista no crece igual.
- Un archivo nuevo nunca entra a la lista: tiene que cumplir las reglas desde el primer commit.
- `src/test/eslint-rules.test.ts` verifica cada regla con fragmentos de código, para que un cambio en la config no
  las apague sin que nadie se entere.
- El CI necesita Node 22. El E2E se suma al CI en T-6 y la mutación en T-5.
