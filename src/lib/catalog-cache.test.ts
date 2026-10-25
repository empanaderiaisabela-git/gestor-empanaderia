import { beforeEach, describe, expect, it, vi } from 'vitest';
import { afterCatalogChange, CATALOG_PATH, revalidateCatalog } from './catalog-cache';

const revalidatePath = vi.hoisted(() => vi.fn());

vi.mock('next/cache', () => ({ revalidatePath }));

describe('revalidación a demanda del catálogo (T-11)', () => {
  beforeEach(() => {
    revalidatePath.mockReset();
  });

  it('invalida la página del catálogo público', () => {
    revalidateCatalog();
    expect(revalidatePath).toHaveBeenCalledExactlyOnceWith('/home');
    expect(CATALOG_PATH).toBe('/home');
  });

  it('después de una mutación exitosa invalida el catálogo y devuelve el mismo resultado', () => {
    const result = { success: true, message: 'ok' };
    expect(afterCatalogChange(result)).toBe(result);
    expect(revalidatePath).toHaveBeenCalledExactlyOnceWith('/home');
  });

  it('si la mutación falló no invalida nada', () => {
    const result = { success: false, error: 'no' };
    expect(afterCatalogChange(result)).toBe(result);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
