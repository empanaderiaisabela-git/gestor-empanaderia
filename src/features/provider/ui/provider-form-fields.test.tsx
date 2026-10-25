import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import type { ProviderInput } from '@/features/provider/domain/provider.schema';
import { ProviderFormFields } from './provider-form-fields';

function Harness({ errors }: { errors: Partial<Record<keyof ProviderInput, string>> }): JSX.Element {
  const { register } = useForm<ProviderInput>();
  const fieldErrors = Object.fromEntries(Object.entries(errors).map(([field, message]) => [field, { type: 'manual', message }]));
  return <ProviderFormFields register={register} errors={fieldErrors} />;
}

describe('ProviderFormFields', () => {
  it('muestra los tres campos sin errores', () => {
    render(<Harness errors={{}} />);
    expect(screen.getByPlaceholderText('Ej: Accesorios del Sur SRL')).toBeDefined();
    expect(screen.getByPlaceholderText('+54 9 11 1234-5678')).toBeDefined();
    expect(screen.getByPlaceholderText('ventas@distribuidora.com')).toBeDefined();
    expect(screen.queryByText(/obligatorio/)).toBeNull();
  });

  it('muestra el mensaje de validación de cada campo', () => {
    render(<Harness errors={{ name: 'El nombre es obligatorio', email: 'Email inválido' }} />);
    expect(screen.getByText('El nombre es obligatorio')).toBeDefined();
    expect(screen.getByText('Email inválido')).toBeDefined();
  });
});
