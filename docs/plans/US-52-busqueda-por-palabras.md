# Plan: US-52 — Búsqueda por palabras en Stock y en "Buscar gusto"

- **Ítem del backlog**: US-52
- **Autor**: Claude Code · **Fecha**: 2026-11-01 · **Estado**: Aprobado por el dev (2026-11-01)
- **Rama**: `feat/us-52-busqueda-por-palabras`
- **Nivel de tests**: 2 · lógica acotada

## Objetivo

Hoy el buscador de Stock y "Buscar gusto" de Ventas buscan la frase entera: "empanada carne" no encuentra
"Empanada de carne". El cliente está acostumbrado al gestor de LAN, donde cada palabra se busca por separado. Se
copia ese criterio: aparece lo que tiene **todas** las palabras, en cualquier orden.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Qué buscadores cambian? | Stock y "Buscar gusto" de Ventas. Logs queda igual. | dev, 2026-11-01 |
| ¿Cómo se busca? | Se separa lo escrito por espacios; cada palabra tiene que estar en el nombre, en cualquier orden, también como parte de una palabra ("emp" encuentra "Empanada"). Sin distinguir mayúsculas ni acentos. | dev (igual que LAN) |
| ¿Qué rol? | Los mismos de hoy; no cambian permisos. | código |
| ¿Concurrencia? | No: es un filtro en el cliente. | código |
| Carga / vacío / error | Sin cambios: búsqueda vacía muestra todo; sin coincidencias, los mensajes de hoy. | código |

**Preguntas abiertas**: ninguna.

## Cambios por capa

| Capa | Archivos | Responsabilidad |
|---|---|---|
| lib | `src/lib/utils.ts` | `matchesAllWords(text, search)`: normaliza los dos y exige que cada palabra esté en el texto. |
| domain | `src/features/order/domain/flavor-list.ts` | `visibleFlavors` usa `matchesAllWords`. |
| ui | `src/features/stock/ui/use-stock-panel.ts` | El filtro de Stock usa `matchesAllWords`. |

Sin schema, migración, repositorio, service ni actions.

## Errores

No hay acciones inválidas nuevas.

## Tests

| Tipo | Casos |
|---|---|
| Unit | `matchesAllWords`: orden distinto, texto en el medio, parte de palabra, acentos y mayúsculas, espacios de más, vacío ⇒ true, falta una palabra ⇒ false. Fuzz: la frase completa contenida siempre coincide. |
| Dominio | `flavor-list.test.ts`: "jamon rucula" y "crudo rucula" encuentran "RUCULA Y JAMÓN CRUDO"; "jamon pollo" no encuentra nada. |
| Componente | `stock-search.test.tsx`, sobre el hook `useStockPanel` (la grilla virtualizada no dibuja filas en jsdom): "empanada carne" muestra "Empanada de carne" y no "Empanada de pollo". |
| CA → test | CA-1 → unit + componente de Stock · CA-2 → dominio de `flavor-list`. |

## Riesgos y decisiones

- Al ser más amplia, una búsqueda puede traer algún resultado de más; es lo que pidió el cliente.
- Una sola función compartida evita copiar el criterio en cada buscador; los demás paneles (que ya buscan por
  palabras) se pueden pasar a ella más adelante, fuera de este ítem.
