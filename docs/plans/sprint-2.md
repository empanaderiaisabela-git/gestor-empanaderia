# Plan maestro: Sprint 2 · Promociones, tarjetas, estadísticas y gastos

- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-25 · **Estado**: **Borrador**. Se revisa al cerrar el
  Sprint 1 (T-13), con lo que haya cambiado en el modelo y las respuestas del cliente.
- **Ítem que lo produce**: T-10. Las decisiones del dev, la trazabilidad con `specs.md` y las preguntas para el
  cliente están en [`sprint-1.md`](sprint-1.md).

## Contexto

Con el Sprint 1 cerrado, el local ya vende con su modelo real:

- gustos y bebidas, con precio por presentación;
- stock por gusto;
- el POS del wireframe y 4 medios de pago.

Este sprint completa lo que pidió el cliente:

- promociones;
- cobro en cuotas con recargo;
- las estadísticas del día, con sus KPI y sus dos cuadros;
- el anotador de gastos.

El orden pone primero lo que **cambia la venta** (promos y tarjetas) y después las estadísticas, que la leen.

## Orden de ejecución

| # | Ítem | Depende de | Rama |
|---|---|---|---|
| 0 | US-8 Promociones | T-13 | `feat/us-8-promociones` |
| 1 | US-9 Subdivisión Promos en Ventas | US-8 | `feat/us-9-promos-en-ventas` |
| 2 | US-10 Tarjetas y planes de cuotas | T-13 | `feat/us-10-tarjetas` |
| 3 | US-11 Crédito en cuotas | US-10 | `feat/us-11-credito-en-cuotas` |
| 4 | US-12 Estadísticas del día | US-9, US-11 | `feat/us-12-estadisticas-del-dia` |
| 5 | US-13 Cuadros de vendedores y de ventas | US-12 | `feat/us-13-cuadros-de-estadisticas` |
| 6 | US-14 Gastos | T-13 | `feat/us-14-gastos` |
| 7 | BUG-11 Fotos sin validar antes de subir | BUG-1 | `fix/bug-11-validar-fotos` |
| 8 | T-14 Cierre del Sprint 2 | todos | `docs/t-14-cierre-sprint-2` |

US-14 y BUG-11 no dependen de los demás: se pueden adelantar si un ítem queda bloqueado por una respuesta del
cliente (US-13 lo está hasta tener la hora de corte).

---

## 0 · US-8 Promociones (M, 2 h 45 min)

- **Schema** (propuesta):
  - `promotions`: nombre único `varchar(60)`, `price numeric(10,2) CHECK > 0`, `is_active` y `version`.
  - `promotion_components`: `promotion_id` (con `onDelete cascade`), `group`, presentación y `quantity CHECK > 0`.
  - La presentación tiene que ser válida para su grupo: se valida con la constante de dominio de US-3.
- **Precio de referencia** de cada componente: el gusto se elige al vender, así que no hay un precio único. Se
  muestra el rango mín.–máx. de esa presentación hasta que responda el cliente (pregunta 4 de `sprint-1.md`).
- **"Una vez agregada, va seleccionada"** (`specs.md`): la promo guardada queda activa y aparece en Ventas. Se
  confirma en `start-task`.
- **Pantalla** `/promociones`, sólo para el admin, con su entrada en el menú y en `proxy.ts`.

## 1 · US-9 Subdivisión Promos en Ventas (M, 3 h)

- **POS**: la subdivisión Promos despliega las promos activas. Al elegir una, un `FlavorPicker` por componente
  (reutiliza el de US-5) completa los gustos.
- **Línea de tipo promo**: lo cobrado es el precio de la promo, y lo consumido son los gustos de cada componente, con
  su costo congelado.
- **Servidor**: la action de cobro (US-6) acepta líneas de promo. El service valida la promo (activa, componentes
  completos, gustos del grupo correcto) y recalcula su precio.
