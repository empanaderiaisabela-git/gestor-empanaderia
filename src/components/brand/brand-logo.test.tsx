import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandLogo } from './brand-logo';

describe('BrandLogo (US-1)', () => {
  it('muestra el logo y el nombre de la empanadería', () => {
    render(<BrandLogo />);
    expect(screen.getByRole('img', { name: 'Empanadería Isabela' }).getAttribute('src')).toBe('/brand/logo-isabela.png');
    expect(screen.getByText('Empanadería Isabela')).toBeDefined();
  });

  it('puede mostrar sólo el logo', () => {
    render(<BrandLogo showName={false} />);
    expect(screen.getByRole('img', { name: 'Empanadería Isabela' })).toBeDefined();
    expect(screen.queryByText('Empanadería Isabela')).toBeNull();
  });
});
