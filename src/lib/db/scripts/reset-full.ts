import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import { envFileFor } from '../database-config';
import { assertSafeToWipe } from './assert-safe-to-wipe';
import { RESET_STEPS } from './reset-steps';

function assertResetIsSafe(): void {
  const env = { ...process.env };
  dotenv.config({ path: envFileFor(process.env), processEnv: env, quiet: true });
  assertSafeToWipe(env);
}

console.log('🚀 Starting Full Database Reset...');

try {
  assertResetIsSafe();
  for (const { label, command } of RESET_STEPS) {
    console.log(label);
    execSync(command, { stdio: 'inherit' });
  }
  console.log('✅ Full Database Reset completed successfully!');
} catch (error) {
  console.error('❌ Error during database reset:', error);
  process.exit(1);
}
