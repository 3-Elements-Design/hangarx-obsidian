#!/usr/bin/env node
/**
 * Install this plugin into an Obsidian vault for active development.
 *
 * Usage:
 *   npm run install:vault -- /absolute/path/to/your/vault
 *   OBSIDIAN_VAULT=/absolute/path/to/your/vault npm run install:vault
 *
 * What it does:
 *   - Validates the path looks like an Obsidian vault (has .obsidian/).
 *   - Creates <vault>/.obsidian/plugins/hangarx-obsidian as a symlink back to
 *     this repo folder, so every `npm run build` (or `npm run dev`) is picked
 *     up the next time Obsidian reloads the plugin.
 *   - If a non-symlink directory or a wrong-target symlink already exists,
 *     bails out and asks you to remove it manually — never silently overwrites.
 *
 * After running, in Obsidian:
 *   Settings → Community plugins → toggle "HangarX — Agent Memory" off and on.
 *   Repeat that toggle after each rebuild.
 */
import { existsSync, lstatSync, mkdirSync, readlinkSync, symlinkSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN_ID = 'hangarx-obsidian';
const repoRoot = resolve(fileURLToPath(import.meta.url), '..', '..');

const vaultArg = process.argv[2] || process.env.OBSIDIAN_VAULT;
if (!vaultArg) {
  console.error('Usage: npm run install:vault -- /path/to/your/vault');
  console.error('   or: OBSIDIAN_VAULT=/path/to/vault npm run install:vault');
  process.exit(1);
}

const vault = resolve(vaultArg);
if (!existsSync(vault) || !statSync(vault).isDirectory()) {
  console.error(`Vault path does not exist or is not a directory: ${vault}`);
  process.exit(1);
}

const obsidianDir = join(vault, '.obsidian');
if (!existsSync(obsidianDir)) {
  console.error(`Path does not look like an Obsidian vault — no .obsidian/ folder at: ${vault}`);
  console.error('Open the folder in Obsidian once to initialize it, then re-run.');
  process.exit(1);
}

const pluginsDir = join(obsidianDir, 'plugins');
mkdirSync(pluginsDir, { recursive: true });

const linkPath = join(pluginsDir, PLUGIN_ID);
if (existsSync(linkPath) || lstatSync(linkPath, { throwIfNoEntry: false })) {
  const stat = lstatSync(linkPath);
  if (stat.isSymbolicLink()) {
    const current = readlinkSync(linkPath);
    if (resolve(pluginsDir, current) === repoRoot) {
      console.log(`Already linked: ${linkPath} → ${repoRoot}`);
      console.log('Reload the plugin in Obsidian to pick up the latest build.');
      process.exit(0);
    }
    console.error(`A different symlink already exists at ${linkPath} → ${current}`);
    console.error(`Remove it manually if you want to replace it: rm "${linkPath}"`);
    process.exit(1);
  }
  console.error(`Plugin folder already exists at ${linkPath} (not a symlink).`);
  console.error(`Remove or rename it first if you want a dev symlink: rm -rf "${linkPath}"`);
  process.exit(1);
}

symlinkSync(repoRoot, linkPath, 'dir');
console.log(`Linked: ${linkPath}`);
console.log(`     → ${repoRoot}`);
console.log('');
console.log('Next steps:');
console.log('  1. In Obsidian: Settings → Community plugins → enable "HangarX — Agent Memory"');
console.log('  2. After each `npm run build`, toggle the plugin off and on to reload.');
console.log('  3. For live rebuilds, run `npm run dev` in this folder.');
