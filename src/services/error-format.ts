/**
 * Centralised error formatting for the plugin. Turns raw `Error` objects (or
 * the structured strings the CortexClient throws — `Cortex [host] /path → 401: …`)
 * into a structured object the UI can render predictably:
 *
 *   - kind: high-level category, drives the icon + headline
 *   - headline: one-line "what failed"
 *   - detail: the raw error/message body shown in monospace
 *   - hint: actionable tip when we can guess one
 *
 * Add new patterns below as the API grows — the fallback always returns a
 * valid result so callers never need to special-case unknown errors.
 */

export type ErrorKind = 'auth' | 'network' | 'not_found' | 'rate_limit' | 'server' | 'validation' | 'cancelled' | 'unknown';

export interface FormattedError {
  kind: ErrorKind;
  /** Short, human-readable summary. Used as the modal/banner headline. */
  headline: string;
  /** The raw error text — typically code-rendered, monospace. */
  detail: string;
  /** Actionable suggestion when we can guess one (e.g. "check the API key"). */
  hint?: string;
}

const PATTERNS: Array<{
  match: RegExp;
  kind: ErrorKind;
  headline: string;
  hint?: string;
}> = [
  { match: /\b(401|UNAUTHORIZED|AUTH_ERROR|INVALID_API_KEY|invalid bearer)\b/i, kind: 'auth',
    headline: 'Authentication failed',
    hint: 'Open Settings → HangarX. In Cloud mode, sign in again or regenerate your API key in the dashboard. In Local mode, your container is running an older build that still requires a key — re-save the Compose file and rebuild with `docker compose -f docker-compose.cortex.yml up -d --force-recreate`.' },
  { match: /\b403\b|forbidden|WORKSPACE_NOT_ALLOWED/i, kind: 'auth',
    headline: 'Access denied',
    hint: 'Your API key isn\'t scoped to this workspace. Use a key with access, or switch workspaces.' },
  { match: /\b404\b|NOT_FOUND/i, kind: 'not_found',
    headline: 'Resource not found',
    hint: 'The endpoint or entity doesn\'t exist. If you just synced, give it a few seconds and retry.' },
  { match: /\b429\b|rate.?limit|too many requests/i, kind: 'rate_limit',
    headline: 'Rate limited',
    hint: 'HangarX is throttling requests. Wait ~30s and try again.' },
  { match: /\b(5\d\d)\b|INTERNAL|EAI_AGAIN/i, kind: 'server',
    headline: 'HangarX server error',
    hint: 'Check the cortex-api logs (`docker logs cortex-api`) for the underlying cause.' },
  { match: /ERR_NAME_NOT_RESOLVED|ENOTFOUND|getaddrinfo/i, kind: 'network',
    headline: 'Hostname not found',
    hint: 'The API hostname couldn\'t be resolved. Check Settings → Connection → API URL — typo, wrong domain (.com vs .ai), or DNS issue. In Local mode the URL should be http://localhost:3400.' },
  { match: /econnrefused|ECONNREFUSED/i, kind: 'network',
    headline: 'Connection refused',
    hint: 'Nothing is listening on that port. In Local mode, run `docker compose ps` to confirm containers are up; check the port matches your compose file.' },
  { match: /ERR_INTERNET_DISCONNECTED|ENETUNREACH/i, kind: 'network',
    headline: 'No internet connection',
    hint: 'Your network is offline. Reconnect, or switch to Local mode if you have the Docker stack running.' },
  { match: /ERR_CERT|ssl|TLS|certificate/i, kind: 'network',
    headline: 'TLS/certificate error',
    hint: 'The server\'s certificate is invalid or expired. If you trust this host, you may need to update it; otherwise contact the API administrator.' },
  { match: /fetch failed|network error|timeout|aborted|ETIMEDOUT/i, kind: 'network',
    headline: 'Cannot reach HangarX',
    hint: 'The API isn\'t responding. In Local mode, run `docker compose ps` to confirm containers are up. Otherwise check your internet connection.' },
  { match: /\b(400|VALIDATION_ERROR|ZodError|invalid input)\b/i, kind: 'validation',
    headline: 'Invalid request',
    hint: 'The request body wasn\'t accepted. This is usually a plugin bug — please report.' },
  { match: /aborted|cancelled|user cancelled/i, kind: 'cancelled',
    headline: 'Cancelled',
  },
];

/** Turn any thrown value into a structured FormattedError. Never throws. */
export function formatError(err: unknown, contextHeadline?: string): FormattedError {
  const detail = err instanceof Error ? err.message : String(err);

  for (const p of PATTERNS) {
    if (p.match.test(detail)) {
      return {
        kind: p.kind,
        headline: contextHeadline ?? p.headline,
        detail,
        hint: p.hint,
      };
    }
  }

  return {
    kind: 'unknown',
    headline: contextHeadline ?? 'Something went wrong',
    detail,
  };
}

/** Lucide icon name to use for each error kind. */
export function errorIcon(kind: ErrorKind): string {
  switch (kind) {
    case 'auth':       return 'lock';
    case 'network':    return 'wifi-off';
    case 'not_found':  return 'help-circle';
    case 'rate_limit': return 'timer';
    case 'server':     return 'server-crash';
    case 'validation': return 'alert-octagon';
    case 'cancelled':  return 'circle-slash';
    default:           return 'alert-triangle';
  }
}
