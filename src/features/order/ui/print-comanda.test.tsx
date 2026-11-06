import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { saleDef } from '../testing/sale-fixtures';
import { printComanda } from './print-comanda';
import { SaleButtons } from './sale-history-columns';

function fakePopup() {
  const frame = document.createElement('iframe');
  document.body.appendChild(frame);
  const popup = frame.contentWindow;
  if (!popup) throw new Error('sin ventana');
  const print = vi.spyOn(popup, 'print').mockImplementation(() => undefined);
  const listen = vi.spyOn(popup, 'addEventListener');
  vi.spyOn(window, 'open').mockReturnValue(popup);
  return { document: popup.document, print, addEventListener: listen };
}

describe('imprimir la comanda (US-65 CA-2)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('el botón de cada venta abre la comanda en una ventana aparte y pide imprimirla', () => {
    const popup = fakePopup();
    render(<SaleButtons sale={saleDef()} actions={{ isAdmin: false, onReceipt: vi.fn(), onVoid: vi.fn() }} />);
    fireEvent.click(screen.getByTitle('Imprimir comanda'));
    expect(popup.document.title).toBe('Comanda #000143');
    expect(popup.document.querySelector('pre')?.textContent).toContain('NRO PEDIDO: #000143');
    expect(popup.print).toHaveBeenCalledOnce();
    expect(popup.addEventListener).toHaveBeenCalledWith('afterprint', expect.any(Function));
  });

  it('los datos del cliente van como texto, nunca como HTML', () => {
    const popup = fakePopup();
    printComanda(saleDef({ buyerName: '<img src=x onerror=alert(1)>' }));
    expect(popup.document.querySelector('img')).toBeNull();
    expect(popup.document.querySelector('pre')?.textContent).toContain('<img');
  });

  it('si el navegador bloquea la ventana, no hace nada', () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    expect(() => printComanda(saleDef())).not.toThrow();
  });
});
