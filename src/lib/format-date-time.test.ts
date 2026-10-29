import { describe, expect, it } from 'vitest';
import { argentinaDay, argentinaHour, argentinaMonth, argentinaTime, formatDateTime } from './format-date-time';

describe('argentinaTime y argentinaHour (US-13)', () => {
  it('da la hora de Buenos Aires', () => {
    expect(argentinaTime('2026-10-26T03:30:00Z')).toBe('00:30');
    expect(argentinaTime(new Date('2026-10-25T19:59:00Z'))).toBe('16:59');
    expect(argentinaHour(new Date('2026-10-25T20:00:00Z'))).toBe(17);
    expect(argentinaTime('no-es-una-fecha')).toBe('—');
  });
});

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

describe('argentinaDay (US-7 CA-1)', () => {
  it('da el día de Buenos Aires en formato AAAA-MM-DD, aunque en UTC ya sea el día siguiente', () => {
    expect(argentinaDay('2026-10-25T02:30:00Z')).toBe('2026-10-24');
    expect(argentinaDay(new Date('2026-10-25T03:00:00Z'))).toBe('2026-10-25');
    expect(argentinaDay('no-es-una-fecha')).toBe('');
  });
});

describe('argentinaMonth (US-33)', () => {
  it.each([
    { utc: '2028-02-10T12:00:00Z', start: '2028-02-01', end: '2028-02-29' },
    { utc: '2026-12-15T12:00:00Z', start: '2026-12-01', end: '2026-12-31' },
    { utc: '2026-11-01T02:30:00Z', start: '2026-10-01', end: '2026-10-31' },
    { utc: '2026-04-01T03:00:00Z', start: '2026-04-01', end: '2026-04-30' },
  ])('el mes de $utc en Buenos Aires va del $start al $end', ({ utc, start, end }) => {
    expect(argentinaMonth(new Date(utc))).toEqual({ start, end });
  });
});
