# Plan: BUG-19 — Los mensajes dicen "el/la" y "registrado/a"

- **Ítem del backlog**: BUG-19
- **Autor**: Agente · **Fecha**: 2026-10-26 · **Estado**: Aprobado por el dev (2026-10-26)
- **Rama**: `fix/bug-19-mensajes-con-articulo`

## Objetivo

Que los mensajes que ve el usuario se lean como frases normales en español, sin "el/la" ni "registrado/a".

## Causa

Las plantillas de `src/config/messages.ts` reciben sólo el nombre de la entidad ("venta", "Tarjeta") y, para no
elegir el género, escriben las dos formas: "el/la", "registrado/a", "seleccionado".

## Cambio

| Plantilla | Antes | Después |
|---|---|---|
| `GENERIC` | al procesar el/la venta | al procesar la venta |
| `NOT_FOUND` | El/la tarjeta seleccionado ya no existe. | La tarjeta ya no existe. |
| `CREATED` · `UPDATED` · `DELETED` | Tarjeta registrado/a exitosamente | Se registró la tarjeta · Se actualizó… · Se eliminó… |
| `ACTIVATED` · `DEACTIVATED` | Tarjeta activado/a exitosamente | Se activó la tarjeta · Se desactivó… |
| `REACTIVATED` | El/la Proveedor ya existía (inactivo)… | Se reactivó el proveedor que ya existía, con los datos nuevos |

- La entidad llega con su artículo y en minúscula: 'la venta', 'el producto', 'la foto', 'los precios del grupo',
  'la tarjeta', 'el plan de cuotas', 'la promoción', 'el proveedor', 'el gasto', 'el cliente', 'el usuario',
  'el panel de estadísticas'.
- `DEFAULT_ENTITY` (`src/lib/errors/codes.ts`) pasa a 'el registro'.
- No cambian las entidades del log de auditoría ('SALE', 'MENU_ITEM'…) ni `INSUFFICIENT_STOCK`, que nombra el gusto.

## Errores

No hay códigos nuevos: cambia sólo el texto de los existentes.

## Tests

| Tipo | Casos |
|---|---|
| Unit | `src/config/messages.test.ts`: cada plantilla con 'la tarjeta' y 'el proveedor'; ninguna deja "el/la" ni "/a". `errors.test.ts`: sin entidad dice "El registro ya no existe." |
| Contrato, componente y E2E | Esperan los textos nuevos (card, expense, menu, order, promotion, provider, stats, stock y 6 E2E). |

## Riesgos

- Mucho cambio mecánico en tests: se hace con reemplazos exactos y se revisa el diff completo.
