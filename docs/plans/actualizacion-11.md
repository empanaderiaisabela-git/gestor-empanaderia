# Plan: Actualización 11 · US-71 — Buscar por cualquier columna de la grilla

- **Autor**: Agente · **Fecha**: 2026-11-13 · **Estado**: Aprobado (dev, 2026-11-13)
- **Ítem**: US-71 (nuevo), sección nueva **Actualización 11 · Buscadores** en `BACKLOG.md`.
- **Rama**: `feat/us-71-buscadores` desde `develop`.
- **Nivel de tests**: 2 (lógica acotada), **sin tests nuevos** por decisión del dev (D-9): lo prueba él a mano. Corren
  lint, typecheck y la suite unit y de componente (`npm run test:coverage`). Los E2E que usan los textos viejos de los
  buscadores se actualizan, pero no se agregan casos.
- **Fuera del commit**: el cambio sin commitear de `src/features/menu/ui/menu-item-fields.tsx` no es de este ítem. No
  se toca.

## Objetivo

Hoy cada buscador mira una o dos columnas: en Ventas/Pedidos, sólo el comprador y el vendedor; en Stock, sólo el
nombre. El dev quiere escribir cualquier dato que ve en la grilla y encontrar la fila, salvo las fechas.

## Decisiones del dev (2026-11-13)

| # | Pregunta | Respuesta |
|---|---|---|
| D-1 | ¿Dónde se registra? | US-71, en una Actualización 11 · Buscadores. |
| D-2 | ¿Cómo se busca? | Como US-52: todas las palabras, en cualquier orden, sin mayúsculas ni acentos. Cada palabra puede estar en una columna distinta: "juan carne" encuentra la venta de Juan con empanadas de carne. |
| D-3 | ¿Montos y stock? | Como se ven, sin "$" ni punto de miles: "12500", "12.500" y "$12.500" encuentran lo mismo. Costo aceptado: "15" también encuentra "1.5L". |
| D-4 | ¿Etiquetas de estado? | Se buscan, porque se ven: "Pendiente", "Inactivo", "Inactiva", "En catálogo", "Sin stock", "Sin precio", "Sin costo". |
| D-5 | ¿Auditoría? | Afuera: ya busca en el servidor por Operador, Acción, Entidad y Referencia. |
| D-6 | ¿"Buscar gusto" de Ventas y catálogo público? | Afuera: no son grillas. |
| D-7 | ¿Roles? | Cada rol busca sólo en lo que ve: el vendedor no encuentra por costo en Stock. |
| D-8 | ¿Textos de los buscadores? | El texto corto del celular en todas las pantallas ("Buscar ventas...", "Buscar gastos..."). |
| D-9 | ¿Criterio de rendimiento y tests? | No: ni criterio de 100 ms ni tests nuevos. El dev lo prueba a mano. |

Descubrimiento que no cambia nada: no hay datos nuevos, errores, base ni concurrencia (es un filtro en memoria del
navegador). Carga, vacío y error siguen como están: cada grilla ya tiene su mensaje de "no hay resultados".

## Qué busca cada grilla

| Grilla | Hoy | Con US-71 (además de lo de hoy) |
|---|---|---|
| Ventas/Pedidos | Comprador, Vendedor | Pedido (`describeSaleLine`), Pago (`describePayment` o "Pendiente"), Desc. ("-10%", "-$500"), Total |
| Stock | Nombre | Categoría, Stock ("Sin stock" o el número), Precio de venta (cada presentación con su precio, o "Sin precio"), Costo ("Sin costo"; sólo admin, D-7) |
| Alta de productos | Nombre | Grupo, Stock, "Inactivo", "En catálogo" |
| Promociones | Nombre | Contenido (`describeComponents`), Precio de venta, "Inactiva" |
| Tarjetas | Nombre | Planes de cuotas (`describePlans`), "Inactiva" |
| Envíos | Título, Detalle | Monto, "Inactivo" |
| Gastos | Número, Título, Proveedor | Monto |
| Clientes | Nombre, Documento, Teléfono, Email | Domicilio, "Inactivo" |
| Proveedores | Empresa, Teléfono, Correo | "Inactivo" |
| Usuarios | Usuario, Rol | "Inactivo" |

