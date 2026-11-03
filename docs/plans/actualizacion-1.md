# Plan maestro: Actualización 1 · Envíos

- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-11-03 · **Estado**: aprobado por el dev (2026-11-03)
- **Ítems**: US-60, US-61, US-58, US-59 y T-27 (`BACKLOG.md`, sección "Actualización 1 · Envíos").

## Contexto

El cliente pidió la modalidad **Envíos** (`docs/requerimientos/specs.md`, "Pedido del cliente (2026-11-03),
Actualización 1"):

- Una pestaña nueva, "Envíos", entre Ventas/Pedidos y Promociones. "Nuevo envío" pide Título, Detalle (el alcance,
  por ejemplo "Barrio A hasta Barrio B") y Monto.
- En el carrito, abajo a la izquierda del pedido actual, un desplegable con los envíos disponibles. El elegido suma su
  monto al total del pedido.
- En Ventas, la tarjeta de Promos crece con cada promo y estira toda la página: tiene que scrollear por dentro,
  mostrando 3 promos y la mitad de la cuarta.
- El selector de gustos (por ejemplo, al armar una docena de empanadas) muestra todos los gustos: tiene que scrollear
  por dentro, mostrando 5 y la mitad del sexto, y el aviso de cuántas faltan tiene que ir en mayúscula y más grande.

Desde esta entrega no hay más sprints: el trabajo se agrupa en **Actualizaciones** numeradas. Cada una cierra con un
merge `develop → main` y el tag `actualizacion-N`.

**Restricción**: el sistema está en producción. La migración es sólo aditiva (D-5 de `sprint-6.md`): una tabla nueva y
tres columnas nuevas en `sales`, sin tocar datos. El agente migra la base local; Supabase la migra el dev.

## Decisiones del dev (2026-11-03)

| # | Pregunta | Respuesta |
|---|---|---|
| D-1 | ¿Quién administra Envíos? | Sólo el admin. El vendedor no ve la pestaña, pero elige el envío en el carrito. |
| D-2 | ¿El descuento alcanza al envío? | No: sólo a la comida. Comida $10.000, 10 % y envío $1.500 → $9.000 + $1.500 = $10.500. |
| D-3 | ¿Cómo cuenta en Estadísticas? | Es plata del local: suma a Ventas y a Ganancia en limpio, pero no a ninguna comida ni a Promos. |
| D-4 | ¿Domicilio con envío? | Obligatorio: con envío y sin domicilio, "Cobrar" queda deshabilitado y el servidor lo rechaza. |
| D-5 | Baja de un envío | Como Promociones: se desactiva (no aparece en el carrito); se borra sólo si nunca se usó en una venta. |
| D-6 | Campos | Título obligatorio y único (hasta 60), detalle opcional (hasta 150) y monto de $0 o más (envío gratis), con 2 decimales. |
| D-7 | Selector de gustos | El cambio vale para todos los grupos y las partes de las promos: es un solo componente. |
| D-8 | Registro | `BACKLOG.md` con la sección "Actualización 1 · Envíos"; cierre con merge `develop → main` y tag `actualizacion-1`. |
| Autonomía | Commits | Con los tests del nivel en verde, el agente commitea, integra a `develop` (merge squash) y pushea sin esperar el OK. La lista simple de cada commit queda en "Resumen para el dev". Lo roto no se pushea: queda anotado. `main` y el tag esperan el OK. |

## Orden y nivel de tests

| # | Ítem | Nivel | Rama |
|---|---|---|---|
| 1 | US-60 · Promos con scroll propio | 1 · estilo | `feat/us-60-promos-con-scroll` |
| 2 | US-61 · Selector de gustos con scroll y "FALTAN N" grande | 1 · estilo | `feat/us-61-selector-con-scroll` |
| 3 | US-58 · Envíos: pestaña y alta, edición y baja | 3 · schema y migración | `feat/us-58-envios` |
| 4 | US-59 · Envío en el carrito | 3 · cobro, cruza capas | `feat/us-59-envio-en-el-carrito` |
| 5 | T-27 · Cierre | `npm run verify` + E2E | — |

## US-58 · Envíos (feature nuevo `shipping`)

Copia la estructura de `promotion` y `provider` (el molde).

| Capa | Archivos | Responsabilidad |
|---|---|---|
| schema + migración | `src/lib/db/shipping-schema.ts`, columnas nuevas de `sales` en `schema.ts`, migración 0032 `envios` | `shipping_options`: `title varchar(60)` único, `detail varchar(150)` con `''` por defecto, `amount numeric(10,2)` con `check >= 0`, `is_active`, `version`. En `sales`: `shipping_option_id` (FK sin `onDelete`, bloquea el borrado), `shipping_title varchar(60)` y `shipping_amount numeric(10,2) not null default 0` con `check >= 0` |
| domain | `src/features/shipping/domain/shipping.schema.ts` | `shippingCreateSchema`, `shippingUpdateSchema`, toggle, delete y `shippingRowSchema` |
| repository | `shipping.repository.ts`, `shipping-unit-of-work.ts`, fake y suite de comportamiento en `testing/` | Drizzle, `version`, unidad de trabajo con auditoría |
| service | `shipping.service.ts` | Título único (`DUPLICATE`), `STALE_VERSION`, auditoría `SHIPPING` ("ENVÍO") |
| actions | `create-shipping.ts`, `update-shipping.ts`, `toggle-shipping-active.ts`, `delete-shipping.ts` (sólo admin), `fetch-shipping-options.ts` (cualquier sesión: el vendedor la usa en el carrito) | `ActionResult` |
| store y ui | `store/shipping.store.ts`, `ui/` (panel, toolbar, columnas, tarjeta, modal y campos) | Pantalla "Envíos" |
| página y navegación | `src/app/(main)/envios/page.tsx`, `src/config/navigation.ts` | "Envíos" entre Ventas/Pedidos y Promociones, sólo en el menú del admin; `proxy.ts` toma la lista de ahí |

## US-59 · Envío en el carrito

| Capa | Archivos | Responsabilidad |
|---|---|---|
| domain | `order/domain/checkout.schema.ts` | `shippingOptionId` opcional; con envío, el domicilio es obligatorio |
| repository | `checkout-unit-of-work.ts`, `sale-writer.repository.ts`, `sale-history.repository.ts`, `stats.repository.ts` | Leer el envío activo; guardar id, título y monto en la venta; leerlos en historial y Estadísticas |
| service | `checkout.service.ts`, `compute-workday-stats.ts` | `total = descuento(comida) + envío` (D-2), `NOT_FOUND` si el envío no está activo; las comidas se reparten `total − envío` (D-3) |
| store y ui | `order.store.ts`, `current-order.tsx`, `checkout-form.ts`, `checkout-modal.tsx`, `use-checkout.ts`, `sale-receipt.tsx` | Desplegable "Envío", total con envío, "Falta el domicilio", renglón "Envío" en el cobro y en el comprobante |

El monto del envío sale siempre de la base, nunca del navegador. Si el admin lo cambia con un carrito abierto, cobra el
servidor con el actual, como los precios. La anulación no cambia: el envío se va con la venta.

## US-60 y US-61

- `order/ui/promo-card.tsx`: la lista de promos con alto máximo y `overflow-y-auto`, para 3 promos y la mitad de la cuarta.
- `order/ui/flavor-picker.tsx`: la lista de gustos con alto máximo y `overflow-y-auto` (5 y media); el aviso de
  progreso pasa de `text-sm font-semibold` (14 px) a `text-xl font-black uppercase` (20 px).

## Errores

| Acción inválida | code | Mensaje |
|---|---|---|
| Título vacío / más de 60 | `VALIDATION` | "El título es obligatorio" / "El título no puede superar los 60 caracteres" |
| Título repetido | `DUPLICATE` | El del catálogo |
| Detalle de más de 150 | `VALIDATION` | "El detalle no puede superar los 150 caracteres" |
| Monto negativo / demasiado alto / con 3 decimales | `VALIDATION` | "El monto no puede ser negativo" / "El monto es demasiado alto" / "Máximo 2 decimales" |
| Editar o borrar con una versión vieja | `STALE_VERSION` | El del catálogo |
| Borrar un envío usado en ventas | `HAS_RELATIONS` | El del catálogo |
| El vendedor crea, edita o borra | `FORBIDDEN` | El del catálogo |
| Cobrar con un envío desactivado o borrado | `NOT_FOUND` | El del catálogo, con "el envío" |
| Cobrar con envío y sin domicilio | `VALIDATION` | "Anotá el domicilio para el envío" |

## Tests

| Ítem | Casos |
|---|---|
| US-58 | Dominio con fuzz; service con el fake; contrato y una prueba por fila de errores; integración del repositorio (único, check, FK que bloquea el borrado, `version`); migración aditiva; componente del panel y del formulario; la pantalla en la prueba de humo del E2E |
| US-59 | Schema (domicilio con envío); service (envío después del descuento, `NOT_FOUND`); contrato; integración (la venta guarda el envío); Estadísticas (las comidas no se llevan el envío, Ventas sí); comprobante; carrito (desplegable, total, "Falta el domicilio"); un E2E: alta de envío → venta con envío → comprobante |
| US-60 y US-61 | Lint, typecheck, los tests relacionados y una captura en el navegador |

## Decisiones tomadas durante la implementación

| # | Pregunta | Qué se eligió y qué cambia si el dev dice otra cosa |
|---|---|---|
| I-1 | ¿El borrado de un envío usado lo frena la base o el service? | Los dos, como en Proveedores: el service pregunta `hasSales` y devuelve `HAS_RELATIONS`, y la FK de `sales.shipping_option_id` es la red de seguridad. |
| I-2 | ¿Qué pasa en el celular con el selector de gustos? | Cada fila mide 145 px (los botones bajan a otro renglón): la lista ocupa media pantalla, unas 3 filas, para que "Listo" se vea. En la PC y la tablet, 5 y media. |
| I-3 | ¿El aviso "FALTAN N" tiene que aparecer antes del primer gusto? | No: sigue apareciendo desde el primer gusto, como hoy; sólo cambia de tamaño y pasa a mayúscula. |
| I-4 | ¿Un descuento puede comerse toda la comida si el envío cubre la diferencia? | No: comida $8.000, descuento $9.000 y envío $1.500 sigue siendo inválido ("El descuento no puede dejar el total en $0"). Si el dev quiere permitirlo, cambia una comparación en `checkout-form.ts` y en `checkout.service.ts`. |
| I-5 | ¿Qué mensaje da el servidor si llega un envío sin domicilio? | El genérico de datos inválidos (`VALIDATION`), como cualquier entrada mal formada; el carrito ya lo frena antes con "Falta el domicilio". |
| I-6 | ¿El campo "Domicilio (opcional)" cambia de nombre con un envío elegido? | No: el aviso "Falta el domicilio" queda debajo del desplegable y "Cobrar" se apaga. Si el dev prefiere que el campo diga "Domicilio" a secas con envío, es un cambio de texto. |

## Resumen para el dev

La lista simple de cada commit, a medida que se integra a `develop`.

### Backlog de la Actualización 1 (`docs(backlog)`)

- Qué es: el pedido del cliente copiado tal cual, los cinco ítems nuevos en el backlog y este plan.
- Por qué importa: deja registrado qué se va a hacer y qué decidiste vos antes de programar.
- Adónde va: `develop`. No cambia nada de la app.

### US-60 · Promos con scroll

- Qué es: en Ventas, la tarjeta de Promos muestra 3 promos y la mitad de la cuarta; las demás se ven scrolleando
  dentro de la tarjeta.
- Por qué importa: con muchas promos, la tarjeta ya no estira toda la página hacia abajo.
- Adónde va: `develop`. Sólo cambia cómo se ve; no toca datos ni la base.

### US-61 · Selector de gustos con scroll

- Qué es: al elegir los gustos (por ejemplo, de una docena), la lista muestra 5 gustos y la mitad del sexto, y el resto
  se ve scrolleando dentro de la lista. El aviso de cuántas faltan va en mayúscula y más grande ("2 CARNE · FALTAN 10").
- Por qué importa: el buscador y el botón de abajo quedan siempre a la vista, y se lee de un vistazo cuántas faltan.
- Adónde va: `develop`. Vale para todos los grupos y las promos. Sólo cambia cómo se ve.
- Qué no entra: en el celular entran unas 3 filas, porque cada una es más alta; con 5 y media el modal no entraría en
  la pantalla.

### US-58 · Envíos

- Qué es: una pestaña nueva, "Envíos", entre Ventas/Pedidos y Promociones. Ahí el admin da de alta cada envío con su
  título, su detalle y su monto (puede ser $0), lo edita, lo desactiva o lo borra si nunca se usó.
- Por qué importa: es la lista de la que el vendedor va a elegir el envío en el carrito (US-59).
- Adónde va: `develop`. Trae la migración 0032: una tabla nueva y tres columnas nuevas en las ventas, sin tocar datos
  (las ventas de hoy quedan "sin envío", en $0). **Supabase la tenés que migrar vos antes de desplegar** (queda en 33).
- Qué no entra: todavía no se puede elegir el envío al vender; eso es US-59. El vendedor no ve la pestaña.

### US-59 · Envío en el carrito

- Qué es: en el carrito, abajo a la izquierda, el desplegable "Envío" con "Sin envío" y los envíos activos. El elegido
  se suma al total y a "Cobrar". Con envío, el domicilio es obligatorio.
- Por qué importa: el vendedor cobra el envío sin hacer cuentas. El descuento se aplica sólo a la comida
  ($3.000 − 10 % + envío $1.500 = $4.200).
- Adónde va: `develop`. La venta guarda qué envío fue y cuánto se cobró, aunque después cambies el monto. El
  comprobante lo muestra, y Estadísticas lo suma a Ventas y a la Ganancia, pero no a ninguna comida.
- Qué no entra: no hay una tarjeta "Envíos" aparte en Estadísticas (elegiste que no hacía falta).
