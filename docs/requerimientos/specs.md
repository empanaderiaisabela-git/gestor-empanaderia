# aqui iran los requerimientos del cliente textualmente como él lo indica. 

# la idea será lograr interpretar lo que el quiere siguiendo todos los protocolos de workflow.

# dada una interpretacion para su mensaje, se debe armar un ticket adecuado en backlog para así atacarlo y resolverlo.

Estadisticas para la empanadería. De momento solo interesa la parte de gestor de stock, no interesa para nada el sitio web (por ahora).

**Ventas:** se tiene que ver como el dashboard de estadisticas. (ver carpeta de wirefrimes: “venta_vista_general”)
esto quiere decir: cada kpi presente ahora mismo poseé un cierto área, donde ese area ahora, será ocupada con una especie de sub-division, de un espacio, de un “pizarron” por así llamarlo… cada subdivisión mencionada será dedicada para las 4 comidas presentes en este local: 

- Empanadas
- Pizzas
- Sanguches
- Ciabatta

y ademas, agregar bebidas de las marcas

- Coca-cola
- Pepsi

y por último, uno dedicado a promos, donde con un click, se despliegan las promos y luego se selecciona una de las promos deseadas, se puede agregar una vez más otra promo y volver a seleccionar otra.

Necesita botones en cada subdivision. El sidebar de la izquierda debe ser un poco mas chico, y que ahora, donde va cada KPI, ahora irán subdivisiones donde cada subdivision representa una comida diferente que la empanaderia ofrece, y que dentro de esa subdivision, exista 1 botón por cada cantidad que venden, poder elegirlas con un click ( por ejemplo, las empanadas se ofrecen de a 1 docena, ½ docena, 1 unidad, …, etc). Ver carpeta de wireframes: venta_vista_panel_desplegable_gustos.

Regla de negocio para elegir sabores EMPANADAS: si se hace click en el botón “1 docena”, o sea de media docena, o de otra cantidad mayor a 1, entonces al hacer click en 1 solo gusto, toda esa cantidad de comida seleccionada se carga en la compra con ese solo gusto. Ahora, si se selecciona 1 unidad, al hacerle click a un gusto, ya se guarda ese pedido con el solo gusto ese.
AGREGADO: Se tendrá tener un botón que diga "agregar uno", o "completar" que basicamente agregue un solo gusto del elegido, o complete todo lo que falta para llegar a la cantidad seleccionada, por ejemplo, si un cliente quiere 6 empanadas tal que son 2 de jamon y queso, y 4 de carne, se toca la opcion de 1/2 docena, con una de carne, una de carne, y  comlpetar con el de pollo

Regla de negocio para elegir sabores PIZZAS: debe tener solo la opción de 1 gusto de  pizza o 2 gustos de  pizzas PARA LA MISMA PIZZA; de elegir una venta de pizza con un solo gusto, se despliega la lista de gustos y se elije 1; de elegir una venta de pizza de 2 gustos, se despliega la lista de gustos y se eligen 2. Si se eligen 2, el precio final de esa pizza de doble gusto, es el precio del sabor de pizza mas caro, ej: mozzarella y J&Q, mozzarella sale 10, J&Q sale 5, precio final de una pizza mitad mozzarella y mitad J&Q = 10.

Regla de negocio para elegir sabores SANDWICH: se suman de a unidades, de a 3, 6 o 12, y si se hace click en el botón “1 docena”, o sea de media docena, o de otra cantidad mayor a 1, entonces al hacer click en 1 solo gusto, toda esa cantidad de comida seleccionada se carga en la compra con ese solo gusto. Ahora, si se selecciona 1 unidad, al hacerle click a un gusto, ya se guarda ese pedido con el solo gusto ese.
AGREGADO: Se tendrá tener un botón que diga "agregar uno", o "completar" que basicamente agregue un solo gusto del elegido, o complete todo lo que falta para llegar a la cantidad seleccionada, por ejemplo, si un cliente quiere 6 empanadas tal que son 2 de jamon y queso, y 4 de carne, se toca la opcion de 1/2 docena, con una de carne, una de carne, y  comlpetar con el de pollo