## Cambios

Un solo cambio de regla, en el lugar que ya comparten los buscadores, y en cada grilla el texto que muestra.

| Capa | Archivo | Cambio |
|---|---|---|
| lib | `src/lib/utils.ts` | `matchesAllWords` ignora "$" y "." en el texto y en la búsqueda (D-3). Lo usan también Stock y "Buscar gusto": "1.5" sigue encontrando "1.5L". |
| ui · order | `src/features/order/ui/sale-history-filter.ts` | `filterSales` arma el texto con comprador, vendedor, pedido, pagos o "Pendiente", descuento y total, y usa `matchesAllWords`. |
| ui · stock | `src/features/stock/ui/stock-search.ts` (nuevo) | `stockSearchText(item, isAdmin)`: categoría, nombre, stock, precios y, sólo con `isAdmin`, el costo. `costText` se mueve acá desde `stock-columns.tsx`, que lo importa: un solo lugar para el texto del costo. |
| ui · stock | `src/features/stock/ui/use-stock-panel.ts` | Lee el rol de `useAuthStore` (como `stock-panel.tsx`) y filtra con `stockSearchText`. |
| ui · menu | `src/features/menu/ui/use-menu-panel.ts` | Grupo, nombre, stock, "Inactivo" y "En catálogo". |
| ui · promotion | `src/features/promotion/ui/use-promotions-panel.ts` | Nombre, contenido, precio y "Inactiva". |
| ui · card | `src/features/card/ui/use-cards-panel.ts` | Nombre, planes y "Inactiva". |
| ui · shipping | `src/features/shipping/ui/use-shippings-panel.ts` | Título, detalle, monto e "Inactivo". |
| ui · expense | `src/features/expense/ui/use-expenses-panel.ts` | Suma el monto. |
| ui · provider | `src/features/provider/ui/use-providers-panel.ts` | Suma "Inactivo". |
| página | `src/app/(main)/clientes/customer-panel.tsx` | Suma domicilio e "Inactivo". |
| página | `src/app/(main)/usuarios/user-panel.tsx` | Suma "Inactivo". |
| ui · textos (D-8) | `sale-history-panel.tsx`, `stock-panel.tsx`, `menu-toolbar.tsx`, `promotions-toolbar.tsx`, `cards-toolbar.tsx`, `shippings-panel.tsx`, `expenses-panel.tsx`, `providers-toolbar.tsx`, `customer-panel.tsx`, `user-panel.tsx` | `searchPlaceholder` pasa a ser el texto corto y se borra `searchPlaceholderMobile`. Auditoría no cambia (D-5). |
| E2E | `tests/*.spec.ts` y `tests/pages/` | Reemplazo mecánico de los textos viejos de los buscadores por los nuevos. |
| docs | `docs/features/<f>/README.md` | Donde dice por qué columnas busca cada grilla. |

Sin cambios en domain, errores, schema, repositorio, service ni actions. Sin migración: Supabase sigue igual.

Cada grilla sigue filtrando en su hook con `useMemo`, como hoy. Se descartó un `searchText` en `ColumnDef`: las
columnas se arman con las acciones de cada fila y el filtro vive en el hook, así que obligaba a mover código entre capas.

## Errores

No hay acciones inválidas: buscar no falla ni escribe nada.

## Tests

Sin tests nuevos (D-9). Tienen que seguir en verde:

| Tipo | Qué |
|---|---|
| Unit y fuzz | `matches-all-words.test.ts` (el fuzz usa sólo letras, así que ignorar "$" y "." no lo cambia) y los de cada filtro. Si alguno esperaba que una búsqueda **no** encontrara algo que ahora sí se ve en otra columna, se corrige el caso, no la regla. |
| Componente | Los de los paneles. |
| E2E | No se corren en el ítem; se corren al cerrar la Actualización. |

## Riesgos

- **Más resultados.** Buscar "carne" en Ventas/Pedidos ahora trae también las ventas con empanadas de carne, no sólo
  al comprador "Carne". Es lo pedido, pero cambia lo que el cliente ve.
- **"15" encuentra "1.5L"** (D-3), aceptado.
- Los archivos de Clientes y Usuarios ya pasan las 100 líneas: el cambio no les suma ninguna.
