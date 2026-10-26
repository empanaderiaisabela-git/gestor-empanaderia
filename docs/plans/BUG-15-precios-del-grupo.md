# Plan: BUG-15 — Los precios del grupo borran lo que se está escribiendo

- **Ítem del backlog**: BUG-15
- **Autor**: Agente · **Fecha**: 2026-10-26 · **Estado**: Aprobado (plan nocturno del Sprint 2: el dev autorizó
  decidir dudas nuevas y cerrar el sprint sólo con todo en verde)
- **Rama**: `fix/bug-15-precios-del-grupo`

## Objetivo

Que la tarjeta "Precios de venta de <grupo>" de Alta de productos no pise lo que el admin está escribiendo, y que
`menu-panel.test.tsx` deje de fallar a veces en el CI. Sin esto, el CI de `develop` no está en verde y el Sprint 2 no
se puede cerrar en `main`.

## Causa

`GroupPriceCard` copia `current` (los precios guardados) a su estado con un `useEffect` que corre al montarse y cada
vez que `current` cambia de objeto. `useGroupPriceSaver` recarga los precios de todos los grupos después de guardar
uno, así que todas las tarjetas reciben objetos nuevos y vuelven a copiar, aunque sus precios no cambiaron. En el CI,
el efecto del montaje llega tarde y borra el primer precio que escribió el test.

## Cambio

- `group-price-card.tsx`: sin `useEffect`. El estado se inicializa con `current` una sola vez.
- `menu-panel.tsx`: la tarjeta lleva `key={`${group}-${version}`}`, así se vuelve a armar con los precios nuevos
  cuando cambia la versión guardada de ese grupo (el patrón de React "reiniciar el estado con una key").

## Tests

- `group-price-card.test.tsx` (regresión BUG-15): con lo escrito en la tarjeta, recibir los mismos precios en un
  objeto nuevo no lo borra. Falla con el código de hoy.
- `menu-panel.test.tsx` (regresión BUG-15): al guardar los precios de las empanadas, la tarjeta muestra los precios
  guardados y deja de decir "Sin precio".
