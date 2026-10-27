# Plan maestro: Sprint 2 · Promociones, tarjetas, estadísticas y gastos

- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-25 · **Estado**: revisado en T-15
  (2026-10-25) con las respuestas del cliente y cerrado en T-14 (2026-10-26).
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
| 0 | T-15 Respuestas del cliente en el backlog | T-13 | `docs/t-15-respuestas-del-cliente` |
| 1 | US-8 Promociones | T-13 | `feat/us-8-promociones` |
| 2 | US-9 Subdivisión Promos en Ventas | US-8 | `feat/us-9-promos-en-ventas` |
| 3 | US-10 Tarjetas y planes de cuotas | T-13 | `feat/us-10-tarjetas` |
| 4 | US-11 Crédito en cuotas | US-10 | `feat/us-11-credito-en-cuotas` |
| 5 | US-12 Estadísticas del día | US-9, US-11 | `feat/us-12-estadisticas-del-dia` |
| 6 | US-13 Cuadros de vendedores y de ventas | US-12 | `feat/us-13-cuadros-de-estadisticas` |
| 7 | US-14 Gastos | T-13 | `feat/us-14-gastos` |
| 8 | BUG-11 Fotos sin validar antes de subir | BUG-1 | `fix/bug-11-validar-fotos` |
| 9 | BUG-13 Costo para el local y precio de venta (en revisión) | US-3, US-4 | `fix/bug-13-costo-y-precio-de-venta` |
| 10 | BUG-14 Errores de base que mandan a sincronizar | BUG-9 | `fix/bug-14-errores-de-base` |
| 11 | T-14 Cierre del Sprint 2 | todos | `docs/t-14-cierre-sprint-2` |
| 12 | BUG-15 Precios del grupo que se borran mientras se escriben (apareció en el cierre) | US-3 | `fix/bug-15-precios-del-grupo` |
| 13 | BUG-16 Un E2E de Clientes que falla a veces en el CI (apareció en el cierre) | T-6 | — (pendiente) |

US-14, BUG-11 y BUG-14 no dependen de los demás: se pueden adelantar si un ítem queda bloqueado.

---

## 0 · T-15 Respuestas del cliente en el backlog (S, 30 min)

