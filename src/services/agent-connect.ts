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

/**
 * Lazy-load Node built-ins via Obsidian's Electron host. We use a dynamic
 * `require` (resolved through a string, not a literal) so esbuild's static
 * analysis can't see the imports and try to bundle them. On mobile the
 * `require` global doesn't exist; the UI gates these calls off there.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dynRequire: any = (() => {
  try {
    // eslint-disable-next-line no-new-func
    return new Function('m', 'return require(m)');
  } catch {
    return null;
  }
})();
function nodeFs(): typeof import('fs/promises') {
  return dynRequire('fs').promises;
}
function nodePath(): typeof import('path') {
  return dynRequire('path');
}
function nodeOs(): typeof import('os') {
  return dynRequire('os');
}
function isDesktop(): boolean {
  try {
    return !!dynRequire && !!nodeOs().homedir;
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
  let existing: Record<string, any> = {};
  let fileExisted = false;
  try {
    const raw = await fs.readFile(configPath, 'utf8');
    fileExisted = true;
    if (raw.trim()) existing = JSON.parse(raw);
  } catch (e: any) {
    if (e?.code !== 'ENOENT') {
      // Real read error — surface it.
      return {
        ok: false,
        configPath,
        message: `Couldn't read ${configPath}: ${e.message}`,
      };
    }
    // Else file simply doesn't exist; we'll create it.
  }

  if (!existing.mcpServers || typeof existing.mcpServers !== 'object') {
    existing.mcpServers = {};
  }
  const prev = existing.mcpServers['hangarx-obsidian'];
  const updated = !!prev;
  const unchanged = prev && JSON.stringify(prev) === JSON.stringify(entry);
  existing.mcpServers['hangarx-obsidian'] = entry;

  // Ensure parent directory exists
  try {
    await fs.mkdir(path.dirname(configPath), { recursive: true });
  } catch {
    // mkdir failures will surface on the writeFile call below.
  }

  try {
    await fs.writeFile(configPath, JSON.stringify(existing, null, 2) + '\n', 'utf8');
  } catch (e: any) {
    return {
      ok: false,
      configPath,
      message: `Couldn't write ${configPath}: ${e.message}`,
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

  return { ok: true, configPath, message, updated, unchanged };
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
  } catch (e: any) {
    if (e?.code === 'ENOENT') {
      return { ok: true, configPath, message: 'Already disconnected — no config file.', unchanged: true };
    }
    return { ok: false, configPath, message: `Couldn't read ${configPath}: ${e.message}` };
  }
  let parsed: Record<string, any>;
  try {
    parsed = raw.trim() ? JSON.parse(raw) : {};
  } catch (e: any) {
    return { ok: false, configPath, message: `Config file isn't valid JSON: ${e.message}` };
  }
  if (!parsed?.mcpServers || !parsed.mcpServers['hangarx-obsidian']) {
    return { ok: true, configPath, message: 'Already disconnected.', unchanged: true };
  }
  delete parsed.mcpServers['hangarx-obsidian'];
  try {
    await fs.writeFile(configPath, JSON.stringify(parsed, null, 2) + '\n', 'utf8');
  } catch (e: any) {
    return { ok: false, configPath, message: `Couldn't write ${configPath}: ${e.message}` };
  }
  return { ok: true, configPath, message: 'Removed HangarX from config.' };
}

/** Open the OS file manager (Finder/Explorer) at the given config path. */
export function revealInFileManager(configPath: string): boolean {
  if (!isDesktop()) return false;
  try {
    // electron is loaded via the same dynRequire shim — works inside the renderer.
    const { shell } = dynRequire('electron');
    shell.showItemInFolder(configPath);
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
    const entry = parsed?.mcpServers?.['hangarx-obsidian'];
    return { exists: true, connected: !!entry };
  } catch (e: any) {
    if (e?.code === 'ENOENT') return { exists: false, connected: false };
    return { exists: true, connected: false, reason: e.message };
  }
}
