import { beforeEach, describe, expect, it } from 'vitest';
import { useOrderStore } from './order.store';

const state = () => useOrderStore.getState();
const summary = (): string[] => state().lines.map((line) => `${line.presentationKey}×${line.quantity}:${line.flavors.map((flavor) => `${flavor.units} ${flavor.menuItemId}`).join('+')}`);

describe('pedido actual (US-5)', () => {
  beforeEach(() => {
    state().clear();
  });

  it('½ docena surtida: +1 carne, +1 carne, completar con pollo; queda abierta otra ½ docena vacía', () => {
    state().start('empanadas', 'u6');
    state().add('carne', 'one');
    state().add('carne', 'one');
    expect(state().add('pollo', 'rest')).toBe(true);
    expect(summary()).toEqual(['u6×1:2 carne+4 pollo', 'u6×1:']);
    state().close();
    expect(summary()).toEqual(['u6×1:2 carne+4 pollo']);
  });

  it('quitar uno resta una unidad, y con una sola quita la línea (US-22, D-2)', () => {
    state().start('empanadas', 'u1');
    ['carne', 'carne', 'carne', 'carne'].forEach((id) => state().add(id, 'one'));
    state().close();
    const [line] = state().lines;
    state().removeOne(line.id);
    expect(summary()).toEqual(['u1×3:1 carne']);
    state().removeOne(line.id);
    state().removeOne(line.id);
    state().removeOne(line.id);
    expect(state().lines).toEqual([]);
  });

  it('cada empanada suelta se guarda con su gusto y las iguales se suman', () => {
    state().start('empanadas', 'u1');
    state().add('carne', 'one');
    state().add('carne', 'one');
    state().add('humita', 'one');
    state().close();
    expect(summary()).toEqual(['u1×2:1 carne', 'u1×1:1 humita']);
  });

  it('una línea a medio armar queda en el pedido al cerrar la lista (luego bloquea el cobro)', () => {
    state().start('sanguches', 'u3');
    state().add('primavera', 'one');
    state().close();
    expect(summary()).toEqual(['u3×1:1 primavera']);
    expect(state().openLineId).toBeNull();
  });

  it('no deja agregar más de lo que entra ni repetir sabor en la mitad y mitad', () => {
    state().start('pizzas', 'pizza_2');
    state().add('muzza', 'one');
    expect(state().add('muzza', 'one')).toBe(false);
    state().add('napo', 'one');
    expect(summary()).toEqual(['pizza_2×1:0.5 muzza+0.5 napo', 'pizza_2×1:']);
  });

  it('sin una línea abierta no se agrega nada', () => {
    expect(state().add('carne', 'one')).toBe(false);
  });

  it('quitar una línea, cargar el comprador y vaciar todo', () => {
    state().start('coca_cola', 'u1');
    state().add('coca', 'one');
    state().close();
    state().setBuyerName('Juan');
    state().remove(state().lines[0].id);
    expect(state().lines).toEqual([]);
    expect(state().buyerName).toBe('Juan');
    state().clear();
    expect(state().buyerName).toBe('');
  });
});
