#!/usr/bin/env node
/**
 * Bump the plugin version everywhere it's tracked.
 *
 * Usage:
 *   npm run bump -- 0.3.0
 *
 * Updates:
 *   - manifest.json   (version)
 *   - package.json    (version)
 *   - versions.json   (adds entry mapping new version → minAppVersion)
 *
 * After running, commit the changes and tag the release:
 *   git commit -am "obsidian-plugin: v0.3.0"
 *   git tag obsidian-v0.3.0
 *   git push --tags
 *
 * The GitHub Action triggered by `obsidian-v*` tags will build, mirror to
 * the public repo, and create the GitHub Release that Obsidian's community
 * catalog reads from.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const newVersion = process.argv[2];
if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('Usage: npm run bump -- <version>   (e.g. 0.3.0)');
  process.exit(1);
}

const root = resolve(fileURLToPath(import.meta.url), '..', '..');

const manifestPath = resolve(root, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const minAppVersion = manifest.minAppVersion;
manifest.version = newVersion;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

const pkgPath = resolve(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.version = newVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

const versionsPath = resolve(root, 'versions.json');
const versions = JSON.parse(readFileSync(versionsPath, 'utf8'));
versions[newVersion] = minAppVersion;
writeFileSync(versionsPath, JSON.stringify(versions, null, 2) + '\n');

console.log(`Bumped to ${newVersion} (minAppVersion ${minAppVersion}).`);
console.log('Next:');
console.log(`  git commit -am "obsidian-plugin: v${newVersion}"`);
console.log(`  git tag obsidian-v${newVersion}`);
console.log('  git push && git push --tags');
