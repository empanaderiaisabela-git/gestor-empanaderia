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
| 6 | T-24 | Cierre del Sprint 5 | 3 | 1 h |

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
