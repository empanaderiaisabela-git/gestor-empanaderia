# Plan maestro: Sprint 5 · Cierre de la primera entrega

- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-29 · **Estado**: aprobado por el dev (2026-10-29)
- **Ítem que lo produce**: T-23.

## Contexto

El 2026-10-29 el cliente se reunió con el dev y pidió cambios para cerrar la primera entrega. El dev los dejó
textuales en `docs/requerimientos/specs.md`, en "Pedido del cliente para cerrar la primera entrega (2026-10-29)":

- un "+" en el carrito, junto al "−";
- en el carrito, el nombre (obligatorio), el teléfono y el domicilio del cliente. Si el cliente ya existe, sus
  datos se completan solos; si no, se da de alta en Clientes;
- datos al día en todo el sistema, sin tocar "Sincronizar";
- el selector de gustos de las promos (wireframe `seleccionador-de-componentes-promo`):
  - el título en tres renglones;
  - los botones en un renglón;
  - "Quitar uno" en rojo;
  - un botón "Siguiente";
- el carrito (wireframe `pedido-actual-ventas`):
  - Cantidad y Unidades separadas;
  - más ancho, un poco menos de la mitad de la pantalla;
  - un slide suave al abrir y al cerrar.

## Decisiones del dev (2026-10-29)

| Tema | Decisión |
|---|---|
| D-1 · Reconocer al cliente | Mientras el vendedor escribe el nombre o el teléfono aparecen los clientes que coinciden. Si elige uno, se completan sus datos. Si no elige ninguno, al cobrar se crea un cliente nuevo. |
| D-2 · Cambiar datos de un cliente existente | Clientes no se toca: la venta guarda los datos tal como se anotaron. |
| D-3 · Sincronizar | Cada pantalla trae datos frescos al entrar y al guardar. Se quitan los botones "Sincronizar". |
| D-4 · "Siguiente" en la promo | El selector ya no avanza solo. "Siguiente" se habilita con el componente completo, y en el último dice "Listo". |
| ISR Writes | La recarga al entrar no suma ISR Writes de Vercel: usa las mismas Server Actions de lectura, sin `revalidatePath` ni `router.refresh()`. Sólo el guardado del catálogo regenera `/home`, como hoy (ADR 0004). |
| Autonomía | Cada ítem se commitea, se integra a `develop` y se sube sin esperar el OK del dev. Las decisiones autónomas se anotan acá, con su pregunta. El merge a `main` y el tag `sprint-5` esperan su OK. |

## Decisiones provisorias del agente

### P-1 · Dónde va el "+"

- **Pregunta**: ¿qué renglones del carrito llevan "+" y qué pasa si no hay stock?
- **Situación**: el vendedor tiene 3 pizzas de Muzzarella y quiere 4. Quedan 2 prepizzas.
- **Elegido**: el "+" va donde ya está el "−": en los renglones comunes, no en las promos. Suma una unidad del mismo
  renglón y se deshabilita si el stock no alcanza, con la misma cuenta que los botones del tablero
  (`availableStock`).
- **Si el dev responde otra cosa**: si las promos también llevan "+", se duplica la promo con los mismos gustos.
  Nivel 2.

### P-2 · "Quitar uno" fuera de las promos

- **Pregunta**: ¿"Quitar uno" va sólo en el selector de las promos?
- **Situación**: el vendedor arma una ½ docena común y pone una Humita de más.
- **Elegido**: va en todos los selectores de gustos, porque es el mismo componente. Va en rojo, a la izquierda de
  "Agregar uno", y queda deshabilitado mientras ese gusto no tenga unidades.
- **Si el dev responde otra cosa**: se muestra sólo en promos. Nivel 1.

### P-3 · Reglas del nombre, el teléfono y el domicilio

