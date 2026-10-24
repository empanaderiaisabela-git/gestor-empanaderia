import { describe, expect, it } from 'vitest';
import { formatDateTime } from './format-date-time';

describe('formatDateTime (T-4 CA-3)', () => {
  it.each([
    { utc: '2026-10-24T03:30:00Z', expected: '24/10/2026, 00:30' },
    { utc: '2026-01-01T02:59:00Z', expected: '31/12/2025, 23:59' },
    { utc: '2026-07-09T23:05:00Z', expected: '09/07/2026, 20:05' },
  ])('muestra $utc en hora de Buenos Aires: $expected', ({ utc, expected }) => {
    expect(formatDateTime(utc)).toBe(expected);
    expect(formatDateTime(new Date(utc))).toBe(expected);
  });

  it('muestra un guion si la fecha no es válida', () => {
    expect(formatDateTime('no-es-una-fecha')).toBe('—');
  });
});
