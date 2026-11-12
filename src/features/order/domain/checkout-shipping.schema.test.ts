import { describe, expect, it } from 'vitest';
import { checkoutSchema } from './checkout.schema';

const ITEM = '11111111-1111-4111-8111-111111111111';
const LINE = { group: 'empanadas', presentationKey: 'u1', flavors: [{ menuItemId: ITEM, units: 1 }], quantity: 2 };
const BUYER = { customerId: null, name: 'Marta', phone: '', address: 'Mitre 123' };
const VALID = { checkoutKey: ITEM, buyer: BUYER, lines: [LINE], discountPercentage: 0, discountAmount: 0, payments: [{ type: 'efectivo', amount: 3000 }], shippingOptionId: ITEM };
const messages = (input: unknown): string[] => checkoutSchema.safeParse(input).error?.issues.map((issue) => issue.message) ?? [];

describe('el envío en lo que manda el navegador al cobrar (US-59)', () => {
  it('acepta un pedido con envío y domicilio, sin envío o con el envío en null', () => {
    expect(checkoutSchema.parse(VALID).shippingOptionId).toBe(ITEM);
    expect(messages({ ...VALID, shippingOptionId: null, buyer: { ...BUYER, address: '' } })).toEqual([]);
    const { shippingOptionId: _, ...withoutShipping } = VALID;
    expect(messages(withoutShipping)).toEqual([]);
  });

  it.each([
    { caso: 'envío sin domicilio', input: { ...VALID, buyer: { ...BUYER, address: '' } }, message: 'Anotá el domicilio para el envío' },
    { caso: 'envío con un domicilio de espacios', input: { ...VALID, buyer: { ...BUYER, address: '   ' } }, message: 'Anotá el domicilio para el envío' },
    { caso: 'envío que no es un id', input: { ...VALID, shippingOptionId: 'centro' }, message: 'Elegí un envío válido' },
  ])('rechaza $caso con el mensaje exacto (CA-2)', ({ input, message }) => {
    expect(messages(input)).toContain(message);
  });
});
