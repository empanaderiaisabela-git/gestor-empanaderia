# Plan maestro: Actualización 3 · Comanda para la térmica y gustos agrupados en el carrito

- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-11-05 · **Estado**: aprobado por el dev (2026-11-05)
- **Ítems**: US-64, US-65 y T-28 (`BACKLOG.md`, sección "Actualización 3").

## Contexto

Pedido del cliente, por el dev (2026-11-05, textual en `docs/requerimientos/specs.md`):

- El local compró una impresora térmica de 57 mm. En Ventas/Pedidos, al lado del comprobante, un botón más imprime la
  **comanda** de esa venta, con el formato del ejemplo que pasó el dev.
- En el carrito, ½ docena de Jamón y queso más 1 unidad de Jamón y queso quedan en **un solo ítem** de 7, con el precio
  de siempre (½ docena + 1 unidad).

## Decisiones del dev (2026-11-05)

| # | Pregunta | Respuesta |
|---|---|---|
| D-1 | Número de pedido | Correlativo que no se reinicia, de 6 dígitos: `#000143`. Lleva migración. |
| D-2 | "Paga con" y vuelto | Se saca esa línea: la comanda muestra sólo el medio de pago. |
| D-3 | Tipo sin envío | `RETIRA EN LOCAL`; con envío, `ENVIO A DOMICILIO`. |
| D-4 | Cómo se imprime | Desde el navegador: el botón abre el diálogo de impresión con la comanda de 57 mm y se confirma con Enter. |
| D-5 | Detalle de la orden | Un renglón por gusto ("7x JAMON Y QUESO $9.700"); en una surtida o una promo, el precio va sólo en el primero. |
| D-6 | "−" y "+" del ítem agrupado | "+" suma 1 unidad (7 → 8: ½ docena + 2 unidades). "−" saca primero las unidades sueltas y después la ½ docena entera (7 → 6 → vacío). |
| D-7 | Autonomía | Commit, merge squash y push a `develop` sin frenar. Antes de `main`, el dev migra Supabase (pasa a 34); recién ahí merge, tag `actualizacion-3` y push. |

## US-64 · Gustos iguales en un solo ítem del carrito

- Se agrupan los renglones completos de **un solo gusto**, del mismo grupo y con el mismo jamón extra, aunque sean de
  presentaciones distintas. Las surtidas y las mitad y mitad no se juntan. En la práctica pasa en Empanadas y
  Sándwich de miga, los grupos con varias presentaciones.
- Es sólo cómo se muestra y se edita en el carrito: por dentro siguen siendo los renglones de siempre (½ docena + 1
  unidad), así que el precio, el stock, el cobro y el comprobante no cambian.
- `domain/order-groups.ts`: `groupLines(lines)` arma las filas; `unitPresentationOf(group)` es la presentación de 1
  unidad. Store: `addUnit(groupKey)` y `removeLast(groupKey)` (D-6). UI: `grouped-line-row.tsx` en `order-table.tsx`.
- Nivel 2: lógica acotada del carrito.

## US-65 · Comanda de 57 mm

- **Número de pedido** (D-1): `sales.order_number serial` único, migración 0033, sólo aditiva. Las ventas que ya
  existen reciben su número al migrar, en el orden en que están guardadas.
- **Datos**: el historial (`sale-history.repository.ts`) suma a cada venta su `orderNumber` y a cada línea el nombre de
  la promo y sus gustos con unidades (`sale_line_items` + `menu_items`, sin las bases).
- **Texto**: `domain/comanda.ts`, función pura `buildComanda(sale)` que devuelve los renglones de 32 caracteres del
  ejemplo. Los gustos iguales de renglones distintos se juntan (7x JAMON Y QUESO). Si hay descuento, sale el renglón
  `DESCUENTO`, para que el total cierre.
- **Impresión** (D-4): `ui/print-comanda.ts` abre una ventana nueva con la comanda en monoespaciada, a 48 mm (el ancho
  imprimible del rollo de 57 mm), sin márgenes, y llama a `print()`. El texto va con `textContent`, nunca como HTML.
- **Botón**: "Imprimir comanda" al lado de "Ver comprobante", en la grilla y en las tarjetas; lo ven el admin y el
  vendedor.
- Nivel 3: migración y lectura de ventas.

## Decisiones provisorias del agente

| # | Pregunta | Qué se eligió y qué cambia si el dev dice otra cosa |
|---|---|---|
| P-1 | Con un renglón por gusto, "JAMON Y QUESO" puede ser una empanada o una ciabatta. ¿Cómo lo distingue la cocina? | Antes de los gustos de cada grupo va su nombre en un renglón ("EMPANADAS", "CIABATTAS"), y las promos con su nombre ("PROMO DOCENA + COCA"). Si no los querés, se sacan esos renglones. |
| P-2 | ¿Mayúsculas sin tildes, como el ejemplo? | Mayúsculas en los títulos y los gustos, con tildes: la térmica imprime por el driver de Windows y las tildes salen bien. Los datos del cliente van como se cargaron. |
| P-3 | ¿Qué pasa con un domicilio largo? | Se parte en renglones de 32 caracteres; no se corta, porque lo necesita el cadete. |
| P-4 | ¿Y el título del envío ("Centro")? | No sale, como en el ejemplo: sólo el renglón `ENVIO` con su monto. |
| P-5 | Sin envío, ¿el título del bloque? | `[ DATOS DEL CLIENTE ]`; con envío, `[ DATOS DEL CLIENTE / ENVIO ]`. Sin teléfono o sin domicilio, ese renglón no sale. |
| P-6 | ¿Cómo se ven la mitad y mitad y el jamón extra? | "1/2x MUZZA" y "1/2x NAPOLITANA", y "+ JAMON EXTRA" debajo del gusto que lo lleva. |

## Decisiones tomadas durante la implementación

(Se completan a medida que aparecen.)

## Resumen para el dev

(La lista simple de cada commit, a medida que se integra.)
