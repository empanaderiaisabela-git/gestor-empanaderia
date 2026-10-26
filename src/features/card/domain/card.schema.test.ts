import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { cardCreateSchema, cardDeleteSchema, cardRowSchema, cardToggleSchema, cardUpdateSchema } from './card.schema';

const PLANS = [{ installments: 1, surchargePct: 0 }, { installments: 3, surchargePct: 10.5 }];
const CARD = { name: 'Visa', plans: PLANS };
const ID = '11111111-1111-4111-8111-111111111111';

function messages(input: unknown): string[] {
  const result = cardCreateSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('cardCreateSchema (US-10 CA-1)', () => {
  it('acepta una tarjeta con planes de 1 y 3 cuotas y recargo con decimales', () => {
    expect(cardCreateSchema.parse({ ...CARD, name: '  Visa  ' })).toEqual(CARD);
  });

  it('acepta los cuatro planes y los límites del recargo (0 y 100)', () => {
    const plans = [1, 3, 6, 12].map((installments, index) => ({ installments, surchargePct: index === 3 ? 100 : 0 }));
    expect(messages({ name: 'A'.repeat(40), plans })).toEqual([]);
  });

  it.each([
    { caso: 'sin planes', input: { ...CARD, plans: [] }, message: 'Agregá al menos un plan de cuotas' },
    { caso: '2 cuotas', input: { ...CARD, plans: [{ installments: 2, surchargePct: 0 }] }, message: 'Elegí 1, 3, 6 o 12 cuotas' },
    { caso: 'cuotas repetidas', input: { ...CARD, plans: [PLANS[1], PLANS[1]] }, message: 'Esas cuotas ya están en la tarjeta' },
    { caso: 'recargo negativo', input: { ...CARD, plans: [{ installments: 1, surchargePct: -1 }] }, message: 'El recargo va de 0 a 100 %' },
    { caso: 'recargo de 101', input: { ...CARD, plans: [{ installments: 1, surchargePct: 101 }] }, message: 'El recargo va de 0 a 100 %' },
    { caso: 'recargo con 3 decimales', input: { ...CARD, plans: [{ installments: 1, surchargePct: 1.555 }] }, message: 'Máximo 2 decimales' },
    { caso: 'nombre vacío', input: { ...CARD, name: ' ' }, message: 'El nombre es obligatorio' },
    { caso: 'nombre de 41', input: { ...CARD, name: 'A'.repeat(41) }, message: 'El nombre no puede superar los 40 caracteres' },
  ])('rechaza $caso con el mensaje exacto', ({ input, message }) => {
    expect(messages(input)).toContain(message);
  });

  it('rechaza campos de más, también dentro de un plan (strictObject)', () => {
    expect(cardCreateSchema.safeParse({ ...CARD, isActive: true }).success).toBe(false);
    expect(cardCreateSchema.safeParse({ ...CARD, plans: [{ ...PLANS[0], amount: 1 }] }).success).toBe(false);
  });

  it('fuzz: ninguna entrada arbitraria hace lanzar al schema', () => {
    fc.assert(fc.property(fc.anything(), (input) => typeof cardCreateSchema.safeParse(input).success === 'boolean'));
  });
});

describe('schemas de edición, activación, borrado y fila', () => {
  it('editar pide todo de nuevo más la versión', () => {
    expect(cardUpdateSchema.safeParse({ ...CARD, version: 1 }).success).toBe(true);
    expect(cardUpdateSchema.safeParse(CARD).success).toBe(false);
  });

  it('activar y borrar exigen un id válido y una versión de al menos 1', () => {
    expect(cardToggleSchema.safeParse({ id: ID, isActive: false, version: 1 }).success).toBe(true);
    expect(cardDeleteSchema.safeParse({ id: 'x', version: 1 }).success).toBe(false);
  });

  it('la fila convierte a número el recargo que Postgres devuelve como texto', () => {
    const row = { id: ID, name: 'Visa', isActive: true, version: 1, plans: [{ installments: 3, surchargePct: '10.50' }], createdAt: new Date(0), updatedAt: new Date(0) };
    expect(cardRowSchema.parse(row)).toMatchObject({ plans: [{ installments: 3, surchargePct: 10.5 }] });
  });
});