Regla de negocio para elegir sabores Ciabatta: se suman de a unidades, se elije 1 sabor y se carga eso en la compra 

Para coca cola y pepsi, solo ofrecer de a unidades: el solo click despliega su lista de opciones de bebidas en stock de tal empresa (sea cocacola o pepsi).

en ventas ademas, los medios de pago serán los siguientes, donde hoy en dia la infraestructura actual posee 2, ahora quiero:
- Efectivo
- Transferencia
- Débito
- Crédito



**Stock:** tiene que cargar de las 4 comidas, y de esas 4 comidas, los distintos sabores disponibles que se den de alta. Stock debe estar con su grilla, con su “Ingresar stock”.
Además, tiene que permitir tambien agregar las bebidas de sus dos empresas, coca-cola y pepsi.

**Estadísticas (lo sería dashboard, pero su nombre ahora será Estadísticas):**

- KPI de dinero generado con: -empanadas, -pizzas, -cibatta, -sandwiches de miga, bebida empresa coca cola, bebida empresa pepsi. 

- KPI de ganancias en limpio, es decir, lo que se obtuvo de ganancia sin contar lo que se invirtió, es decir, por ejemplo para dejar en claro: si compre una pizza a $10 y la vendí a $30, mi ganancia fueron $20, esos $20 son los que me interesan.

- KPI de ventas registradas tambien (estadísticas viene por defecto en el dia, asi que me mostraria las ventas totales con las que cierra el dia).

Ademas con 2 cuadros abajo del todo, ambos con rendimiento de una temática diferente cada uno, siendo las temáticas:

1) Sobre vendedores, con la siguiente información:

Turno: donde solo varia en mañana y tarde.
Numero de ventas: la cantidad de ventas que se hicieron
Importe: el dinero que facturó en total ese vendedor

2) Ventas,  donde se anote :

El nombre del comprador: nombre de la persona que compró anotado por admin o vendedor
Hora: El horario de la compra
Importe: el dinero que se facturó por esa venta

La UI de estadísticas queda por default con la información del día en el calendario.

los botones a los que debe tener acceso un rol: Vendedor:

- Ventas/Pedidos
- Stock
- Clientes
- Auditoría

los botones a los que debe tener acceso un rol Admin:
- Estadísticas (las del dia como default)
- Gastos
- Stock
- Ventas/Pedidos
- Promociones
- Clientes
- Proveedores
- Alta de productos
- Tarjetas 
- Usuario
- Auditoría

**Promociones:**

Un tab nuevo con las promociones, donde se combinan productos distintos y se coloca un precio de rebaja.

Se muestra una lista de lo elegido, del precio de cada producto y lo que sale todo en total, y finalmente se coloca el precio a mano de lo que saldrá la promoción.

Finalmente, una vez agregada, esta va al tablero de ventas para hacer una venta con esa promo.

algunos comentarios sueltos: 

para cada uno de los botones sea de admin o de vendedor, consultar por los botones que no están actualmente ya implementados, algunos son nuevos para esta infraestructura.

La app tiene que estar tematizada para la empanadería, no quiero placeholders ni nombres ni referencias a iphones o tecnología.

Hay que quitar el revalidate = 30 segundos, consume muchísimo ISR Writing de vercel. Hay que ver cómo cambiar este comportamiento.

**Tarjetas:** aqui se dan de altas las tarjetas que se admiten con las cuotas que el local tiene, sea en 1 cuota, 3, 6 o 12

**gustos que disponen:**

Sándwiches de miga:
Primavera (jamón, queso, lechuga y tomate)   Jamón y queso   

Ciabatta:

Carne   Capresse   Bondiola   Pollo   

Pizzas:

Muzza   Muzza y jamón   Napolitana (con o sin jamón)   Pepperoni   Roquefort   

Empanadas:

Carne suave, Carne, Carne picante, Carne cheddar   Pollo, Pollo a mostaza   Bondiola mostaza y miel, Bondiola barbacoa   Jamón y muzza   Capresse   Muzza y cebolla, Muzza y pepperoni, Muzza, cebolla y roquefort   Verdura   Humita

**ACLARACIÓN DE PRECIOS:** 
-el precio de las empanadas, sea una docena, media docena, tres o una unidad, salen todos los gustos lo mismo.

-los ciabatta salen todos lo mismo

-los sanguche de primavera y los de jamon y queso difieren en el precio

-las pizzas dependiendo de su gusto difieren en el precio

----------------------------------------------------------

**CONSIDERACIONES DEL PRIMER SPRINT:**

EL BOTON DE NUEVA VENTA EN VENTAS/PEDIDOS SE VA, ya no cumple ninguna función pues el pedido que será venta se registra desde el tablero de pedidos.

ya hay api key para conectarse con una bd real en supabase.

tanto en los cuadrados de cada comida en ventas, como los cuadrados de cada comida en kpi de dinero por comida, estos serán rellenos por sus colores particulares de cada uno, siendo estos los siguientes para tanto kpi de estadisticas como ventas:

Empanadas: Naranja (evoca la masa horneada).
Pizzas: amarillo (asociado al queso, pero que no sea chillon, amarillo suave).
Ciabattas: Marrón claro o Tostado (refleja el pan rústico).
Sándwich: Verde (transmite frescura e ingredientes naturales, pero un verde suave).
Cocacola: rojo (clásico como su marca)
pepsi: azul (tambien como su marca es conocida)

luego para los emojis, en vez de usar de la libreria de react, prefiero que uses los de unicode, los emojis que están en cualquier telefono, y de la siguiente forma:

Empanadas: 🥟
Pizzas: 🍕
Ciabattas: 🥖
Sándwich: 🥪
Cocacola: 🥤
pepsi: 🥤

**preguntas que claude code me hizo**

¿A qué hora se corta el turno mañana/tarde? Esto bloquea los cuadros de vendedores del Sprint 2.
mañana: de 11:00 a 16:00, tarde: de 19:00 a 1am, es decir, el corte se marca para la tarde empezando a las 19, y para la mañana empezando a las 11. Podemos extenderlo para que sea a las 7 am que sea de mañana, y a partir de las 17 que sea turno tarde, por si hay algun registro fuera de los horarios para ampliar mejor ese margen y registrar bien.

¿El vendedor puede cargar stock? ¿Ve costos y proveedores? Hoy carga stock pero no ve costos.
si puede cargar stock


¿Cuáles son el WhatsApp y el Instagram? Sin esos datos, el catálogo no muestra botones de contacto.
ahora no importa pues la web no estara en uso cercano.

¿Cobra igual la docena surtida que la de un solo gusto? Hoy se cobra proporcional.
si lo mismo para todos

Promociones: precio de referencia, vigencia y cómo repartir el precio en las estadísticas.
como repartir en estadisticas: obtener la diferencia de lo que salió usar cada producto y a lo que se pudo vender la promo, esa es la ganancia. No hay precio de referencia, se pone a mano la promo. No se supone que lleva una fecha limite por vigencia, los propios administradores la quitan.

Cuotas: ¿el recargo cuenta como ganancia? ¿El débito pide tarjeta?
el recargo cuenta como ganancia, no se pide tarjeta para debito


Gastos: ¿foto de la factura? ¿Número único? ¿Fecha de la factura?
fecha y numero unico, no es necesaria la foto, solo la fecha el monto, el numero de la factura, y el titulo de la factura


¿Se conservan las estadísticas de hoy que no nombró, como efectivo/transferencia o valor del stock?
no es necesario. En cuanto a lo que se facturó dependiendo que medio de pago, necesito a los 4 disponibles por separado.