- **Errores**: promo inactiva o inexistente (`NOT_FOUND`), componentes incompletos (`VALIDATION`) y
  `INSUFFICIENT_STOCK`.

## 2 · US-10 Tarjetas y planes de cuotas (M, 2 h)

- **Schema** (propuesta):
  - `cards`: nombre único `varchar(40)`, `is_active` y `version`.
  - `card_plans`: `card_id` (con `onDelete cascade`), `installments CHECK IN (1, 3, 6, 12)` y
    `surcharge_pct numeric(5,2) CHECK BETWEEN 0 AND 100`, con `unique(card_id, installments)`.
- **Pantalla** `/tarjetas`, sólo para el admin.

## 3 · US-11 Crédito en cuotas (M, 2 h)

- `sale_payments` suma tarjeta, cuotas, % y monto del recargo, nulos salvo en Crédito. Un `CHECK` exige los cuatro
  cuando el medio es `credito`.
- El servidor recalcula el recargo desde `card_plans`.
- **Preguntas abiertas**: si el recargo cuenta como ingreso y como ganancia (afecta a US-12), y si el Débito pide
  tarjeta.

## 4 · US-12 Estadísticas del día (M, 2 h 30 min)

- **Rango**: un día de calendario en `America/Argentina/Buenos_Aires`, que por defecto es hoy. Se calcula con una
  función pura de dominio y tests de frontera (00:00 y 23:59:59 locales, en UTC).
  - Cierra la brecha de fechas de `architecture.md` para Estadísticas.
  - El selector reemplaza a `DateRangePicker`: un día, y opcionalmente un rango.
- **KPI**:
  - Dinero por grupo, sumando las líneas por grupo. Las promos se reparten según la respuesta del cliente
    (pregunta 5).
  - Ganancia en limpio = ventas − costo congelado − mermas del día.
  - Cantidad de ventas.
- **KPI actuales que el cliente no nombró**: quedan debajo de los nuevos hasta que responda (pregunta 8).
- `stats` ya está en la arquitectura objetivo (BUG-5): se extienden su repositorio, su service puro y sus tests.

## 5 · US-13 Cuadros de vendedores y de ventas (M, 2 h)

- **Turno**: función pura `shiftOf(fechaUtc)` con la hora de corte en hora de Argentina. La hora vive en una
  constante del dominio hasta que el cliente pida cambiarla; si pide editarla desde la UI, es un ítem nuevo.
- **Bloqueante**: la hora de corte (pregunta 1).
- Los cuadros se arman en el service de `stats` con los datos del día que ya trae US-12.

## 6 · US-14 Gastos (M, 2 h)

- **Schema** (propuesta): `expenses` con `invoice_number varchar(30)`, `title varchar(100)`,
  `amount numeric(10,2) CHECK > 0`, `user_id`, `version` y timestamps.
- **Pantalla** `/gastos`, sólo para el admin.
- **No afecta Estadísticas**: un test lo demuestra.
- **Preguntas abiertas** (pregunta 7): foto de la factura, número único y fecha de la factura. Si piden foto, se
  reutiliza Cloudinary con las validaciones de BUG-11.

## 7 · BUG-11 Fotos sin validar antes de subir (S, 55 min)

- Sin cambios respecto de lo cargado. Pasó del Sprint 1 al 2 porque las fotos son del catálogo público, que hoy no
  es prioridad. Después de T-12, las fotos apuntan al modelo nuevo.

## 8 · T-14 Cierre del Sprint 2 (S, 1 h)

- Docs al día, `npm run verify` y, con el OK del dev, merge local `develop → main` ("chore(release): sprint 2") con
  el tag `sprint-2`.

## Riesgos

- **Las respuestas del cliente** pueden cambiar US-8, US-11, US-12 y US-14. Lo que falte al tomarlos se implementa
  con el "mientras tanto" de la tabla de preguntas de `sprint-1.md`, y queda anotado en el ítem.
- **US-9 y US-11 tocan el cobro de US-6**: tienen que mantener verde su suite de contrato y su E2E.
