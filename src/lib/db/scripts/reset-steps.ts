export type ResetStep = { label: string; command: string };

export const RESET_STEPS: readonly ResetStep[] = [
  { label: 'Step 1: Wiping database...', command: 'npx tsx src/lib/db/scripts/wipe-db.ts' },
  { label: 'Step 2: Applying migrations (drizzle-kit)...', command: 'npm run db:migrate' },
  { label: 'Step 3: Seeding initial data (setup-initial-data.ts)...', command: 'npx tsx --conditions=react-server src/lib/db/scripts/setup-initial-data.ts' },
];