---------------------------------------------------------------------------

Aclaraciones para la sprint 3:

-En alta de productos, quiero que la columna grupo y Gusto / bebida esten mas cerca, pues los nombres enseguida se cortan y no se llega a leer nada para un nombre medianamente largo (ver wirefrime en docs "error-visual-1")

-En alta de productos, en el boton de nuevo gusto o bebida, cuando presiono la opcion pizza me deja un casillero para rellenar el precio de venta, pero cuando la agrego al stock me vuelve a pedir el precio de venta, no tiene ningún sentido. El precio se pone solo en el tab de stock.

-En el wireframe error-form-stock se aprecia como el formulario dice "gusto o bebida" y combina todas las categorias que el local ofrece, lo cual es catastrofico pues si crece demasiado es super incomodo navegar entre todas los gustos de todas las categorías. Quiero que se separe en 2 forms donde el primero sea categoria, y el segundo sea gusto o bebida PERO DE LO SELECCIONADO EN CATEGORIA, es decir, que gusto o bebida solo muestre el gusto o la bebida disponible precargada en la categoria selecta, sin mezclar informacion.

-En estadisticas: "La jornada del local va de 7:00 a 6:59 del día siguiente, en hora de Argentina." este mensaje está completamente de sobra.

-En estadisticas, ver wireframe "espacio inecesario estadisticas", donde se ve como se deja un espacio arriba del todo innecesario que hace scrollear para ver informacion que ya podria aparecer si se usase bien ese espacio.

- En estadisticas, quiero invertir los lugares de los KPI de ganancia en limpio-ventas registradas-total facturado con los KPI de las comidas, las comidas deben ir arriba y lo otro abajo.

- En estadisticas, el KPI de ganancia en limpio tiene esto: "Lo facturado menos el costo para el local de lo vendido y las mermas." es completamente innecesario eso, quitarlo.

- En estadisticas, hay un KPI que dice total facturado solo para el recargo de las cuotas, tampoco tiene sentido, se tiene que ir entero ese KPI.

- En estadisticas, mira el wirefrime "referencia-de-otro-sistema", allí veras como pretendo que se vea el panel de estadísticas. Para introducir lo que estoy diciendo, esto es un gestor de stock que le hice a un cliente para manejar su ciber. Observa como luce. Como están acomodados los KPI. La idea es que las comidas queden arriba (como en el wirefrime de ejemplo lo están sus productos como servicio tecnico, tech, libreria...) y que ademas, dichas comidas tengan el borde de su KPI pintado, no el fondo completo, lo mismo aplica para las ventas procesadas y las ganancias. Además quiero deshacerme de los emojis unicode pues se ven muy feos. Prefiero mantener los de lucide-react, se ven mucho mas nativos. De lucid react quiero que tomes los iconos de pizza, sandwich, can-soda (para pepsi y cocacola), y para la empanada y la ciabatta, dejo en docs/wirerframes tambien dos imagenes que hice yo al estilo de lucide-react de ciabatta y empanada para que uses en su lugar, quitale el fondo y adaptalas al icono de su categoria. para el KPI de promos quiero el lucide-react de hand-coins.

- En estadisticas, el KPI de GANANCIA EN LIMPIO solo se tiene que llamar GANANCIA. además este tiene que estar rodeado de un color verde con el icono lucide react del dinero.

- En estadisticas, kpi ventas registradas debe estar rodeado de un azul de color en el marco, y con un icono que represente ventas, como un maletin, o un ticket. todo lucide react.

- En estadisticas, se va la frase "Dinero generado por comida".

- En ventas, el carrito que se va generando no me deja quitar de a un item, por ejemplo, si queria vender 3 pizzas y por accidente puse 4, tengo que eliminar las 4 de una y volver a poner 3 en vez de poner una sola, me gustaria poder quitar de a una.