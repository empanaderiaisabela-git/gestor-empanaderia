# Plan maestro: Sprint 6 · Revisión del cliente en producción

- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-30 · **Estado**: aprobado por el dev (2026-10-30)
- **Ítem que lo produce**: T-25.

## Contexto

El sistema ya está en producción: la base en Supabase y la app en Vercel. El dueño del local lo probó y pidió seis
cambios. El dev los dejó textuales en `docs/requerimientos/specs.md`, en "Pedido del cliente tras probar el sistema
en producción (2026-10-30)":

- Un botón deslizable "Jamón extra" en cada pizza del carrito, que suma un monto a esa pizza. El monto se carga en
  "Ingresar stock" con una categoría nueva, "Jamón extra para pizza", que sólo pide un precio. Cada pizza entra al
  carrito con el botón apagado.
- Pepsi pasa a llamarse Quilmes en todo el sistema.
- "Sanguches" pasa a llamarse "Sándwich de miga".
- Un stock mínimo opcional para cada producto que se stockea por cantidad. Por debajo del mínimo, el stock se ve en
  amarillo.
- En Stock, "Coca-Cola" en un solo renglón, sin desacomodar el resto.
- Editar un ingreso de stock ya cargado, con todo precargado.

**Restricción principal (dev, 2026-10-30)**: las migraciones son **sólo aditivas** y seguras para Supabase, que ya
tiene datos reales:

- Sin `DROP`, sin `RENAME` y sin cambiar tipos de columnas.
- Sin tocar el enum `menu_group`.
- Sin `UPDATE` ni `DELETE` de datos existentes.

El agente trabaja siempre contra la base local. Supabase la migra el dev.

## Decisiones del dev (2026-10-30)

| Tema | Decisión |
|---|---|
| D-1 · Jamón extra y cantidad | Por renglón. Un renglón con 3 pizzas iguales lleva jamón en las 3. Dos pizzas agregadas por separado son dos renglones, cada uno con su botón. |
| D-2 · Jamón extra en promos | Las pizzas de una promo también tienen el botón, y el jamón suma al precio de la promo. |
| D-3 · Editar un ingreso | Todo es editable, también la categoría y el gusto. Si cambia el gusto, las unidades salen del gusto viejo y pasan al nuevo. |
| D-4 · Grafía | "Sándwich de miga", con tilde. |
| D-5 · Migraciones | Sólo aditivas. El agente migra la base local; Supabase la migra el dev, antes de desplegar. |
| Autonomía | Cada commit espera el OK del dev sobre la lista en lenguaje simple (`AGENTS.md`). |

## Decisiones provisorias del agente

**Confirmadas por el dev el 2026-10-31**, las diez tal como están escritas (pregunta 1 de la sesión, abajo).

### P-1 · Quilmes es sólo el nombre visible

- **Pregunta**: ¿Pepsi cambia también en la base o sólo en pantalla?
- **Situación**: la base guarda el grupo como la clave `pepsi` de un enum de Postgres, en `menu_items`, `sale_lines` y
  `promotion_components`. Renombrar el valor del enum no borra datos, pero rompe la app vieja durante el despliegue, y
  `db:generate` lo resuelve recreando el tipo, que es destructivo.
- **Elegido**: cambia sólo la etiqueta (`GROUPS.pepsi.label = 'Quilmes'`). La clave `pepsi` queda en la base y en el
  código, documentada en el glosario. Sin migración.
- **Ojo**: los gustos que el cliente cargó en producción con "Pepsi" en el nombre (por ejemplo, "Pepsi 1,5 L") no los
  toca el código. Los renombra el cliente en Alta de productos.
- **Si el dev responde otra cosa**: el rename de la clave es una migración propia, con el deploy al mismo tiempo.
  Nivel 3.

### P-2 · Jamón extra sin precio cargado

