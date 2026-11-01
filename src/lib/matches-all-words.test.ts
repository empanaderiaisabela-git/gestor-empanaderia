import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { matchesAllWords } from './utils';

describe('búsqueda por palabras (US-52)', () => {
  it.each(['empanada carne', 'carne empanada', 'EMPANADA de', 'emp car', '  carne   empanada  ', 'Empanáda'])('"%s" encuentra "Empanada de carne"', (search) => {
    expect(matchesAllWords('Empanada de carne', search)).toBe(true);
  });

  it.each(['empanada pollo', 'pollo', 'carnes'])('"%s" no encuentra "Empanada de carne"', (search) => {
    expect(matchesAllWords('Empanada de carne', search)).toBe(false);
  });

  it('sin búsqueda, todo coincide', () => {
    expect(matchesAllWords('Humita', '')).toBe(true);
    expect(matchesAllWords('Humita', '   ')).toBe(true);
  });

  it('fuzz: un texto siempre se encuentra a sí mismo y a cualquiera de sus palabras', () => {
    fc.assert(
      fc.property(fc.array(fc.stringMatching(/^[a-zA-Záéíóúñ]{1,8}$/), { minLength: 1, maxLength: 5 }), fc.nat(), (words, index) => {
        const text = words.join(' ');
        return matchesAllWords(text, text) && matchesAllWords(text, words[index % words.length] ?? '') && matchesAllWords(text, [...words].reverse().join(' '));
      })
    );
  });
});
