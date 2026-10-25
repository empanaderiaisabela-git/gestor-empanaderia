import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LoginPage from './page';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/features/auth/actions/auth.actions', () => ({ loginAction: vi.fn() }));

describe('pantalla de login (US-1 CA-4)', () => {
  it('muestra el logo y da la bienvenida a Empanadería Isabela', () => {
    render(<LoginPage />);
    expect(screen.getByRole('img', { name: 'Empanadería Isabela' }).getAttribute('src')).toBe('/brand/logo-isabela.png');
    expect(screen.getByRole('heading', { name: 'Bienvenido a Empanadería Isabela' })).toBeDefined();
  });
});
