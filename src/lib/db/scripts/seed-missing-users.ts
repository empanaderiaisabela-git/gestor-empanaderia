export type SeedUser = { username: string; password: string; role: 'admin' | 'vendedor' };

export const SEED_USERS: readonly SeedUser[] = [
  { username: 'admin', password: 'admin', role: 'admin' },
  { username: 'vendedor', password: 'vendedor', role: 'vendedor' },
];

export function usersToCreate(existingUsernames: readonly string[]): SeedUser[] {
  return SEED_USERS.filter((user) => !existingUsernames.includes(user.username));
}