- Lleva al backlog y a este plan las respuestas que el dev anotó en `specs.md` (líneas 163 a 190). Ver la
  [trazabilidad](#trazabilidad-respuestas-del-cliente--ítems).

## 1 · US-8 Promociones (M, 2 h 20 min)

- **Schema** (propuesta):
  - `promotions`: nombre único `varchar(60)`, `price numeric(10,2) CHECK > 0`, `is_active` y `version`.
  - `promotion_components`: `promotion_id` (con `onDelete cascade`), `group`, presentación y `quantity CHECK > 0`.
  - La presentación tiene que ser válida para su grupo: se valida con la constante de dominio de US-3.
- **Precio**: el admin lo escribe a mano. No se muestra precio de referencia ni hay vigencia: la promo sigue activa
  hasta que el admin la desactiva (cliente).
- **"Una vez agregada, va seleccionada"** (`specs.md`): la promo guardada queda activa y aparece en Ventas. Se
  confirma en `start-task`.
- **Pantalla** `/promociones`, sólo para el admin, con su entrada en el menú y en `proxy.ts`.

## 2 · US-9 Subdivisión Promos en Ventas (M, 3 h)

- **POS**: la subdivisión Promos despliega las promos activas. Al elegir una, un `FlavorPicker` por componente
  (reutiliza el de US-5) completa los gustos.
- **Línea de tipo promo**: lo cobrado es el precio de la promo, y lo consumido son los gustos de cada componente, con
  su costo congelado.
- **Servidor**: la action de cobro (US-6) acepta líneas de promo. El service valida la promo (activa, componentes
  completos, gustos del grupo correcto) y recalcula su precio.
- **Errores**: promo inactiva o inexistente (`NOT_FOUND`), componentes incompletos (`VALIDATION`) y
  `INSUFFICIENT_STOCK`.

## 3 · US-10 Tarjetas y planes de cuotas (M, 2 h)

- **Schema** (propuesta):
  - `cards`: nombre único `varchar(40)`, `is_active` y `version`.
  - `card_plans`: `card_id` (con `onDelete cascade`), `installments CHECK IN (1, 3, 6, 12)` y
    `surcharge_pct numeric(5,2) CHECK BETWEEN 0 AND 100`, con `unique(card_id, installments)`.
- **Pantalla** `/tarjetas`, sólo para el admin.

## 4 · US-11 Crédito en cuotas (M, 2 h)

- `sale_payments` suma tarjeta, cuotas, % y monto del recargo, nulos salvo en Crédito. Un `CHECK` exige los cuatro
  cuando el medio es `credito`.
- El servidor recalcula el recargo desde `card_plans`.
- **Respuestas del cliente**: el recargo cuenta como ganancia (US-12) y el Débito no pide tarjeta.

## 5 · US-12 Estadísticas del día (M, 3 h)

- **Rango**: la jornada del local en `America/Argentina/Buenos_Aires`, de 7:00 a 6:59 del día siguiente, que por
  defecto es la de hoy (dev). Se calcula con una función pura de dominio y tests de frontera (6:59:59 y 7:00
  locales, en UTC).
  - Cierra la brecha de fechas de `architecture.md` para Estadísticas.
  - El selector reemplaza a `DateRangePicker`: un día, y opcionalmente un rango.
- **KPI**:
  - Dinero por grupo, sumando las líneas por grupo, y un cuadro aparte "Promos" (dev).
  - Ganancia en limpio = ventas (con el recargo de las cuotas) − costo para el local congelado (también el de
    los componentes de cada promo) − mermas de la jornada (cliente).
  - Cantidad de ventas.
  - Lo facturado por cada uno de los 4 medios de pago (cliente).
- **KPI heredados que el cliente no nombró** (valor del stock, unidades, pérdidas, órdenes): se quitan (cliente).
- `stats` ya está en la arquitectura objetivo (BUG-5): se extienden su repositorio, su service puro y sus tests.

## 6 · US-13 Cuadros de vendedores y de ventas (M, 2 h)

- **Turno**: función pura `shiftOf(fechaUtc)` en hora de Argentina: mañana de 7:00 a 16:59 y tarde de 17:00 a
  6:59 (cliente). Las horas viven en una constante del dominio; si el cliente pide editarlas desde la UI, es un
  ítem nuevo.
- Los cuadros se arman en el service de `stats` con los datos del día que ya trae US-12.

## 7 · US-14 Gastos (M, 2 h)

- **Schema** (propuesta): `expenses` con `invoice_number varchar(30)` único, `title varchar(100)`,
  `amount numeric(10,2) CHECK > 0`, `invoice_date date`, `user_id`, `version` y timestamps.
- **Pantalla** `/gastos`, sólo para el admin.
- **No afecta Estadísticas**: un test lo demuestra.
- **Respuestas del cliente**: sin foto, número de factura único y fecha de la factura.

## 8 · BUG-11 Fotos sin validar antes de subir (S, 55 min)

- Sin cambios respecto de lo cargado. Pasó del Sprint 1 al 2 porque las fotos son del catálogo público, que hoy no
  es prioridad. Después de T-12, las fotos apuntan al modelo nuevo.
- Se cerró sin código de producción: T-12 ya cumplía los tres CA. Se sumó un contrato que prueba que nada llega a
  Cloudinary sin validar, y los límites quedan en JPG, PNG o WEBP de hasta 5 MB (D-5).

## 9 · BUG-13 Costo para el local y precio de venta (S, 45 min)

- En revisión: integrado en `develop` (2b2877a). Campos, columnas y títulos dicen "Costo para el local" y "Precio de
  venta".

## 10 · BUG-14 Errores de base que mandan a sincronizar (S, 35 min)

- Un `Failed query` sin código conocido pasa a `UNEXPECTED`; `STALE_VERSION` queda sólo para una versión vieja de
  verdad.

## 11 · T-14 Cierre del Sprint 2 (S, 1 h)

- Docs al día, `npm run verify` y, con el OK del dev, merge local `develop → main` ("chore(release): sprint 2") con
  el tag `sprint-2`.
- El dev autorizó el cierre en `main` para esta noche si todo estaba en verde (2026-10-25). Abajo, el
  [resumen para principiantes](#resumen-para-principiantes).
- El CI de `develop` falló después de T-14 por un test intermitente de Alta de productos: el merge a `main` esperó
  a BUG-15.

## 12 · BUG-15 Precios del grupo que se borran mientras se escriben (S, 30 min)

- La tarjeta de precios del grupo copiaba los precios guardados con un efecto que también borraba lo que se estaba
  escribiendo; ahora se vuelve a armar sólo cuando cambia la versión guardada. Hacía fallar a veces
  `menu-panel.test.tsx` en el CI.

## 13 · BUG-16 Un E2E de Clientes que falla a veces en el CI (S, 45 min)

- `tests/clientes.spec.ts:176` falló dos veces en el CI y nunca en local. Queda pendiente: la causa se ve en el
  trace de Playwright del CI, que pide credenciales de GitHub (pregunta en el ítem).

## Trazabilidad: respuestas del cliente → ítems

Respuestas anotadas por el dev en `specs.md`, sección "preguntas que claude code me hizo" (2026-10-25).

| Línea de `specs.md` | Respuesta | Ítem |
|---|---|---|
| 165-166 | Turno mañana desde las 7 y tarde desde las 17 (el local abre de 11 a 16 y de 19 a 1) | US-13 CA-1 y CA-3 |
| 168-169 | El vendedor carga stock. Sobre costos y proveedores, el dev decide que no los ve | US-4 (sin cambios) |
| 172-173 | WhatsApp e Instagram: no hacen falta por ahora | US-1 (pregunta cerrada) |
| 175-176 | "Lo mismo para todos": el dev decide que la surtida de sanguches sigue proporcional | US-6 (sin cambios) |
| 178-179 | Promos sin precio de referencia ni vigencia; ganancia = precio de la promo − costo de lo usado | US-8 CA-2 y CA-3, US-12 CA-2 y CA-3 |
| 181-182 | El recargo cuenta como ganancia; el débito no pide tarjeta | US-11 CA-1, US-12 CA-3 |
| 185-186 | Gastos con fecha de la factura y número único, sin foto | US-14 CA-1 a CA-3 |
| 189-190 | Se quitan los KPI que no nombró; lo facturado va por cada uno de los 4 medios de pago | US-12 CA-5 |
| — | El día de Estadísticas es la jornada de 7:00 a 6:59 (dev) | US-12 CA-1 |

## Riesgos

- **Las respuestas del cliente** ya están en los ítems (T-15). Si al tomar un ítem aparece una duda nueva, se
  pregunta en `start-task`.
- **US-9 y US-11 tocan el cobro de US-6**: tienen que mantener verde su suite de contrato y su E2E.

## Decisiones provisorias del agente

El dev dejó el Sprint 2 corriendo de noche (2026-10-25) y autorizó decidir las dudas nuevas con la opción más
prudente. Cada una tiene la pregunta que le habría hecho, la situación con un ejemplo, qué se eligió y qué cambia si
responde otra cosa. También figura en las notas del ítem del backlog.

**Respuesta del dev (2026-10-27)**: aprobó D-1, D-2, D-4 y D-5. D-3 cambia: ver su respuesta abajo.

### D-1 · Borrar una promoción (US-8)

- **Pregunta**: ¿Una promoción se puede borrar para siempre, o sólo desactivar?
- **Situación**: El admin crea "Docena + Coca" con un error de tipeo y nunca la vendió; otra promo, "Pizza + Pepsi", ya se vendió 30 veces. La historia sólo pide desactivarlas.
- **Qué elegí y por qué**: Se puede borrar sólo si nunca se vendió; si ya se vendió, el sistema no deja ("existen registros relacionados") y hay que desactivarla. Así se corrige un error de carga sin romper el historial de ventas ni los comprobantes.
- **Si respondés otra cosa**: Si querés "sólo desactivar", se quitan el botón Eliminar y `deletePromotionAction` (`src/features/promotion/`). Si querés borrar también las vendidas, habría que guardar el nombre de la promo en cada venta (US-9).

### D-2 · Descuento en una venta con promo (US-9)

- **Pregunta**: Si en una venta hay una promo, ¿se le puede hacer además el descuento de la venta (% o $), o la promo ya es el descuento y no se rebaja más?
- **Situación**: Un cliente lleva la promo "Media + Coca" a $9.000 y una Coca suelta a $2.500 (total $11.500). El vendedor le hace un 10 % de descuento.
- **Qué elegí y por qué**: El descuento se aplica sobre el total de la venta, promos incluidas: $11.500 − 10 % = $10.350. Es como funcionaba el descuento antes de las promos, no frena una venta y no toca datos guardados.
- **Si respondés otra cosa**: Si la promo no admite más descuento, el descuento se calcularía sólo sobre las líneas comunes ($2.500 − 10 % = $2.250, total $11.250): se cambia el cálculo del total en `checkout.service.ts` y en el modal de cobro (`checkout-modal.tsx`).

### D-3 · Importe de una venta con recargo de cuotas (US-11)

- **Pregunta**: En una venta con crédito en cuotas, ¿el total de la venta (el que se ve en Ventas/Pedidos, en el comprobante y en los cuadros de Estadísticas) es lo que pagó el cliente con el recargo, o el precio de los productos sin el recargo?
- **Situación**: Un pedido de $10.000 se paga con $4.000 en efectivo y $6.000 con Visa en 3 cuotas al 10 %. El recargo es $600 y el cliente paga $10.600.
- **Qué elegí y por qué**: El total de la venta es $10.600: lo que realmente cobró el local. El comprobante lo desglosa: subtotal $10.000, recargo de cuotas $600, total $10.600, y el pago con Visa figura por $6.600. El dinero por comida de Estadísticas sigue usando el precio de los productos ($10.000) y el recargo suma a la ganancia y a lo facturado con crédito.
- **Si respondés otra cosa**: Si el total debe ser $10.000, se guarda el total sin el recargo en `checkout.service.ts` y el recargo queda sólo en el pago; el comprobante (`sale-receipt.tsx`) y los cuadros de US-12 y US-13 lo suman aparte.
- **Respuesta del dev (2026-10-27)**: el recargo va para la emisora de la tarjeta; el local ve sólo el precio original. El total es $10.000 y el pago con Visa, $6.000. Se corrigió en BUG-20 (Sprint 3).

### D-4 · Un dato que la base rechaza (BUG-14)

- **Pregunta**: Cuando la base rechaza un dato (por ejemplo, un precio que no cumple una regla de la base), ¿qué querés que lea el usuario: "Los datos proporcionados no son válidos." o "Ocurrió un error inesperado…"?
- **Situación**: Con la base local sin migrar, guardar un precio decía "Los datos en el servidor han cambiado. Por favor, sincroniza la lista…", y sincronizar no arreglaba nada. Otro caso: alguien arma a mano un pedido al servidor con un monto negativo que el formulario no deja escribir, y la regla de la base lo frena.
- **Qué elegí y por qué**: Si la base rechaza el dato por su forma o por una regla (vacío, formato, texto largo, número fuera de rango o una regla `CHECK`), se ve "Los datos proporcionados no son válidos.". Cualquier otro error (tabla que falta, base caída) muestra "Ocurrió un error inesperado…" y el detalle queda sólo en el log del servidor, nunca en la pantalla. "Sincroniza" aparece únicamente cuando otra persona cambió el dato de verdad. Es lo más honesto con el usuario y no muestra SQL.
- **Si respondés otra cosa**: Se cambia la lista `INVALID_DATA` de `src/lib/db-errors.ts` (y su tabla de tests en `db-errors.test.ts`): vaciarla hace que todo sea "error inesperado".

### D-5 · Formatos y tamaño de las fotos (BUG-11)

- **Pregunta**: ¿Qué formatos y qué tamaño máximo aceptamos para las fotos de los gustos y bebidas?
- **Situación**: El admin le saca una foto con el celular a la pizza de muzzarella: un JPG de 3 MB entra. Si intenta subir un GIF animado, una foto de 8 MB o pegar el link de una imagen de internet, el sistema la rechaza antes de mandarla a Cloudinary.
- **Qué elegí y por qué**: JPG, PNG o WEBP de hasta 5 MB, lo que ya regía desde T-12 y anunciaba el botón "Agregar foto (JPG, PNG o WEBP, hasta 5 MB)". Una foto de celular entra sin problema, y Cloudinary la achica a 800 × 800 al guardarla.
- **Si respondés otra cosa**: Se cambian `PHOTO_MAX_BYTES` y los formatos de `DATA_URL` en `src/features/menu/domain/menu-photo.schema.ts`, el texto del botón en `menu-photos-modal.tsx` y los casos de `catalog.test.ts` y `upload-menu-photo.contract.test.ts`.

## Resumen para principiantes

Lo que hice de noche, solo, con tu permiso (2026-10-25 y 26). Todo está en `main` con la etiqueta `sprint-2`.

### Qué puede hacer ahora el local

- **Promociones**: el admin arma una promo (por ejemplo, "Media docena + Coca" a $9.000) y aparece en el tablero de
  ventas. Al venderla se eligen los gustos de cada parte, y el stock se descuenta igual que en una venta común.
- **Tarjetas y cuotas**: el admin carga las tarjetas que acepta el local, con sus planes de 1, 3, 6 o 12 cuotas y el
  recargo de cada uno. Al cobrar con crédito se elige la tarjeta y las cuotas, y el sistema calcula solo el recargo
  sobre la parte pagada con crédito.
- **Estadísticas de la jornada** (de 7:00 a 6:59 del día siguiente): ganancia en limpio, cantidad de ventas, plata
  por cada comida y por las promos, cuánto entró por cada medio de pago, quién vendió en cada turno y la lista de
  ventas con su hora.
- **Gastos**: una pantalla para anotar las facturas (número, título, monto y fecha). No cambian las estadísticas.
- **Mensajes de error más honestos**: el aviso "sincronizá" aparece sólo cuando otra persona cambió el dato.
- **Fotos**: ya se validaban antes de subirse; ahora hay una prueba más que lo garantiza.
- **Alta de productos**: guardar los precios de Empanadas ya no borra lo que estabas escribiendo en Ciabattas (y al
  revés).

### Qué decidí yo sin preguntarte

Cinco dudas que no estaban resueltas. Cada una tiene arriba, en
[Decisiones provisorias del agente](#decisiones-provisorias-del-agente), la pregunta que te habría hecho, un ejemplo
con números y qué cambia si respondés otra cosa.

| # | En una línea |
|---|---|
| D-1 | Una promo se puede borrar sólo si nunca se vendió; si ya se vendió, se desactiva. |
| D-2 | El descuento de la venta también rebaja las promos. |
| D-3 | Respondida por el dev (2026-10-27): el total de la venta es el precio original; el recargo es de la tarjeta (BUG-20). |
| D-4 | Si la base rechaza un dato mal formado, el mensaje es "Los datos proporcionados no son válidos.". |
| D-5 | Las fotos pueden ser JPG, PNG o WEBP de hasta 5 MB. |

### Qué quedó sin hacer

- Del plan del sprint, nada.
- **BUG-16**, que apareció al cerrar: un test automático de Clientes a veces falla en GitHub y nunca en la PC. Para
  ver la causa necesito el informe de esa corrida, que GitHub sólo te deja bajar a vos (punto 6).
- Las **horas reales** de cada ítem las cargás vos, como siempre.

### Qué tenés que hacer vos

1. **Actualizar tu base local**: `npm run db:migrate`. Le faltan las migraciones 0012 a 0016; sin ellas, las
   pantallas nuevas muestran "Ocurrió un error inesperado".
2. **Probarlo a mano**: armar una promo y venderla, cargar una tarjeta y cobrar en cuotas, mirar Estadísticas y
   anotar un gasto.
3. **Contestar D-1 a D-5**. Si alguna no te sirve, decímelo y la cambio.
4. **Revisar los ítems "En revisión"** del Sprint 2 en `BACKLOG.md` y pasarlos a "Hecho".
5. **Supabase**, cuando quieras publicar: migrala vos con tu clave. Ya probé que todas las migraciones corren
   desde cero en una base vacía. Yo no la toqué.
6. **Para BUG-16**: en GitHub, Actions → la corrida fallida de "feat(stats): cuadros de vendedores…" (3c28a35) →
   bajá el archivo `playwright-report` y dejalo en la carpeta del repo, sin commitearlo.
7. Para tu información: dos pruebas de pantalla (`menu-panel.test` y `order-board.test`) ahora esperan un poco más,
   porque fallaban cuando la PC estaba cargada. La de `menu-panel` tenía además una causa real, que se corrigió en
   BUG-15.

<details>
<summary><strong>Qué entró en cada commit</strong> (la lista simple que normalmente aprobás antes de cada commit)</summary>

#### US-8 · Promociones (`07e3df5`)

- Nueva pantalla **Promociones** (sólo admin): se arma una promo eligiendo productos (grupo, presentación y
  cantidad) y se escribe a mano su precio de venta.
- La promo queda activa y se puede editar, desactivar o borrar (borrar sólo si nunca se vendió).
- El vendedor no puede entrar a esa pantalla.
- Cada cambio queda en Auditoría como "PROMOCIÓN".
- Entra también tu aclaración en `specs.md`: la promo nueva va al tablero de ventas.

#### US-9 · Promos en el tablero de ventas (`47e1812`)

- En el tablero aparece la subdivisión **Promos** con las promos activas y su precio.
- Al elegir una, se eligen los gustos de cada producto de la promo (por ejemplo, los 6 gustos de la media docena y la
  bebida), sólo entre los que tienen stock.
- La promo se suma al pedido con su precio; se pueden sumar varias. Mientras le falten gustos, no se puede cobrar.
- Al cobrar, el sistema usa el precio guardado de la promo, descuenta el stock de cada gusto y guarda su costo.
- En Ventas/Pedidos y en el comprobante, la línea dice "Promo: nombre: gustos".
- Una promo que ya se vendió no se puede borrar (sólo desactivar).

#### US-10 · Tarjetas (`6e802c6`)

- Nueva pantalla **Tarjetas** (sólo admin): se cargan las tarjetas de crédito que acepta el local.
- Cada tarjeta tiene sus planes de 1, 3, 6 o 12 cuotas, cada uno con su recargo en %.
- Se editan, desactivan o borran; el vendedor no puede entrar.
- Cada cambio queda en Auditoría como "TARJETA".
- Un test de Alta de productos que a veces fallaba por lentitud ahora espera un poco más.

#### US-11 · Cobrar con crédito en cuotas (`d334174`)

- Al cobrar con **Crédito** se elige la tarjeta y las cuotas; aparece el recargo y el total con recargo antes de
  confirmar. Débito, efectivo y transferencia no piden tarjeta.
- El recargo se cobra sólo sobre la parte pagada con crédito (tu ejemplo: $4.000 efectivo + $6.000 crédito al 10 % =
  $10.600) y lo calcula el sistema con el % guardado.
- El total de la venta es lo que pagó el cliente, con recargo (decisión provisoria D-3).
- El comprobante muestra "Recargo de cuotas" y "Crédito · Visa · 3 cuotas"; el historial también.
- Una tarjeta ya usada en un cobro no se puede borrar.
- Se corrigió una migración para que la base de Supabase se pueda crear de una sola vez sin error.

#### US-12 · Estadísticas de la jornada (`9e4fc7f`)

- **Estadísticas** abre con la jornada de hoy (de 7:00 a 6:59 del día siguiente) y deja elegir otra.
- Muestra la ganancia en limpio, las ventas registradas y el total facturado.
- Un cuadro por comida y bebida con su color y su emoji, y uno aparte para las promos. Si hubo descuento, se reparte
  entre las comidas.
- Lo facturado por Efectivo, Transferencia, Débito y Crédito (con su recargo).
- Se quitaron los cuadros viejos que el cliente no pidió (valor del stock, unidades, etc.).

#### US-13 · Cuadros de vendedores y de ventas (`3c28a35`)

- Al final de Estadísticas, un cuadro de **vendedores**: cada vendedor por turno (mañana de 7:00 a 16:59, tarde de
  17:00 a 6:59), con cuántas ventas hizo y cuánto facturó.
- Y un cuadro de **ventas**: comprador ("Sin nombre" si no se anotó), hora e importe, ordenadas por hora.

#### US-14 · Gastos (`133857b`)

- Nueva pantalla **Gastos** (sólo admin, en el menú después de Estadísticas): un anotador de facturas con número,
  título, monto y fecha de la factura, sin foto.
- El número de factura no se puede repetir.
- Se buscan por número o título, se editan y se borran.
- Los gastos no cambian ningún número de Estadísticas (hay un test que lo controla).

#### BUG-14 · Errores de la base que mandaban a sincronizar (`81722cb`)

- Antes, casi cualquier problema de la base decía "los datos cambiaron, sincronizá", aunque sincronizar no sirviera
  (te pasó con la base sin migrar).
- Ahora ese aviso sale sólo cuando otra persona cambió el dato de verdad.
- Si la base rechaza un dato mal formado, dice "Los datos proporcionados no son válidos." (decisión provisoria D-4).
- Cualquier otro problema dice "Ocurrió un error inesperado" y el detalle técnico queda sólo en el servidor, nunca en
  la pantalla.

#### BUG-11 · Fotos que se validan antes de subir (`8a8164d`)

- La subida de fotos ya revisaba todo antes de mandarla a Cloudinary (desde T-12); ahora una prueba más lo garantiza:
  un gusto que no existe, un GIF, un link o una foto de más de 5 MB se rechazan sin subir nada.
- Quedan aceptadas fotos JPG, PNG o WEBP de hasta 5 MB (decisión provisoria D-5).
- No cambia nada de lo que ve el usuario.

#### T-14 · Cierre del Sprint 2

- El README, la arquitectura y el "prompt inicial" (lo primero que lee el próximo agente) quedan al día con las
  pantallas y las tablas nuevas.
- Este resumen para principiantes.
- El sprint pasa de `develop` a `main` con la etiqueta `sprint-2`.

#### BUG-15 · Precios del grupo que se borraban mientras se escribían

- En Alta de productos, guardar los precios de un grupo (por ejemplo, Empanadas) borraba lo que estabas escribiendo
  sin guardar en el otro (Ciabattas). Ya no pasa.
- Era también la causa de una prueba automática que fallaba a veces en GitHub y frenaba el cierre del sprint.
- Se anota BUG-16 (pendiente): otra prueba, la de Clientes, que a veces falla en GitHub.

</details>
