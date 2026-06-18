#!/usr/bin/env node

/**
 * dev-with-watch.mjs
 *
 * Development server that:
 *   1. Syncs the vault on startup
 *   2. Starts Astro dev server
 *   3. Watches the Obsidian vault for changes and auto-syncs
 *
 * No extra dependencies — uses native fs.watch + child_process.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const DEFAULT_VAULT_PATH =
  'D:\\Cerebro Shagy\\Programación Luis\\The Ghetto Shoe´s';
const VAULT_PATH = process.env.VAULT_PATH || DEFAULT_VAULT_PATH;

const POSTS_DIR = path.join(VAULT_PATH, 'Textos del contenido para posts');
const IMAGES_DIR = path.join(
  VAULT_PATH,
  'Carpetas de Contenido de The Ghetto Shoes'
);

const ASTRO_POSTS_DEST = path.join(projectRoot, 'src', 'content', 'posts');

let syncTimeout = null;
let syncing = false;
const DEBOUNCE_MS = 1200;

// ── Sync ─────────────────────────────────────────────────────────────────────

function runSync() {
  return new Promise((resolve, reject) => {
    const sync = spawn('node', ['scripts/sync-vault.mjs'], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
    });
    sync.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Sync falló con código ${code}`));
    });
    sync.on('error', reject);
  });
}

function triggerAstroReload() {
  // Touch the posts directory to nudge Astro's content layer watcher.
  // Small delay lets Windows release file locks after sync writes images.
  setTimeout(() => {
    const now = new Date();
    try {
      fs.utimesSync(ASTRO_POSTS_DEST, now, now);
    } catch {
      // Non-critical — Astro will pick up changes on next file edit anyway
    }
  }, 400);
}

async function debouncedSync() {
  // Skip if a sync is already running
  if (syncing) return;
  if (syncTimeout) clearTimeout(syncTimeout);

  syncTimeout = setTimeout(async () => {
    if (syncing) return;
    syncing = true;
    console.log('\n  ══ Vault change detected — auto-syncing... ══\n');
    try {
      await runSync();
      triggerAstroReload();
      console.log('\n  ✔ Auto-sync complete.\n');
    } catch (err) {
      console.error(`\n  ✖ ${err.message}\n`);
    } finally {
      syncing = false;
    }
  }, DEBOUNCE_MS);
}

// ── File Watcher ─────────────────────────────────────────────────────────────

function startWatcher(dirs) {
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      console.warn(`  ⚠ Watcher: directory not found — ${dir}`);
      continue;
    }
    try {
      fs.watch(dir, { recursive: true }, (eventType, filename) => {
        if (filename && !filename.startsWith('.')) {
          debouncedSync();
        }
      });
      console.log(`  ● Watching: ${path.relative(VAULT_PATH, dir)}`);
    } catch (err) {
      console.error(`  ✖ Failed to watch ${dir}: ${err.message}`);
    }
  }
}

// ── Astro Dev Server ─────────────────────────────────────────────────────────

function startAstroDev() {
  const astro = spawn('npx', ['astro', 'dev'], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true,
  });

  astro.on('exit', (code) => {
    console.log(`\n  Astro dev server exited (code ${code}).`);
    process.exit(code ?? 0);
  });

  process.on('SIGINT', () => {
    astro.kill('SIGINT');
  });
  process.on('SIGTERM', () => {
    astro.kill('SIGTERM');
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n  ── Dev Server with Auto-Sync ──`);
  console.log(`  Vault: ${VAULT_PATH}\n`);

  // 1. Initial sync
  console.log('  ● Running initial sync...');
  try {
    await runSync();
    console.log('  ✔ Initial sync complete.\n');
  } catch (err) {
    console.error(`  ✖ ${err.message}`);
    process.exit(1);
  }

  // 2. Start watcher
  startWatcher([POSTS_DIR, IMAGES_DIR]);
  console.log('');

  // 3. Start Astro dev
  startAstroDev();
}

main();
