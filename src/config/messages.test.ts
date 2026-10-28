import { describe, expect, it } from 'vitest';
import { MESSAGES } from './messages';

const { SUCCESS, ERROR } = MESSAGES;

describe('mensajes que concuerdan con la entidad (BUG-19)', () => {
  it.each([
    { entity: 'la tarjeta', created: 'Se registró la tarjeta', notFound: 'La tarjeta ya no existe.', generic: 'Ocurrió un error inesperado al procesar la tarjeta.' },
    { entity: 'el proveedor', created: 'Se registró el proveedor', notFound: 'El proveedor ya no existe.', generic: 'Ocurrió un error inesperado al procesar el proveedor.' },
  ])('se leen bien con "$entity"', ({ entity, created, notFound, generic }) => {
    expect(SUCCESS.CREATED(entity)).toBe(created);
    expect(ERROR.DATABASE.NOT_FOUND(entity)).toBe(notFound);
    expect(ERROR.DATABASE.GENERIC(entity)).toBe(generic);
  });

  it('cada aviso de éxito usa su verbo', () => {
    expect(SUCCESS.UPDATED('la venta')).toBe('Se actualizó la venta');
    expect(SUCCESS.DELETED('el gasto')).toBe('Se eliminó el gasto');
    expect(SUCCESS.ACTIVATED('la promoción')).toBe('Se activó la promoción');
    expect(SUCCESS.DEACTIVATED('el producto')).toBe('Se desactivó el producto');
    expect(SUCCESS.REACTIVATED('el cliente')).toBe('Se reactivó el cliente que ya existía, con los datos nuevos');
  });

  it('ninguna plantilla deja "el/la" ni terminaciones "/a"', () => {
    const templates = [...Object.values(SUCCESS), ERROR.DATABASE.NOT_FOUND, ERROR.DATABASE.GENERIC];
    for (const template of templates) expect(template('la venta')).not.toMatch(/el\/la|\/a\b/i);
  });
});
