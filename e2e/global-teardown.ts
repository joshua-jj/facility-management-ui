import { execFileSync } from 'child_process';
import path from 'path';

/**
 * Playwright globalTeardown: tear the local stack down (kill API, remove
 * the Postgres container). Skipped when E2E_SKIP_STACK=1 so a manually
 * managed stack survives the run.
 */
async function globalTeardown() {
  if (process.env.E2E_SKIP_STACK === '1') return;
  const script = path.join(__dirname, 'stack.sh');
  try {
    execFileSync('bash', [script, 'down'], { stdio: 'inherit' });
  } catch {
    // best-effort teardown; never fail the run on cleanup
  }
}

export default globalTeardown;
