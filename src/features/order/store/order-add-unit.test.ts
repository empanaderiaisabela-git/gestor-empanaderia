import { beforeEach, describe, expect, it } from 'vitest';
import { useOrderStore } from './order.store';

const state = () => useOrderStore.getState();
const summary = (): string[] => state().lines.map((line) => `${line.presentationKey}×${line.quantity}:${line.flavors.map((flavor) => `${flavor.units} ${flavor.menuItemId}`).join('+')}`);

function addLine(presentationKey: string, menuItemId: string): void {
  state().start('empanadas', presentationKey);
  state().add(menuItemId, 'rest');
  state().close();
}

describe('"+" del ítem agrupado: suma 1 unidad (US-64 CA-2)', () => {
  beforeEach(() => {
    state().clear();
  });

  it('a una ½ docena sola le agrega un renglón de 1 unidad del mismo gusto', () => {
    addLine('u6', 'jyq');
    state().addUnit(state().lines[0].id);
    expect(summary()).toEqual(['u6×1:6 jyq', 'u1×1:1 jyq']);
  });

  it('si ya hay unidades sueltas del gusto, suma una más ahí (7 → 8: ½ docena + 2 unidades)', () => {
    addLine('u6', 'jyq');
    addLine('u1', 'jyq');
    state().addUnit(state().lines[0].id);
    expect(summary()).toEqual(['u6×1:6 jyq', 'u1×2:1 jyq']);
  });

  it('con un id que no existe no hace nada', () => {
    addLine('u6', 'jyq');
    state().addUnit('otro');
    expect(summary()).toEqual(['u6×1:6 jyq']);
  });
});
