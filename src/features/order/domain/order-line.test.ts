import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { addFlavor, isComplete, mergeLine, type OrderLine, remaining, removeFlavor, unitsIn } from './order-line';

const line = (group: OrderLine['group'], presentationKey: string, flavors: OrderLine['flavors'] = []): OrderLine => ({ id: crypto.randomUUID(), group, presentationKey, flavors, quantity: 1 });
const MEDIA_DOCENA = line('empanadas', 'u6');

describe('armar una línea del pedido (US-5 CA-2 y CA-3)', () => {
  it('"Completar" con un gusto llena toda la presentación: ½ docena de carne', () => {
    const full = addFlavor(MEDIA_DOCENA, 'carne', 'rest');
    expect(full?.flavors).toEqual([{ menuItemId: 'carne', units: 6 }]);
    expect(full && isComplete(full)).toBe(true);
  });

  it('surtida con "Agregar uno": 2 de carne y completar con pollo = 2 + 4', () => {
    const two = addFlavor(addFlavor(MEDIA_DOCENA, 'carne', 'one') ?? MEDIA_DOCENA, 'carne', 'one') ?? MEDIA_DOCENA;
    expect(remaining(two)).toBe(4);
    expect(isComplete(two)).toBe(false);
    const full = addFlavor(two, 'pollo', 'rest');
    expect(full?.flavors).toEqual([{ menuItemId: 'carne', units: 2 }, { menuItemId: 'pollo', units: 4 }]);
  });

  it('una presentación llena no acepta más gustos', () => {
    const full = addFlavor(line('sanguches', 'u3'), 'primavera', 'rest');
    expect(full && addFlavor(full, 'jyq', 'one')).toBeNull();
  });

  it('1 unidad se completa con un solo gusto (ciabatta, bebida, empanada suelta)', () => {
    expect(addFlavor(line('ciabattas', 'u1'), 'bondiola', 'one')).toMatchObject({ flavors: [{ menuItemId: 'bondiola', units: 1 }] });
    expect(addFlavor(line('coca_cola', 'u1'), 'coca', 'rest')).toMatchObject({ flavors: [{ menuItemId: 'coca', units: 1 }] });
  });

  it('pizza de 2 sabores: dos mitades de gustos distintos', () => {
    const half = addFlavor(line('pizzas', 'pizza_2'), 'muzza', 'rest');
    expect(half?.flavors).toEqual([{ menuItemId: 'muzza', units: 0.5 }]);
    expect(half && addFlavor(half, 'muzza', 'one')).toBeNull();
    const full = half && addFlavor(half, 'napo', 'one');
    expect(full && isComplete(full)).toBe(true);
  });

  it('pizza de 1 sabor: un gusto y lista', () => {
    const full = addFlavor(line('pizzas', 'pizza_1'), 'muzza', 'one');
    expect(full && [isComplete(full), unitsIn(full)]).toEqual([true, 1]);
  });

  it('una presentación inexistente no arma nada', () => {
    expect(addFlavor(line('pizzas', 'u12'), 'muzza', 'one')).toBeNull();
    expect(isComplete(line('pizzas', 'u12', [{ menuItemId: 'x', units: 12 }]))).toBe(false);
  });

  it('fuzz: por más gustos que se agreguen, nunca se supera la presentación', () => {
    const pick = fc.record({ flavor: fc.constantFrom('a', 'b', 'c'), mode: fc.constantFrom<'one' | 'rest'>('one', 'rest') });
    fc.assert(
      fc.property(fc.constantFrom('u1', 'u3', 'u6', 'u12'), fc.array(pick, { maxLength: 20 }), (key, picks) => {
        const built = picks.reduce((current, { flavor, mode }) => addFlavor(current, flavor, mode) ?? current, line('empanadas', key));
        return remaining(built) >= 0;
      })
    );
  });
});

describe('"Quitar uno" resta una unidad de un gusto (US-39 CA-3)', () => {
  it('resta una unidad y, si era la última, saca el gusto; un gusto que no está no cambia nada', () => {
    const surtida = line('empanadas', 'u6', [{ menuItemId: 'carne', units: 2 }, { menuItemId: 'pollo', units: 1 }]);
    expect(removeFlavor(surtida, 'carne')?.flavors).toEqual([{ menuItemId: 'carne', units: 1 }, { menuItemId: 'pollo', units: 1 }]);
    expect(removeFlavor(surtida, 'pollo')?.flavors).toEqual([{ menuItemId: 'carne', units: 2 }]);
    expect(removeFlavor(surtida, 'humita')).toBeNull();
  });

  it('en una pizza de 2 sabores saca la mitad entera', () => {
    const mitad = line('pizzas', 'pizza_2', [{ menuItemId: 'muzza', units: 0.5 }]);
    expect(removeFlavor(mitad, 'muzza')?.flavors).toEqual([]);
  });

  it('fuzz: agregar uno y quitar uno deja la línea como estaba', () => {
    const pick = fc.record({ flavor: fc.constantFrom('a', 'b', 'c'), mode: fc.constantFrom<'one' | 'rest'>('one', 'rest') });
    fc.assert(
      fc.property(fc.constantFrom('u3', 'u6', 'u12'), fc.array(pick, { maxLength: 8 }), fc.constantFrom('a', 'b', 'c'), (key, picks, flavor) => {
        const built = picks.reduce((current, { flavor: id, mode }) => addFlavor(current, id, mode) ?? current, line('empanadas', key));
        const added = addFlavor(built, flavor, 'one');
        return added === null || JSON.stringify(removeFlavor(added, flavor)) === JSON.stringify(built);
      })
    );
  });
});

describe('líneas iguales se suman (US-5 CA-5)', () => {
  it('dos ½ docenas de carne quedan como una línea con cantidad 2', () => {
    const first = addFlavor(MEDIA_DOCENA, 'carne', 'rest') ?? MEDIA_DOCENA;
    const second = addFlavor(line('empanadas', 'u6'), 'carne', 'rest') ?? MEDIA_DOCENA;
    const merged = mergeLine([first, second], second);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ id: first.id, quantity: 2 });
  });

  it('una línea incompleta no se fusiona: se actualiza en su lugar', () => {
    const open = addFlavor(MEDIA_DOCENA, 'carne', 'one') ?? MEDIA_DOCENA;
    expect(mergeLine([open], open)).toEqual([open]);
  });
});