- **Pregunta**: ¿qué pasa con el botón si el admin todavía no cargó el precio del jamón?
- **Situación**: el día que se despliega, el vendedor arma una pizza y nadie cargó el precio.
- **Elegido**: el botón aparece deshabilitado. Si alguien lo manda igual, el servidor responde `MISSING_PRICE` ("Falta
  el precio de venta.").
- **Si el dev responde otra cosa**: el botón se oculta hasta que haya precio. Nivel 1.

### P-3 · El jamón no tiene costo para el local

- **Pregunta**: ¿el jamón extra descuenta algún costo de la ganancia?
- **Situación**: el jamón cuesta $1.500 y se vende una Muzzarella de $10.000 con jamón: entran $11.500.
- **Elegido**: el cliente pidió sólo el precio, así que los $1.500 cuentan enteros en Ganancia. Se suman al dinero de
  Pizzas (o de Promos, si la pizza es de una promo).
- **Si el dev responde otra cosa**: la categoría pide también un costo, que se descuenta como el de los gustos. Nivel 3.

### P-4 · Cuándo se pone amarillo

- **Pregunta**: con un mínimo de 5, ¿el amarillo aparece en 5 o en 4?
- **Situación**: el cliente dijo "le doy un mínimo de 5, el día que tenga 4, amarillo".
- **Elegido**: amarillo cuando el stock es **menor** al mínimo: 4 es amarillo y 5 es verde. Sin stock sigue en rojo,
  con "Sin stock". El vendedor ve el mismo color.
- **Si el dev responde otra cosa**: la comparación pasa a "menor o igual". Nivel 1.

### P-5 · Cómo se carga el mínimo

- **Pregunta**: si en un ingreso nuevo el campo queda vacío, ¿se borra el mínimo que había?
- **Situación**: Carne tiene mínimo 5 y el admin ingresa 10 más.
- **Elegido**: el campo "Stock mínimo" arranca con el mínimo actual del gusto, así que no se pierde. Vaciarlo es
  "sin mínimo". Va en todo lo que se stockea por cantidad: empanadas, sándwiches, bebidas, prepizzas y panes de
  ciabatta. Los gustos de pizza y ciabatta no lo tienen, porque no tienen stock propio.
- **Si el dev responde otra cosa**: el campo arranca vacío y vacío no cambia nada. Nivel 1.

### P-6 · El costo al editar un ingreso viejo

- **Pregunta**: si se edita el costo de un ingreso viejo, ¿cambia el costo actual del gusto?
- **Situación**: Carne tuvo un ingreso el lunes a $800 y otro el jueves a $900; hoy cuesta $900. El admin edita el del
  lunes para ponerle proveedor.
- **Elegido**: el costo del ingreso pasa a ser el costo actual del gusto **sólo si es su ingreso más reciente**. En el
  ejemplo, Carne sigue a $900. Los precios de venta y el mínimo son del gusto, no del ingreso: se precargan con los
  actuales y lo que se guarde queda como actual. Las ventas ya hechas no cambian.
- **Si el dev responde otra cosa**: el costo editado siempre pasa al gusto. Nivel 2.

### P-7 · Editar un ingreso que ya se vendió

- **Pregunta**: ¿se puede bajar la cantidad de un ingreso si esas unidades ya se vendieron?
- **Situación**: se ingresaron 10 de Carne por error en vez de 1, y ya se vendieron 8. Queda stock 2.
- **Elegido**: el stock nunca queda negativo. Pasar el ingreso a 1 dejaría -7, así que responde `INSUFFICIENT_STOCK`
  ("No hay stock suficiente de Carne."). Lo mismo al mover un ingreso a otro gusto.
- **Si el dev responde otra cosa**: se permite y el stock queda en 0. Nivel 2.

### P-8 · Historial de las prepizzas y los panes

- **Pregunta**: ¿cómo se edita un ingreso de prepizzas, si hoy las bases no tienen Historial?
- **Elegido**: Prepizza y Pan de ciabatta suman el botón de Historial, con "Editar" en cada ingreso.
- **Si el dev responde otra cosa**: se saca el botón. Nivel 1.

### P-9 · Prender el jamón no junta renglones

- **Situación**: hay dos renglones de 1 Muzzarella, uno con jamón. El vendedor apaga el jamón.
- **Elegido**: quedan dos renglones iguales, sin juntarse. Así no cambia lo que el vendedor ve mientras toca.
- **Si el dev responde otra cosa**: se juntan al apagar. Nivel 1.

### P-10 · Ancho de la categoría en Stock

- **Situación**: la tabla reparte el ancho en partes iguales, y "Coca-Cola" se parte después del guion.
- **Elegido**: la celda no se parte y la columna tiene un ancho fijo, en el que entran "Sándwich de miga" y "Pan de
  ciabatta". Mismo arreglo que la columna Grupo de Alta (BUG-17).
- **Si el dev responde otra cosa**: cambia el ancho. Nivel 1.

## Cómo se cuidan las migraciones

1. Cada una se genera con `npm run db:generate -- --name <slug>` y se lee el `.sql` antes de commitear.
2. Sólo puede tener `ADD COLUMN`, `ADD CONSTRAINT` sobre columnas nuevas y `CREATE TABLE`. El test
   `src/lib/db/additive-migrations.test.ts` (US-45) falla, desde la 0023, si aparece `DROP`, `RENAME`, `ALTER TYPE`,
   `SET DATA TYPE`, `SET NOT NULL`, `DELETE`, `UPDATE` o `TRUNCATE`.
3. Ninguna columna `NOT NULL` sin un default constante. Ningún check que pueda fallar con los datos de hoy: los
   checks nuevos sólo miran columnas nuevas.
4. Cada migración tiene un test de integración que carga filas con el formato viejo y corre el `.sql`, como
   `src/lib/db/prepizzas-y-panes.migration.int.test.ts`.
5. Van en serie: cada ítem genera la suya después de que el anterior entró a `develop`.
6. El agente migra la base local. Supabase la migra el dev, **antes** de desplegar: como todo es aditivo, la app
   vieja sigue andando con las columnas nuevas.

| Migración | Ítem | Qué hace |
|---|---|---|
| 0023 | US-45 | `menu_items.min_stock integer` (nullable) y su check |
| 0024 | US-46 | `stock_entries.version integer DEFAULT 1 NOT NULL` |
| 0025 | US-47 | Tabla nueva `pizza_extras` (`code`, `price`, `version`, `updated_at`), sin filas |

Al cerrar el sprint, Supabase tiene que quedar con **26** migraciones.

## Orden y estimación

| # | ID | Título | Nivel | Estimación |
|---|---|---|---|---|
| 0 | T-25 | Backlog del Sprint 6 | — | 30 min |
| 1 | US-44 | Grupos: "Quilmes" y "Sándwich de miga" | 1 | 45 min |
| 2 | BUG-28 | Stock: la categoría en un solo renglón | 1 | 20 min |
| 3 | US-45 | Stock mínimo opcional con aviso amarillo | 3 | 3 h |
| 4 | US-46 | Editar un ingreso de stock | 3 | 4 h |
| 5 | US-47 | Jamón extra para pizza | 3 | 5 h |
| 6 | T-26 | Cierre del Sprint 6 | 3 | 1 h 30 min |

## Trazabilidad: `specs.md` → ítems

| Pedido del cliente | Ítem |
|---|---|
| Botón "Jamón extra" en cada pizza, apagado al entrar | US-47 CA-3 a CA-5 |
| Categoría "Jamón extra para pizza" con sólo el precio | US-47 CA-1 y CA-2 |
| Pepsi pasa a Quilmes | US-44 CA-1 |
| "Sándwich de miga" | US-44 CA-2 |
| Stock mínimo opcional y amarillo | US-45 |
| "Coca-Cola" en un renglón | BUG-28 |
| Editar un ingreso con todo precargado | US-46 |

## Decisiones tomadas durante la implementación

### Respuestas del dev al arrancar la sesión (2026-10-31)

El dev pidió hacer el sprint de una pasada, sin estar presente, y apagar la computadora al terminar. Antes de
empezar, el agente le hizo cuatro preguntas en el chat:

| # | Pregunta | De dónde sale | Respuesta del dev |
|---|---|---|---|
| 1 | ¿Confirmás las provisorias P-1 a P-10 tal como están? | Las P-1 a P-10 de este plan (T-25) esperaban su confirmación | Sí, todas |
| 2 | ¿Commiteo y pusheo a `develop` cada ítem sin esperar tu OK sobre la lista simple? | `AGENTS.md` (DoD): sin el OK del dev sobre la lista simple no se commitea; el dev pidió "aceptarte los cambios y pushear a develop" | Sí. La lista simple de cada ítem queda en "Resumen para el dev", al final |
| 3 | ¿Hago también el merge `develop → main` con el tag `sprint-6`? | T-26 CA-2 | No: sólo `develop`. `main` y el tag esperan su revisión |
| 4 | Si un gate falla y no lo puedo arreglar, ¿qué hago antes de apagar? | El pedido de apagar al terminar, y la regla de nunca `--no-verify` (`docs/git.md`) | No se pushea lo roto: queda en su rama local, con nota acá. Se apaga igual |

### Decisiones del agente durante la implementación

Cada una dice de dónde salió la pregunta. Se eligió siempre lo que no borra datos y se puede deshacer.

#### I-1 · Los gustos del seed pasan a "Quilmes" (US-44)

- **Pregunta**: el seed trae "Pepsi 500 ml" y "Pepsi 1,5 L" en el grupo que ahora se llama Quilmes. ¿Se renombran?
- **De dónde sale**: `specs.md` dice "cada aparición de pepsi es Quilmes", y P-1 sólo habla de los gustos cargados
  en producción.
- **Elegido**: en `menu-seed-data.ts` pasan a "Quilmes 500 ml" y "Quilmes 1,5 L". 7up y Mirinda quedan igual. Sólo
  afecta a una base nueva (la de los E2E o una instalación limpia): la base local y la de Supabase no se tocan.
- **Si el dev responde otra cosa**: se vuelven a poner los nombres viejos en el seed. Nivel 1.

#### I-2 · Las ventas ya hechas conservan el nombre viejo (US-44)

- **Pregunta**: el historial y el comprobante de una venta de ayer dicen "Sanguches · 3 unidades" o "Pepsi 1,5 L".
  ¿Se cambian?
- **De dónde sale**: US-44 CA-1 pide el nombre nuevo "en el historial y el comprobante", pero cada venta guarda su
  descripción como texto al cobrar (`sale_lines.description`), y D-5 prohíbe `UPDATE` de datos existentes.
- **Elegido**: las ventas nuevas dicen "Sándwich de miga" y "Quilmes"; las ya hechas quedan como se cobraron.
- **Si el dev responde otra cosa**: un script aparte, que corre el dev, reemplaza el texto en las ventas viejas.
  Nivel 2.

#### I-3 · Columnas de Alta de productos (US-44)

- **Pregunta**: ¿cómo entra "Sándwich de miga" en la columna Grupo de Alta?
- **De dónde sale**: US-44 CA-2 ("la columna Grupo de Alta no se desacomoda"). Medido en el navegador a 1280 px: en
  los 128 px de la columna, "Sándwich de miga" se partía en dos renglones.
- **Elegido**: la columna Grupo pasa a `w-52` sin cortar, y la de Stock (un número) a `w-28`, para que la de Gusto no
  pierda ancho: "Carne cortada a cuchillo" sigue en un renglón.
- **Si el dev responde otra cosa**: se ajustan los anchos. Nivel 1.

#### I-4 · Anchos de toda la tabla de Stock (BUG-28)

- **Pregunta**: ¿alcanza con ensanchar la columna Categoría?
- **De dónde sale**: BUG-28 CA-1 ("las otras columnas no se rompen") y P-10. Medido en el navegador a 1280 px: con
  sólo Categoría más ancha, los precios de venta de las empanadas pisaban la columna del costo. Ya los pisaban antes
  del cambio, porque la tabla repartía el ancho en partes iguales.
- **Elegido**: anchos fijos en Categoría (`w-48`), Stock (`w-20`), Precio de venta (`w-48`) y Acciones (`w-36`).
  Gusto y Costo se reparten el resto. A 1280 y 1400 px ninguna celda se desborda; el nombre largo de un gusto puede
  ir en dos renglones, como ya pasaba.
- **Si el dev responde otra cosa**: se ajustan los anchos. Nivel 1.

#### I-5 · El stock bajo el mínimo también se avisa sin color (US-45)

- **Pregunta**: ¿alcanza con el amarillo para avisar que un gusto está bajo el mínimo?
- **De dónde sale**: US-45 CA-3 pide el color; la regla de accesibilidad de no avisar sólo con color (WCAG 1.4.1)
  y quien no distingue bien el amarillo del verde.
- **Elegido**: el número del stock lleva el título "Mínimo: N" (se ve al pasar el mouse) cuando el gusto tiene
  mínimo. El vendedor recibe el mínimo para ver el mismo color; no es un dato sensible como el costo.
- **Si el dev responde otra cosa**: se saca el título. Nivel 1.

## Resumen para el dev

Lo que entró en cada commit, en lenguaje simple. Todo va a `develop` en el GitHub público. Nunca entran secretos,
`.env.local` ni `node_modules`. Tu cambio local en `.gitignore` y `.claude/launch.json` tampoco: quedaron como estaban,
sin commitear.

### US-44 · Quilmes y Sándwich de miga

1. **Nombres nuevos**: en todas las pantallas, el grupo Pepsi se llama "Quilmes" y Sanguches se llama "Sándwich de
   miga". Por dentro, la base de datos sigue igual: no hubo que tocarla.
2. **Ventas viejas**: las ventas que ya se cobraron conservan el nombre que tenían en su comprobante.
3. **Alta de productos**: la columna Grupo es un poco más ancha para que "Sándwich de miga" entre en un renglón.
4. **Datos de prueba**: las bebidas de ejemplo dicen "Quilmes 500 ml" y "Quilmes 1,5 L". No toca tus datos.
5. **Pruebas y documentos**: las pruebas automáticas y los documentos usan los nombres nuevos.

### BUG-28 · La categoría de Stock en un renglón

1. **Stock más prolijo**: "Coca-Cola", "Sándwich de miga" y "Pan de ciabatta" se leen en un solo renglón.
2. **Columnas ordenadas**: cada columna de la tabla tiene su ancho, así los precios ya no se montan sobre el costo.
3. **Pruebas y documentos**: una prueba automática nueva cuida que la categoría no se vuelva a cortar.

### US-45 · Stock mínimo con aviso amarillo

1. **Mínimo opcional**: al ingresar stock aparece "Stock mínimo (opcional)", con el mínimo que ya tenía el producto.
   Si se deja vacío, el producto queda sin mínimo.
2. **Aviso amarillo**: si el stock baja de ese mínimo (por ejemplo, mínimo 5 y quedan 4), el número se ve en
   amarillo. Sin stock sigue en rojo. El vendedor ve los mismos colores.
3. **Base de datos**: se agregó una columna nueva para guardar el mínimo. No borra ni cambia nada de lo que hay; tu
   base local ya la tiene. Supabase la migrás vos antes de desplegar.
4. **Protección de migraciones**: una prueba automática nueva avisa si una migración futura intenta borrar,
   renombrar o modificar datos.
5. **Pruebas y documentos**: pruebas de cada parte (también una que usa la pantalla real) y el documento de Stock.
