/**
 * Agent connect helpers — non-destructively merge the Cortex MCP server config
 * into Claude Desktop / Claude Code / Cursor's own config files.
 *
 * Each agent has a slightly different config path + JSON structure. The
 * `connect*` functions:
 *   1. Read the existing config (or create empty `{}` if missing)
 *   2. Add or update the `hangarx-obsidian` entry under the appropriate key
 *   3. Write back, preserving formatting where reasonable
 *
 * Returns a structured result so the UI can show success/failure clearly.
 *
 * Desktop-only — uses Node's `fs`/`path`/`os` via Obsidian's Electron context.
 * On mobile (no Node available) the connect actions are gated off in the UI.
 */

export interface ConnectResult {
  ok: boolean;
  configPath: string;
  message: string;
  /** True when the entry was already present and we just updated it. */
  updated?: boolean;
  /** True when no edit was needed (already correct). */
  unchanged?: boolean;
}

export interface BridgeConfig {
  /** Absolute path to the bridge script written by the MCP server. */
  bridgePath: string;
  /** Local MCP HTTP URL — http://127.0.0.1:<port>. */
  url: string;
  /** Bearer token the bridge will pass through to the local MCP server. */
  token: string;
}

// Lazy-load Node built-ins via Obsidian's Electron host. Read `require` off
// the global at runtime so esbuild's static analysis can't see the imports
// and try to bundle them. On mobile (no Node) callers gate via `isDesktop()`.
type RequireFn = (m: string) => unknown;

function getRequire(): RequireFn | null {
  const g = globalThis as { require?: unknown };
  return typeof g.require === 'function' ? (g.require as RequireFn) : null;
}

function nodeFs(): typeof import('fs/promises') {
  const req = getRequire();
  if (!req) throw new Error('Node fs unavailable on this platform');
  return (req('fs') as typeof import('fs')).promises;
}

function nodePath(): typeof import('path') {
  const req = getRequire();
  if (!req) throw new Error('Node path unavailable on this platform');
  return req('path') as typeof import('path');
}

function nodeOs(): typeof import('os') {
  const req = getRequire();
  if (!req) throw new Error('Node os unavailable on this platform');
  return req('os') as typeof import('os');
}

function isDesktop(): boolean {
  try {
    const req = getRequire();
    if (!req) return false;
    return !!(req('os') as typeof import('os')).homedir;
  } catch {
    return false;
  }
}

/**
 * Resolve the platform-specific Claude Desktop config path. Returns null on
 * mobile or unrecognised platforms.
 *  - macOS:   ~/Library/Application Support/Claude/claude_desktop_config.json
 *  - Windows: %APPDATA%/Claude/claude_desktop_config.json
 *  - Linux:   ~/.config/Claude/claude_desktop_config.json
 */
export function claudeDesktopConfigPath(): string | null {
  if (!isDesktop()) return null;
  const path = nodePath();
  const os = nodeOs();
  const home = os.homedir();
  const platform = process.platform;
  if (platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  }
  if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    return path.join(appData, 'Claude', 'claude_desktop_config.json');
  }
  // Linux + others — Anthropic doesn't ship Claude Desktop on Linux as of writing,
  // but if the user has it (community build) try the XDG default.
  const xdg = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
  return path.join(xdg, 'Claude', 'claude_desktop_config.json');
}

/** Claude Code stores per-user MCP servers in `~/.claude.json` (project root or
 *  user-level). We target the user-level file so it's available across projects. */
export function claudeCodeConfigPath(): string | null {
  if (!isDesktop()) return null;
  return nodePath().join(nodeOs().homedir(), '.claude.json');
}

/** Cursor uses `~/.cursor/mcp.json`. */
export function cursorConfigPath(): string | null {
  if (!isDesktop()) return null;
  return nodePath().join(nodeOs().homedir(), '.cursor', 'mcp.json');
}

/**
 * Cline (VSCode extension) stores MCP servers in:
 *   macOS:   ~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
 *   Windows: %APPDATA%/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
 *   Linux:   ~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
 */
export function clineConfigPath(): string | null {
  if (!isDesktop()) return null;
  const path = nodePath();
  const os = nodeOs();
  const home = os.homedir();
  const platform = process.platform;
  const sub = ['Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'];
  if (platform === 'darwin') return path.join(home, 'Library', 'Application Support', ...sub);
  if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    return path.join(appData, ...sub);
  }
  const xdg = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
  return path.join(xdg, ...sub);
}

