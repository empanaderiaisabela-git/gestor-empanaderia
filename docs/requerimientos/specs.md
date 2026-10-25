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

Regla de negocio para elegir sabores PIZZAS: debe tener solo la opción de 1 gusto de  pizza o 2 gustos de  pizzas PARA LA MISMA PIZZA; de elegir una venta de pizza con un solo gusto, se despliega la lista de gustos y se elije 1; de elegir una venta de pizza de 2 gustos, se despliega la lista de gustos y se eligen 2. Si se eligen 2, el precio final de esa pizza de doble gusto, es el precio del sabor de pizza mas caro, ej: mozzarella y J&Q, mozzarella sale 10, J&Q sale 5, precio final de una pizza mitad mozzarella y mitad J&Q = 10.

Regla de negocio para elegir sabores SANDWICH: se suman de a unidades 

Regla de negocio para elegir sabores Ciabatta: se suman de a unidades 

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

Finalmente, una vez agregada, esta va seleccionada

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