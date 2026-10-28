# Plan: US-20 — Íconos de lucide por grupo en Ventas y Estadísticas

- **Ítem del backlog**: US-20
- **Autor**: Ignacio Tomas · **Fecha**: 2026-10-27 · **Estado**: Aprobado
- **Rama**: `feat/us-20-iconos-lucide`
- **Nivel de tests**: 2 · lógica acotada

## Objetivo

Reemplazar los emojis de cada grupo y de Promos por íconos de `lucide-react`, en el tablero de Ventas y en
Estadísticas, definidos en un solo lugar. Revierte US-15 CA-2.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Qué íconos? | Pizza, Sandwich, CanSoda (Coca-Cola y Pepsi), HandCoins (Promos) | Dev, Sprint 3 |
| ¿Y Empanadas y Ciabattas? | Íconos propios al estilo lucide, a partir de los PNG del dev | `docs/wireframes-ventas-gestor/` |
| ¿Hay reglas de negocio nuevas? | No, sólo presentación | Dev |

## Cambios por capa

| Capa | Archivos a crear/modificar | Responsabilidad |
|---|---|---|
| dependencias | `package.json`, `package-lock.json` | `lucide-react` a `^1.61.0` (trae `CanSoda`) |
| config | `src/config/group-theme.ts` | `emoji` pasa a `icon: LucideIcon` |
| componentes | `src/components/icons/empanada.ts`, `ciabatta.ts` | `createLucideIcon`, viewBox 24, trazo 2, sin relleno |
| ui | `group-card.tsx`, `promo-card.tsx`, `kpi-card.tsx`, `workday-kpis.tsx` | Dibujan el ícono (`aria-hidden`) en lugar del emoji |

## Tests

| Tipo | Casos |
|---|---|
| Componente | `icons.test.tsx`: los dos íconos propios dibujan un `svg` con las clases de lucide |
| Componente | `group-card.test.tsx`: cada tarjeta lleva su `svg` de lucide |
| Contraste y config | `group-colors-contrast.test.ts`: el ícono de cada grupo |
| E2E | `tablero-ventas.spec.ts`: color e ícono por grupo; `estadisticas` y `promo-venta` siguen en verde |

## Riesgos y decisiones

- Los íconos propios se simplifican respecto de los PNG para que se lean a 20-24 px.
