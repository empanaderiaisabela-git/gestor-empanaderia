import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MainLayout from './layout';

vi.mock('next/navigation', () => ({ usePathname: () => '/clientes', useRouter: () => ({ push: vi.fn() }) }));
vi.mock('next-themes', () => ({ useTheme: () => ({ theme: 'light', setTheme: vi.fn(), resolvedTheme: 'light' }) }));
vi.mock('@/features/auth/actions/auth.actions', () => ({ logoutAction: vi.fn() }));

describe('layout del panel (US-1 CA-4)', () => {
  it('el sidebar muestra el logo y el nombre de la empanadería, sin la marca vieja', () => {
    render(
      <MainLayout>
        <p>contenido</p>
      </MainLayout>
    );
    expect(screen.getByRole('img', { name: 'Empanadería Isabela' })).toBeDefined();
    expect(screen.getByText('Empanadería Isabela')).toBeDefined();
    expect(screen.queryByText('ArgenStock')).toBeNull();
    expect(screen.getByText('contenido')).toBeDefined();
  });
});