/** Windsurf (Codeium) uses `~/.codeium/windsurf/mcp_config.json`. */
export function windsurfConfigPath(): string | null {
  if (!isDesktop()) return null;
  return nodePath().join(nodeOs().homedir(), '.codeium', 'windsurf', 'mcp_config.json');
}

/**
 * Generic non-destructive merge: read JSON, ensure the path
 * `mcpServers.hangarx-obsidian = entry`, write back. Creates parent dirs and
 * the file itself if missing. Returns ConnectResult.
 */
async function upsertMcpEntry(
  configPath: string,
  entry: Record<string, unknown>,
): Promise<ConnectResult> {
  const fs = nodeFs();
  const path = nodePath();
  let existing: Record<string, unknown> = {};
  let fileExisted = false;
  try {
    const raw = await fs.readFile(configPath, 'utf8');
    fileExisted = true;
    if (raw.trim()) existing = JSON.parse(raw);
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err?.code !== 'ENOENT') {
      // Real read error — surface it.
      return {
        ok: false,
        configPath,
        message: `Couldn't read ${configPath}: ${err?.message ?? String(e)}`,
      };
    }
    // Else file simply doesn't exist; we'll create it.
  }

  // Narrow mcpServers to a record we can index safely. Existing config
  // files write this as a plain object; if it's anything else (legacy
  // shapes, hand-edits) we replace with an empty record.
  let mcpServers: Record<string, unknown>;
  if (existing.mcpServers && typeof existing.mcpServers === 'object' && !Array.isArray(existing.mcpServers)) {
    mcpServers = existing.mcpServers as Record<string, unknown>;
  } else {
    mcpServers = {};
    existing.mcpServers = mcpServers;
  }
  // Migrate legacy 'hangarx-obsidian' key (used in plugin versions ≤0.0.9)
  // to the canonical 'hangarx' id required by Obsidian's plugin store
  // (which forbids `obsidian` in plugin ids).
  if (mcpServers['hangarx-obsidian']) {
    delete mcpServers['hangarx-obsidian'];
  }
  const prev = mcpServers['hangarx'];
  const updated = !!prev;
  const unchanged = prev && JSON.stringify(prev) === JSON.stringify(entry);
  mcpServers['hangarx'] = entry;

  // Ensure parent directory exists
  try {
    await fs.mkdir(path.dirname(configPath), { recursive: true });
  } catch {
    // mkdir failures will surface on the writeFile call below.
  }

  try {
    await fs.writeFile(configPath, JSON.stringify(existing, null, 2) + '\n', 'utf8');
  } catch (e: unknown) {
    return {
      ok: false,
      configPath,
      message: `Couldn't write ${configPath}: ${(e as Error)?.message ?? String(e)}`,
    };
  }

  let message: string;
  if (unchanged) {
    message = 'Already connected — no changes needed.';
  } else if (updated) {
    message = 'Updated existing connection in config.';
  } else if (!fileExisted) {
    message = 'Created config file and connected.';
  } else {
    message = 'Added HangarX to existing config.';
  }

  return { ok: true, configPath, message, updated, unchanged: !!unchanged };
}

/** Build the standard `mcpServers.hangarx-obsidian` entry shared by all three agents. */
function bridgeEntry(b: BridgeConfig): Record<string, unknown> {
  return {
    command: 'node',
    args: [b.bridgePath],
    env: {
      CORTEX_MCP_URL: b.url,
      CORTEX_MCP_TOKEN: b.token,
    },
  };
}

export async function connectClaudeDesktop(b: BridgeConfig): Promise<ConnectResult> {
  const p = claudeDesktopConfigPath();
  if (!p) return { ok: false, configPath: '', message: 'Desktop only — Claude Desktop config path unavailable on mobile.' };
  return upsertMcpEntry(p, bridgeEntry(b));
}

export async function connectClaudeCode(b: BridgeConfig): Promise<ConnectResult> {
  const p = claudeCodeConfigPath();
  if (!p) return { ok: false, configPath: '', message: 'Desktop only.' };
  return upsertMcpEntry(p, bridgeEntry(b));
}

