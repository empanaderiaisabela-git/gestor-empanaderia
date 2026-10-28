import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Ciabatta } from './ciabatta';
import { Empanada } from './empanada';

describe('íconos propios (US-20)', () => {
  it.each([
    { Icon: Empanada, name: 'empanada' },
    { Icon: Ciabatta, name: 'ciabatta' },
  ])('$name se dibuja como un ícono de lucide', ({ Icon, name }) => {
    const { container } = render(<Icon className='w-5 h-5' aria-hidden='true' />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain(`lucide lucide-${name}`);
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
    expect(svg?.querySelectorAll('path').length).toBeGreaterThan(1);
  });
});
