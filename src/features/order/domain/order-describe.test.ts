import { describe, expect, it } from 'vitest';
import { describeFlavors, describePresentation, describeSaleLine, describeSoldPresentation, missingLabel } from './order-describe';
import type { OrderLine } from './order-line';

const NAMES: Record<string, string> = { carne: 'Carne', pollo: 'Pollo', muzza: 'Muzza', napo: 'Napolitana' };
const nameOf = (id: string): string => NAMES[id] ?? id;
const line = (group: OrderLine['group'], presentationKey: string, flavors: OrderLine['flavors']): OrderLine => ({ id: 'l', group, presentationKey, flavors, quantity: 1 });

describe('cómo se lee una línea en el pedido', () => {
  it('surtida, de un gusto y mitad y mitad', () => {
    expect(describeFlavors(line('empanadas', 'u6', [{ menuItemId: 'carne', units: 2 }, { menuItemId: 'pollo', units: 4 }]), nameOf)).toBe('2 Carne + 4 Pollo');
    expect(describeFlavors(line('empanadas', 'u12', [{ menuItemId: 'carne', units: 12 }]), nameOf)).toBe('Carne');
    expect(describeFlavors(line('empanadas', 'u6', [{ menuItemId: 'carne', units: 2 }]), nameOf)).toBe('2 Carne');
    expect(describeFlavors(line('pizzas', 'pizza_2', [{ menuItemId: 'muzza', units: 0.5 }, { menuItemId: 'napo', units: 0.5 }]), nameOf)).toBe('Muzza / Napolitana');
  });

  it('nombra el grupo, la presentación y la cantidad', () => {
    expect(describePresentation(line('empanadas', 'u6', []))).toBe('Empanadas · ½ docena');
    expect(describePresentation({ ...line('coca_cola', 'u1', []), quantity: 3 })).toBe('Coca-Cola · 1 unidad × 3');
  });

  it('en el historial, una línea de promo dice "Promo" y su descripción (US-9)', () => {
    expect(describeSaleLine({ group: null, presentationKey: null, quantity: 1, description: 'Media + Coca: Carne · Coca 500' })).toBe('Promo: Media + Coca: Carne · Coca 500');
    expect(describeSoldPresentation({ group: null, presentationKey: null, quantity: 2 })).toBe('Promo × 2');
    expect(describeSaleLine({ group: 'pizzas', presentationKey: 'pizza_1', quantity: 1, description: 'Muzza' })).toBe('Pizzas · 1 sabor: Muzza');
  });

  it('dice qué falta para completar la línea', () => {
    expect(missingLabel(line('empanadas', 'u6', [{ menuItemId: 'carne', units: 2 }]))).toBe('faltan 4');
    expect(missingLabel(line('pizzas', 'pizza_2', [{ menuItemId: 'muzza', units: 0.5 }]))).toBe('falta el segundo sabor');
    expect(missingLabel(line('empanadas', 'u1', [{ menuItemId: 'carne', units: 1 }]))).toBeNull();
  });
});
