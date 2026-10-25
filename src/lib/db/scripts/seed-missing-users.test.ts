import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { SEED_USERS, usersToCreate } from './seed-missing-users';

describe('usersToCreate (db:seed-users)', () => {
  it('con la base vacía crea admin y vendedor', () => {
    expect(usersToCreate([]).map(({ username, role }) => [username, role])).toEqual([
      ['admin', 'admin'],
      ['vendedor', 'vendedor'],
    ]);
  });

  it('regression BUG-10: no toca a un usuario que ya existe (no le pisa la contraseña ni el rol)', () => {
    expect(usersToCreate(['admin']).map((user) => user.username)).toEqual(['vendedor']);
    expect(usersToCreate(['admin', 'vendedor'])).toEqual([]);
  });

  it('fuzz: nunca devuelve un usuario que ya existe ni uno fuera de la lista inicial', () => {
    fc.assert(
      fc.property(fc.array(fc.string()), (existing) => {
        const created = usersToCreate(existing);
        return created.every((user) => !existing.includes(user.username) && SEED_USERS.includes(user));
      })
    );
  });
});
