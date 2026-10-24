import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { renderProductCard } from '@/config/cards/product-card';
import { getProductColumns } from '@/config/tables/product-columns';
import type { ProductDef } from './product.schema';
import { canManagePhotos } from './product-permissions';

const PRODUCT: ProductDef = {
  id: 'producto-1',
  deviceId: 'categoria-1',
  providerId: 'proveedor-1',
  description: 'Empanada de carne',
  purchasePrice: 500,
  salePrice: 900,
  stock: 10,
  showOnLanding: true,
  version: 1,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

const noop = (): void => undefined;
const handlers = { onLoss: noop, onEdit: noop, onDelete: noop, onToggleVisibility: noop, onManagePhotos: noop };

function tableActionsHtml(role: string): string {
  const actions = getProductColumns({ role, ...handlers }).at(-1);
  return actions ? renderToStaticMarkup(actions.cell(PRODUCT)) : '';
}

function cardMenuHtml(role: string): string {
  const card = renderProductCard({ role, ...handlers })(PRODUCT);
  return renderToStaticMarkup(card.props.actions);
}

describe('quién gestiona las fotos de un producto', () => {
  it.each([
    { role: 'admin', expected: true },
    { role: 'vendedor', expected: true },
    { role: undefined, expected: false },
    { role: 'otro', expected: false },
  ])('canManagePhotos($role) es $expected', ({ role, expected }) => {
    expect(canManagePhotos(role)).toBe(expected);
  });

  it.each(['admin', 'vendedor'])('BUG-1 CA-3: %s ve el botón de fotos en la tabla de productos', (role) => {
    expect(tableActionsHtml(role)).toContain('title="Gestionar Fotos"');
  });

  it.each(['admin', 'vendedor'])('BUG-1 CA-3: %s ve el botón de fotos en la tarjeta de productos', (role) => {
    expect(cardMenuHtml(role)).toContain('Gestionar Fotos');
  });

  it('sin rol no se muestra el botón de fotos ni en la tabla ni en la tarjeta', () => {
    expect(tableActionsHtml('')).not.toContain('title="Gestionar Fotos"');
    expect(cardMenuHtml('')).not.toContain('Gestionar Fotos');
  });
});
