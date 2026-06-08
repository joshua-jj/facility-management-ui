import { execFileSync } from 'child_process';
import path from 'path';

/**
 * Playwright globalSetup: bring up the isolated local stack (throwaway
 * Postgres + API + seed). The UI itself is started by the `webServer`
 * block in playwright.config.ts once this resolves.
 *
 * Set E2E_SKIP_STACK=1 to reuse an already-running stack (faster local
 * iteration on the test itself).
 */
async function globalSetup() {
  if (process.env.E2E_SKIP_STACK === '1') {
    // eslint-disable-next-line no-console
    console.log('[global-setup] E2E_SKIP_STACK=1 — reusing running stack.');
    return;
  }
  const script = path.join(__dirname, 'stack.sh');
  execFileSync('bash', [script, 'up'], { stdio: 'inherit' });
}

export default globalSetup;
