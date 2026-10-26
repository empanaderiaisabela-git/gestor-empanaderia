import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CardPlanFields } from './card-plan-fields';

const ONE = { installments: '1', surchargePct: '0' };

describe('planes de una tarjeta en el formulario (US-10 CA-1)', () => {
  it('ofrece 1, 3, 6 y 12 cuotas y cambia las cuotas y el recargo', () => {
    const onChange = vi.fn();
    render(<CardPlanFields plans={[ONE]} onChange={onChange} />);
    expect(Array.from(screen.getByLabelText('Cuotas del plan 1').querySelectorAll('option')).map((option) => option.textContent)).toEqual(['1 cuota', '3 cuotas', '6 cuotas', '12 cuotas']);
    fireEvent.change(screen.getByLabelText('Cuotas del plan 1'), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText('Recargo % del plan 1'), { target: { value: '15' } });
    expect(onChange.mock.calls).toEqual([[[{ installments: '6', surchargePct: '0' }]], [[{ installments: '1', surchargePct: '15' }]]]);
  });

  it('agrega un plan con las primeras cuotas libres, quita planes y muestra el error', () => {
    const onChange = vi.fn();
    render(<CardPlanFields plans={[ONE]} error='Agregá al menos un plan de cuotas' onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Agregar plan/ }));
    fireEvent.click(screen.getByTitle('Quitar plan'));
    expect(onChange.mock.calls).toEqual([[[ONE, { installments: '3', surchargePct: '0' }]], [[]]]);
    expect(screen.getByText('Agregá al menos un plan de cuotas')).toBeDefined();
  });

  it('con los cuatro planes ya no deja agregar', () => {
    const plans = ['1', '3', '6', '12'].map((installments) => ({ installments, surchargePct: '0' }));
    render(<CardPlanFields plans={plans} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Agregar plan/ }).hasAttribute('disabled')).toBe(true);
  });
});
