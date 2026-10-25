# 0004 — Revalidación a demanda del catálogo público

- **Estado**: Aceptado (2026-10-25)

## Contexto

`/home` (catálogo público) exportaba `revalidate = 30`. Es ISR por tiempo: después de 30 s, la primera visita
dispara una regeneración y cada regeneración es una escritura de ISR en Vercel. El cliente pidió quitarlo porque
"consume muchísimo ISR Writing" (`specs.md`). Además, hoy el sitio web no es prioridad.

`/product/[id]` ya es dinámica (se renderiza en cada pedido): no usa ISR.

## Decisión

- `/home` deja de exportar `revalidate`. Sin datos dinámicos, Next la prerenderiza en el build y la sirve **sin
  vencimiento**.
- La regeneración es **a demanda**: `src/lib/catalog-cache.ts` expone `revalidateCatalog()` (llama a
  `revalidatePath('/home')`) y `afterCatalogChange(result)`, que invalida sólo si la mutación salió bien.
- Invalidan el catálogo todas las mutaciones que cambian lo que muestra: alta, edición y borrado de productos,
  visibilidad, mermas, fotos, categorías, ventas y anulaciones (el catálogo marca "sin stock"). Un test de
  integración verifica cada una.
- Se usa `revalidatePath` y no etiquetas (`unstable_cache` + `revalidateTag`, o Cache Components con `'use cache'`):
  hay una sola página cacheada y así no hace falta envolver las lecturas.

## Alternativas descartadas

- **Render dinámico (`force-dynamic`)**: cero escrituras de ISR, pero cada visita consulta Supabase.
- **Cache Components (`cacheComponents`, `'use cache'`, `updateTag`)**: es el modelo nuevo de Next 16, pero cambia
  el render de toda la app. Se evalúa con un ADR propio si hace falta más caché.
- **Apagar el catálogo**: el dev prefirió conservarlo.

## Consecuencias

- Como mucho, hay una regeneración por cada cambio que alguien llegue a ver: si nadie visita el catálogo, no hay
  escrituras.
- Un cambio hecho por fuera de una action (un script o un `INSERT` a mano) **no** aparece en el catálogo hasta la
  próxima mutación o el próximo deploy. Los E2E crean o cambian los datos por la UI.
- Toda mutación nueva que cambie lo que muestra el catálogo tiene que llamar a `revalidateCatalog()`. Para el modelo
  nuevo de la empanadería lo hace T-12.
