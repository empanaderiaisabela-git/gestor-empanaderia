# Plan: US-21 — Estadísticas como el panel de referencia

- **Ítem del backlog**: US-21
- **Autor**: Ignacio Tomas · **Fecha**: 2026-10-27 · **Estado**: Aprobado
- **Rama**: `feat/us-21-estadisticas-referencia`
- **Nivel de tests**: 2 · lógica acotada

## Objetivo

Que Estadísticas tenga la forma de `referencia-de-otro-sistema.png`: comidas arriba, ventas y ganancia debajo, medios
de pago con fondo de color. Sólo presentación.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Qué sale? | La descripción de la jornada, "Dinero generado por comida", "Total facturado" y la aclaración de la ganancia | Dev, Sprint 3 |
| ¿Cómo se ven? | Borde de color y fondo neutro; medios de pago con fondo de color | Dev, Sprint 3 |
| ¿Hay reglas de negocio nuevas? | No. `revenue` sigue en el service porque la ganancia lo usa | Dev |

## Cambios por capa

| Capa | Archivos a crear/modificar | Responsabilidad |
|---|---|---|
| estilos | `src/app/group-colors.css`, `src/app/stat-colors.css`, `src/app/globals.css` | Tokens `accent` por grupo; colores de Promos, Ganancia, Ventas y medios de pago |
| config | `src/config/group-theme.ts`, `src/config/stat-theme.ts` | Clases de borde, cuadrito del ícono y fondos |
| ui | `kpi-card.tsx`, `workday-kpis.tsx`, `stats-panel.tsx` | Filas de 4, 3 y 2; íconos `Banknote`, `Briefcase`, `Landmark`, `Wallet`, `CreditCard` |
| página | `src/app/(main)/page.tsx` | Sin descripción |

## Tests

| Tipo | Casos |
|---|---|
| Contraste | `stat-colors-contrast.test.ts`: texto AA (4.5:1) en los medios de pago y bordes/íconos 3:1, en claro y oscuro |
| Componente | `stats-panel.test.tsx`: orden de las tarjetas, "Ganancia", sin "Total facturado" ni "Dinero generado por comida" |
| E2E | `estadisticas.spec.ts`: comidas arriba de Ventas registradas; `tablero-ventas.spec.ts` sigue en verde |

## Riesgos y decisiones

- Los colores `accent` son más fuertes que los `edge` para que el borde se distinga (3:1) del fondo.
- Cada fila es su propia grilla (`xl:grid-cols-4/3/2`) en lugar de una de 12 columnas: mismo resultado, menos clases.
