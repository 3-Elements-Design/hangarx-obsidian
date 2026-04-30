/**
 * OAuth 2.0 + PKCE sign-in flow for the HangarX cloud product.
 *
 * The plugin can't run an HTTP server (sandboxed), so the OAuth callback
 * uses Obsidian's custom URI scheme: `obsidian://hangarx-callback`.
 *
 * Flow:
 *   1. startSignIn() generates a PKCE verifier+challenge and a CSRF state,
 *      stashes them in memory, opens the dashboard's /oauth/authorize page
 *      in the user's browser, and returns a Promise that resolves when the
 *      callback fires (or rejects on error/timeout).
 *   2. Obsidian routes obsidian://hangarx-callback?code=…&state=… into
 *      the registered protocol handler (set up in main.ts on plugin load).
 *   3. The handler invokes completeSignIn(params) which validates state,
 *      exchanges the code via cortex-api's /v1/oauth/plugin/token, and
 *      resolves the original Promise with the access token + workspace IDs.
 */

import { Notice, requestUrl } from 'obsidian';

export interface SignInResult {
  accessToken: string;
  workspaceId: string;
  organizationId: string;
  userEmail?: string;
}

export interface SignInOptions {
  /** Base URL of the dashboard's OAuth consent page (e.g. https://app.hangarx.ai). */
  dashboardUrl: string;
  /** Base URL of the cortex-api token endpoint (e.g. https://cortex.hangarx.ai). */
  apiUrl: string;
  /** Stable identifier for this plugin. Server uses it to label the API key. */
  clientId: string;
  /** Custom URI the dashboard redirects to once the user approves. */
  redirectUri: string;
  /** Hard timeout in ms — if the callback never fires, we reject. Default 5min. */
  timeoutMs?: number;
}

interface PendingFlow {
  state: string;
  codeVerifier: string;
  options: SignInOptions;
  resolve: (result: SignInResult) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

let pending: PendingFlow | null = null;

/**
 * Generate a cryptographically random URL-safe string. Browser-side
 * crypto.getRandomValues is enough — no Node deps.
 */
function randomUrlSafe(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  // base64url
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * SHA-256(verifier) → base64url. SubtleCrypto is available in Obsidian's
 * Electron renderer so we don't need a Node fallback.
 */
async function pkceChallenge(verifier: string): Promise<string> {
  const buf = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(digest);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Start a sign-in flow. Opens the dashboard's consent page in the user's
 * browser and returns a Promise that resolves once the callback completes.
 *
 * Only one flow can be in progress at a time — calling startSignIn again
 * cancels any previous attempt.
 */
export async function startSignIn(options: SignInOptions): Promise<SignInResult> {
  if (pending) {
    pending.reject(new Error('A new sign-in started; previous attempt cancelled.'));
    clearTimeout(pending.timer);
    pending = null;
  }

  const state = randomUrlSafe(24);
  const codeVerifier = randomUrlSafe(48);
  const codeChallenge = await pkceChallenge(codeVerifier);

  const url = new URL(`${options.dashboardUrl.replace(/\/$/, '')}/oauth/authorize`);
  url.searchParams.set('client_id', options.clientId);
  url.searchParams.set('redirect_uri', options.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);

  return new Promise<SignInResult>((resolve, reject) => {
    const timer = setTimeout(() => {
      if (pending && pending.state === state) {
        pending = null;
        reject(new Error('Sign-in timed out — close the browser tab and try again.'));
      }
    }, options.timeoutMs ?? 5 * 60 * 1000);

    pending = { state, codeVerifier, options, resolve, reject, timer };

    // Open in default browser. window.open works because Obsidian's renderer
    // delegates external schemes to the OS.
    const opened = window.open(url.toString(), '_blank');
    if (!opened) {
      // Pop-up blocked — fall back to copying the URL.
      navigator.clipboard.writeText(url.toString()).catch(() => {});
      new Notice('Browser blocked the new window. URL copied to clipboard — paste it in your browser to continue sign-in.', 8000);
    }
  });
}

/**
 * Complete a sign-in. Called by the protocol-handler in main.ts when
 * obsidian://hangarx-callback fires. Returns void — the original Promise
 * from startSignIn() resolves/rejects asynchronously.
 */
export async function completeSignIn(params: Record<string, string>): Promise<void> {
  if (!pending) {
    new Notice('Received an OAuth callback but no sign-in is in progress. Ignoring.', 5000);
    return;
  }
  const flow = pending;
  pending = null;
  clearTimeout(flow.timer);

  // Did the dashboard return an error?
  const errorCode = params.error;
  if (errorCode) {
    flow.reject(new Error(params.error_description || `Sign-in failed: ${errorCode}`));
    return;
  }

  // Validate state to defend against CSRF.
  if (params.state !== flow.state) {
    flow.reject(new Error('OAuth state mismatch — sign-in aborted for security.'));
    return;
  }

  const code = params.code;
  if (!code) {
    flow.reject(new Error('Server didn\'t return an authorization code.'));
    return;
  }

  // Exchange the code for an access token. Use Obsidian's requestUrl rather
  // than window.fetch — the renderer enforces CORS on fetch, but cortex.hangarx.ai
  // doesn't allow the obsidian:// origin (and shouldn't need to). requestUrl runs
  // through Electron's main process and bypasses CORS.
  try {
    const apiBase = flow.options.apiUrl.replace(/\/$/, '');
    const res = await requestUrl({
      url: `${apiBase}/v1/oauth/plugin/token`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        code_verifier: flow.codeVerifier,
        client_id: flow.options.clientId,
        redirect_uri: flow.options.redirectUri,
      }),
      throw: false,
    });
    if (res.status >= 400) {
      const body = (() => { try { return res.json; } catch { return {}; } })();
      const desc = body?.error_description || body?.error || `Server returned ${res.status}`;
      flow.reject(new Error(desc));
      return;
    }
    const body = res.json;
    if (!body.access_token) {
      flow.reject(new Error('Server didn\'t return an access token.'));
      return;
    }
    flow.resolve({
      accessToken: body.access_token,
      workspaceId: body.workspaceId,
      organizationId: body.organizationId,
      userEmail: body.userEmail,
    });
  } catch (e) {
    flow.reject(e instanceof Error ? e : new Error(String(e)));
  }
}

/** Cancel any in-progress sign-in (e.g. on plugin unload). */
export function cancelSignIn(): void {
  if (pending) {
    clearTimeout(pending.timer);
    pending.reject(new Error('Sign-in cancelled.'));
    pending = null;
  }
}
