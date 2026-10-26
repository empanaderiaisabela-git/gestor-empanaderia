import { beforeEach, describe, expect, it } from 'vitest';
import { useOrderStore } from './order.store';

const state = () => useOrderStore.getState();
const PROMO = {
  id: 'p1',
  name: 'Media + 2 Coca',
  price: 9000,
  components: [
    { group: 'empanadas' as const, presentationKey: 'u6', quantity: 1 },
    { group: 'coca_cola' as const, presentationKey: 'u1', quantity: 2 },
  ],
};

describe('promos en el pedido actual (US-9 CA-1 y CA-2)', () => {
  beforeEach(() => state().clear());

  it('al elegir una promo queda en el pedido con su primer producto abierto, y cierra la línea común abierta', () => {
    state().start('empanadas', 'u1');
    state().startPromo(PROMO);
    expect(state().promos).toHaveLength(1);
    expect(state().openPromo).toEqual({ promoId: state().promos[0].id, part: 0 });
    expect(state().openLineId).toBeNull();
  });

  it('al completar un producto pasa al siguiente y al terminar se cierra la lista', () => {
    state().startPromo(PROMO);
    state().addToOpenPromo('carne', 'one');
    expect(state().openPromo?.part).toBe(0);
    state().addToOpenPromo('pollo', 'rest');
    expect(state().openPromo?.part).toBe(1);
    state().addToOpenPromo('coca', 'one');
    state().addToOpenPromo('sprite', 'one');
    expect(state().openPromo).toBeNull();
    expect(state().promos[0].parts.map((part) => part.flavors.map((flavor) => flavor.menuItemId))).toEqual([['carne', 'pollo'], ['coca'], ['sprite']]);
  });

  it('una promo a medio armar se puede retomar donde quedó, y se puede quitar', () => {
    state().startPromo(PROMO);
    state().addToOpenPromo('carne', 'rest');
    state().close();
    expect(state().openPromo).toBeNull();
    const id = state().promos[0].id;
    state().reopenPromo(id);
    expect(state().openPromo).toEqual({ promoId: id, part: 1 });
    state().removePromo(id);
    expect([state().promos, state().openPromo]).toEqual([[], null]);
  });

  it('se pueden sumar varias promos iguales; sin una promo abierta no se agrega nada', () => {
    expect(state().addToOpenPromo('coca', 'one')).toBe(false);
    state().startPromo(PROMO);
    state().startPromo(PROMO);
    expect(state().promos.map((promo) => promo.name)).toEqual([PROMO.name, PROMO.name]);
    state().clear();
    expect(state().promos).toEqual([]);
  });
});
