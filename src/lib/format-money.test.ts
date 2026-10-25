import { describe, expect, it } from 'vitest';
import { formatMoney } from './format-money';

describe('formatMoney', () => {
  it.each([
    [1200, '$1.200'],
    [12000, '$12.000'],
    [1133.33, '$1.133,33'],
    [0, '$0'],
    [10.5, '$10,5'],
  ])('%d se muestra como %s', (value, expected) => {
    expect(formatMoney(value)).toBe(expected);
  });
});
