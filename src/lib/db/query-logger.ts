import type { Logger } from 'drizzle-orm/logger';

export const sqlOnlyLogger: Logger = {
  logQuery(query: string): void {
    console.log(`Query: ${query}`);
  },
};