export async function connectCursor(b: BridgeConfig): Promise<ConnectResult> {
  const p = cursorConfigPath();
  if (!p) return { ok: false, configPath: '', message: 'Desktop only.' };
  return upsertMcpEntry(p, bridgeEntry(b));
}

export async function connectCline(b: BridgeConfig): Promise<ConnectResult> {
  const p = clineConfigPath();
  if (!p) return { ok: false, configPath: '', message: 'Desktop only.' };
  return upsertMcpEntry(p, bridgeEntry(b));
}

export async function connectWindsurf(b: BridgeConfig): Promise<ConnectResult> {
  const p = windsurfConfigPath();
  if (!p) return { ok: false, configPath: '', message: 'Desktop only.' };
  return upsertMcpEntry(p, bridgeEntry(b));
}

/** Bridge entry shape exposed for the "Other" / generic snippet. */
export function buildBridgeEntry(b: BridgeConfig): Record<string, unknown> {
  return bridgeEntry(b);
}

/**
 * Remove the `mcpServers.hangarx-obsidian` entry from a config file. Used by
 * the kebab menu's "Disconnect" action so users don't have to hand-edit JSON.
 */
export async function disconnectMcpEntry(configPath: string): Promise<ConnectResult> {
  const fs = nodeFs();
  let raw: string;
  try {
    raw = await fs.readFile(configPath, 'utf8');
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err?.code === 'ENOENT') {
      return { ok: true, configPath, message: 'Already disconnected — no config file.', unchanged: true };
    }
    return { ok: false, configPath, message: `Couldn't read ${configPath}: ${err?.message ?? String(e)}` };
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = raw.trim() ? JSON.parse(raw) : {};
  } catch (e: unknown) {
    return { ok: false, configPath, message: `Config file isn't valid JSON: ${(e as Error)?.message ?? String(e)}` };
  }
  // Disconnect both the canonical 'hangarx' key and the legacy
  // 'hangarx-obsidian' key (used in plugin versions ≤0.0.9), so users
  // upgrading from an older install end up with a clean config.
  const mcpServers = parsed.mcpServers && typeof parsed.mcpServers === 'object' && !Array.isArray(parsed.mcpServers)
    ? parsed.mcpServers as Record<string, unknown>
    : null;
  const hadCanonical = !!mcpServers?.['hangarx'];
  const hadLegacy = !!mcpServers?.['hangarx-obsidian'];
  if (!mcpServers || (!hadCanonical && !hadLegacy)) {
    return { ok: true, configPath, message: 'Already disconnected.', unchanged: true };
  }
  delete mcpServers['hangarx'];
  delete mcpServers['hangarx-obsidian'];
  try {
    await fs.writeFile(configPath, JSON.stringify(parsed, null, 2) + '\n', 'utf8');
  } catch (e: unknown) {
    return { ok: false, configPath, message: `Couldn't write ${configPath}: ${(e as Error)?.message ?? String(e)}` };
  }
  return { ok: true, configPath, message: 'Removed HangarX from config.' };
}

/** Open the OS file manager (Finder/Explorer) at the given config path. */
export function revealInFileManager(configPath: string): boolean {
  if (!isDesktop()) return false;
  try {
    const req = getRequire();
    if (!req) return false;
    const electron = req('electron') as { shell?: { showItemInFolder?(p: string): void } };
    electron.shell?.showItemInFolder?.(configPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Inspect the current config file (without modifying) to report whether
 * Cortex is already connected. Used to render status in the settings UI.
 */
export async function checkConnection(configPath: string | null): Promise<{
  exists: boolean;
  connected: boolean;
  matchesCurrent?: boolean;
  reason?: string;
}> {
  if (!configPath) return { exists: false, connected: false, reason: 'desktop-only' };
  try {
    const fs = nodeFs();
    const raw = await fs.readFile(configPath, 'utf8');
    if (!raw.trim()) return { exists: true, connected: false };
    const parsed = JSON.parse(raw);
    // Recognize both the canonical id and the legacy one so existing
    // installs from plugin v≤0.0.9 still report as connected.
    const mcp = parsed?.mcpServers as Record<string, unknown> | undefined;
    const entry = mcp?.['hangarx'] ?? mcp?.['hangarx-obsidian'];
    return { exists: true, connected: !!entry };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err?.code === 'ENOENT') return { exists: false, connected: false };
    return { exists: true, connected: false, reason: err?.message ?? String(e) };
  }
}
