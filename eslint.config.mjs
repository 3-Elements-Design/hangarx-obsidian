// ESLint flat config for the HangarX Obsidian plugin.
//
// Aligned with the official @obsidianmd plugin guidelines:
//   https://github.com/obsidianmd/eslint-plugin
//
// Scope: only `src/**/*.ts` (the plugin source). CLI scripts, tests, and
// generated artefacts are excluded — they don't ship to users so the
// guidelines don't apply.
//
// Usage:
//   npx eslint src
//   npx eslint src --fix
//
// The reviewer-bot scan that runs against PRs to obsidian-releases uses
// the same config — keeping ours in lockstep means the local run + the
// review-bot run flag the same issues.

import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";

export default [
  // Files to ignore — CLI scripts and build outputs that don't ship to users.
  {
    ignores: [
      "main.js",
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "scripts/**",
      "src/cli/**",
      "**/*.d.ts",
    ],
  },

  // Base TypeScript recommended rules — the Obsidian plugin extends these.
  ...tseslint.configs.recommended,

  // Obsidian plugin guidelines — bot-equivalent ruleset.
  ...obsidianmd.configs.recommended,

  // Project-wide tweaks. Only loosen rules where the upstream Obsidian
  // recommendations create false positives in our codebase; never disable
  // a rule the review bot enforces or the PR scan will keep failing.
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        // Required by the Obsidian plugin recommended ruleset — it
        // enables type-aware checks like `await-thenable` and
        // `no-floating-promises`. `projectService: true` lets the parser
        // discover tsconfig.json automatically, which is faster than
        // pinning to a single project path.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Many of our `(value as any)` casts hop service boundaries that
      // are hard to type without restructuring. The bot enforces this
      // rule, so leaving it on; address each occurrence individually
      // when you ship fixes for the review-bot scan.
      // "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