- **Pregunta**: ¿qué largo y formato tienen los datos del cliente en el carrito?
- **Situación**: el vendedor deja el nombre vacío y toca "Cobrar".
- **Elegido**:
  - "Cobrar" se deshabilita sin nombre, y el servidor responde `VALIDATION` "Anotá el nombre del cliente".
  - El nombre va de 2 a 100 caracteres, como en Clientes. Por eso `sales.buyer_name` pasa de 60 a 100.
  - El teléfono usa la regla de Clientes: hasta 30, con números, +, - y espacios.
  - El domicilio es opcional, hasta 150.
- **Si el dev responde otra cosa**: cambian los largos en el schema y en la migración. Nivel 2.

### P-4 · Qué clientes se sugieren

- **Pregunta**: ¿desde cuántas letras y cuántos clientes se sugieren?
- **Situación**: el vendedor escribe "ju" y hay 12 clientes que se llaman Juan.
- **Elegido**: sólo clientes activos, desde 2 letras, con coincidencia en el nombre o el teléfono, sin importar
  mayúsculas ni acentos. Se muestran 5 como máximo.
- **Si el dev responde otra cosa**: cambian el mínimo y el máximo. Nivel 1.

### P-5 · Cuándo se crea el cliente nuevo

- **Pregunta**: si la venta falla, ¿queda el cliente nuevo? ¿Y si el cliente elegido se borró?
- **Situación**: el vendedor anota un cliente nuevo y el cobro falla por falta de stock.
- **Elegido**:
  - El cliente se crea dentro de la misma transacción del cobro, con su log "CREAR CUSTOMER". Si la venta falla, no
    queda cliente.
  - Si el cliente elegido se desactivó o se borró mientras tanto, el cobro responde `NOT_FOUND` "El cliente ya no
    existe".
- **Si el dev responde otra cosa**: el alta se hace antes del cobro. Nivel 2.

### P-6 · El domicilio en Clientes y en el comprobante

- **Pregunta**: ¿dónde se ve el domicilio?
- **Situación**: el administrador abre Clientes después de una venta con delivery.
- **Elegido**: Clientes suma la columna y el campo "Domicilio" (opcional). El comprobante de la venta muestra el
  teléfono y el domicilio cuando los tiene.
- **Si el dev responde otra cosa**: se saca de alguno de los dos lugares. Nivel 1.

### P-7 · El error de versión sin "Sincronizar"

- **Pregunta**: el error de edición simultánea hoy dice "sincroniza la lista". Sin el botón, ¿qué dice?
- **Situación**: dos administradores editan el mismo proveedor a la vez.
- **Elegido**: dice "Otro usuario cambió estos datos. Ya se actualizaron; intentá de nuevo", y la lista se vuelve a
  cargar sola.
- **Si el dev responde otra cosa**: cambia el texto del catálogo de errores. Nivel 1.

### P-8 · El ancho del carrito

- **Pregunta**: ¿cuánto es "un poco menos de la mitad"? ¿También en el celular?
- **Situación**: el vendedor usa una notebook de 1366 px y a veces el celular.
- **Elegido**: desde `lg` (1024 px), el carrito ocupa el 45 % del ancho. En el celular y la tablet queda como hoy:
  todo el ancho en el celular y `max-w-xl` en la tablet.
- **Si el dev responde otra cosa**: cambia el porcentaje. Nivel 1.

## Orden y estimación

| # | ID | Título | Nivel | Estimación |
|---|---|---|---|---|
| 0 | T-23 | Backlog del Sprint 5 | — | 30 min |
| 1 | BUG-26 | Carrito: columnas separadas, más ancho y slide suave | 1 | 45 min |
| 2 | US-36 | Carrito: "+" para sumar uno | 2 | 1 h |
| 3 | US-39 | Promos: selector prolijo, "Quitar uno" y "Siguiente" | 2 | 2 h |
| 4 | US-37 | Cliente en el carrito, con alta automática | 3 | 4 h |
| 5 | US-38 | Datos al día sin "Sincronizar" | 2, con los E2E completos | 2 h 30 min |
| 6 | BUG-27 | Selector: los botones de un gusto con nombre largo se desalinean (revisión del dev) | 1 | 20 min |
| 7 | US-40 | Estadísticas: calendarios a la derecha del título (revisión del dev) | 1 | 15 min |
| 8 | US-41 | Estadísticas: fondo suave del color de cada tarjeta (revisión del dev) | 1 | 15 min |
| 9 | US-42 | Estadísticas: los cuadros de abajo scrollean por dentro (revisión del dev) | 1 | 15 min |
| 10 | T-24 | Cierre del Sprint 5 | 3 | 1 h |

