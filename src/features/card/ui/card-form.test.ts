import { describe, expect, it } from 'vitest';
import { initialValues, nextPlan, parseCreate, parseUpdate } from './card-form';

const VALUES = { name: 'Visa', plans: [{ installments: '3', surchargePct: '10,5' }] };

describe('formulario de Tarjetas (US-10 CA-1)', () => {
  it('cada plan nuevo propone las primeras cuotas libres, sin recargo', () => {
    expect(nextPlan([])).toEqual({ installments: '1', surchargePct: '0' });
    expect(nextPlan([{ installments: '1', surchargePct: '0' }, { installments: '3', surchargePct: '5' }])).toEqual({ installments: '6', surchargePct: '0' });
  });

  it('una tarjeta nueva arranca con un plan; al editar trae lo guardado', () => {
    expect(initialValues(null)).toEqual({ name: '', plans: [{ installments: '1', surchargePct: '0' }] });
    const card = { id: 'c', name: 'Visa', isActive: true, version: 2, plans: [{ installments: 3, surchargePct: 10.5 }], createdAt: '', updatedAt: '' };
    expect(initialValues(card)).toEqual({ name: 'Visa', plans: [{ installments: '3', surchargePct: '10.5' }] });
  });

  it('convierte el recargo con coma y las cuotas a número; al editar manda la versión', () => {
    expect(parseCreate(VALUES)).toEqual({ ok: true, input: { name: 'Visa', plans: [{ installments: 3, surchargePct: 10.5 }] } });
    expect(parseUpdate(VALUES, 4)).toMatchObject({ ok: true, input: { version: 4 } });
  });

  it('marca el error del nombre y de los planes', () => {
    expect(parseCreate({ name: '', plans: [] })).toEqual({ ok: false, errors: { name: 'El nombre es obligatorio', plans: 'Agregá al menos un plan de cuotas' } });
    expect(parseCreate({ ...VALUES, plans: [{ installments: '3', surchargePct: '150' }] })).toMatchObject({ ok: false, errors: { plans: 'El recargo va de 0 a 100 %' } });
  });
});