## Trazabilidad: `specs.md` → ítems

| Pedido del cliente | Ítem |
|---|---|
| "+" en el carrito | US-36 |
| Nombre, teléfono y domicilio del cliente, con alta automática | US-37 |
| Sincronizar con cada click | US-38 |
| Título del selector de promo | US-39 CA-1 |
| "Agregar uno" en un renglón | US-39 CA-2 |
| "Quitar uno" rojo y "Siguiente" | US-39 CA-3 y CA-4 |
| Cantidad y Unidades pegadas, carrito más ancho | BUG-26 CA-1 y CA-2 |
| Slide suave del carrito | BUG-26 CA-3 |

## Decisiones tomadas durante la implementación

Se anotan acá, con la misma forma (pregunta, situación, elegido y qué cambia si el dev responde otra cosa).

### I-1 · Las transiciones de toda la app (BUG-26)

- **Pregunta**: el slide del carrito no se veía porque una regla global de `globals.css` anulaba todas las clases
  `transition-*`. ¿Se arregla sólo el carrito o la regla global?
- **Situación**: el vendedor abre el carrito y aparece de golpe; tampoco se ven las transiciones de los botones con
  `transition-opacity` o `transition-transform`.
- **Elegido**: se arregla la regla global. Pasa a `@layer base`, así que las clases de cada componente le ganan.
  Ahora se ven todas las transiciones que el código ya pedía, no sólo la del carrito.
- **Si el dev responde otra cosa**: se vuelve a la regla sin capa y el carrito usa un estilo propio. Nivel 1.

### I-2 · El botón de abajo en el selector de una promo (US-39)

- **Pregunta**: con "Siguiente" y "Listo" (D-4), ¿sigue también el "Listo" de abajo, que cerraba aunque faltaran
  gustos?
- **Situación**: el vendedor está en el último producto de la promo y vería dos botones "Listo".
- **Elegido**: en las promos queda un solo botón abajo: "Siguiente", o "Listo" en el último producto. Se habilita
  con el producto completo. Para dejar una promo a medio armar se cierra con la X, y el carrito sigue mostrando
  "faltan gustos · elegir". En las líneas comunes el "Listo" de abajo no cambia.
- **Si el dev responde otra cosa**: vuelve el "Listo" de abajo junto a "Siguiente". Nivel 1.

### I-3 · Dónde aparece "Quitar uno" (US-39)

- **Pregunta**: ¿"Quitar uno" va en todas las filas de todos los selectores?
- **Situación**: el vendedor elige "1 unidad" de empanadas: al tocar "Agregar" la línea ya se completa y se abre
  otra vacía, así que "Quitar uno" quedaría siempre apagado.
- **Elegido**: va en todas las filas de las promos, en las presentaciones de varias unidades (½ docena, docena) y en
  las pizzas de 2 sabores. No va en las líneas comunes de una sola unidad, que se corrigen con el "−" del carrito.
- **Si el dev responde otra cosa**: se muestra también ahí, apagado. Nivel 1.

### I-4 · Cambiar el nombre de un cliente elegido (US-37)

- **Pregunta**: D-2 dice que cambiar el teléfono o el domicilio no toca Clientes. ¿Y si se cambia el nombre?
- **Situación**: el vendedor elige "Marta Gómez" de las sugerencias, se da cuenta de que es otra persona y escribe
  "Marta López".
- **Elegido**: al cambiar el nombre, la venta deja de estar vinculada a ese cliente y se cobra como un cliente nuevo,
  que se da de alta. El teléfono y el domicilio sí se pueden cambiar sin perder el vínculo. El carrito muestra
  "Cliente registrado" mientras hay un cliente elegido.
- **Si el dev responde otra cosa**: el nombre editado queda vinculado al cliente elegido. Nivel 1.

### I-5 · Las ventas viejas y las de los tests (US-37)

- **Pregunta**: las ventas anteriores no tienen cliente. ¿Se migran?
- **Situación**: el historial tiene ventas con "Sin nombre" o con un comprador escrito a mano.
- **Elegido**: no se tocan. Quedan con su nombre (o "Sin nombre") y sin cliente vinculado; sólo las ventas nuevas
  crean o vinculan clientes. La migración 0022 sólo agrega columnas.
- **Si el dev responde otra cosa**: un script crea los clientes de las ventas viejas con nombre. Nivel 2.

## Resumen del Sprint 5 (para el dev)

<details>
<summary>Qué se hizo, en lenguaje simple</summary>

El agente hizo el sprint solo, entre el 2026-10-29 y el 2026-10-30, con permiso para commitear, integrar a `develop`
y hacer push de cada ítem. Después, el 2026-10-30, revisaste el sprint y pediste cuatro arreglos (BUG-27 y US-40 a
US-42), que entraron con tu OK a cada commit. Con tu OK, el sprint pasó a `main` con la etiqueta `sprint-5`.

| Ítem | Commit | Qué cambió |
|---|---|---|
| T-23 | `16c274a` | El pedido del cliente cargado en el backlog, con este plan |
| BUG-26 | `aacbf66` | El carrito separa Cantidad y Unidades, ocupa un poco menos de la mitad de la pantalla y entra y sale deslizándose |
| US-36 | `17fa72c` | Cada renglón del carrito tiene un "+" para sumar uno; se apaga si no hay stock |
| US-39 | `5088e58` | La ventana de gustos de una promo: título en tres renglones, botones en un renglón, "Quitar uno" en rojo y "Siguiente" |
| US-37 | `9c2727b` | El carrito pide el nombre del cliente (obligatorio), el teléfono y el domicilio; sugiere clientes y da de alta a los nuevos |
| US-38 | `ad0b673` | Cada pantalla trae los datos al día al entrar; ya no hay botones "Sincronizar" |
| BUG-27 | `0fed3ac` | En la ventana de gustos, los botones quedan alineados aunque el gusto tenga un nombre largo; en el celular no se salen de la ventana |
| US-40 | `30a4bee` | Estadísticas: las fechas van a la derecha del título, con "Fecha de inicio" y "Fecha de fin" en letra chica |
| US-41 | `f0558b6` | Estadísticas: cada tarjeta con marco de color tiene un fondo muy suave de ese color |
| US-42 | `ce767dd` | Estadísticas: los cuadros de Vendedores y Ventas muestran 5 filas y, con más, scrollean por dentro |

Un hallazgo: el carrito no se deslizaba porque una regla global anulaba **todas** las animaciones de la app. Se
corrigió esa regla (I-1), así que ahora se ven también otras transiciones que el código ya pedía.

</details>

### Para revisar

- **Supabase**: si todavía no la corriste, falta la migración 0022 (quedan 23). Los arreglos de la revisión no traen
  migraciones. Tu base local ya está migrada.
- **Decisiones**: P-1 a P-8 e I-1 a I-5, arriba, cada una con su pregunta.
- **Lo que no se miró en el navegador** (el panel del navegador integrado estaba oculto y mostraba estilos viejos):
  el slide del carrito, la ventana de la promo y las sugerencias de clientes. Lo cubren los E2E, que miden la
  duración del slide, el ancho del carrito y el flujo completo de cada pantalla.
- **Merge**: hecho el 2026-10-30 con tu OK, `develop → main` con el tag `sprint-5`.
