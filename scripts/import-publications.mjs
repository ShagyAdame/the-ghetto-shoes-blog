#!/usr/bin/env node

/**
 * import-publications.mjs
 *
 * Imports publications from the OneDrive archive into the Obsidian vault so the
 * blog sync (sync-vault.mjs) can publish them.
 *
 * Source:   C:\Users\laea-\OneDrive\Documentos\The Ghetto Shoe´s\{MES}\{día}...
 * Vault:    D:\Cerebro Shagy\Programación Luis\The Ghetto Shoe´s
 *   images  → Carpetas de Contenido de The Ghetto Shoes\{dateKey}-{file}
 *   posts   → Textos del contenido para posts\{fecha}.md
 *
 * Usage:
 *   node scripts/import-publications.mjs            # normal import
 *   node scripts/import-publications.mjs --dry-run  # preview only
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// ── Configuration ───────────────────────────────────────────────────────────

const SOURCE_ROOT = 'C:\\Users\\laea-\\OneDrive\\Documentos\\The Ghetto Shoe\u00b4s';
const VAULT_PATH = 'D:\\Cerebro Shagy\\Programaci\u00f3n Luis\\The Ghetto Shoe\u00b4s';
const CARPETAS_DIR = path.join(VAULT_PATH, 'Carpetas de Contenido de The Ghetto Shoes');
const TEXTOS_DIR = path.join(VAULT_PATH, 'Textos del contenido para posts');
const BLOG_POSTS_DIR = path.join(projectRoot, 'src', 'content', 'posts');

const MONTH_FOLDERS = ['ABRIL', 'MAYO', 'Junio', 'Agosto2026', 'Septiembre 2026'];
const MONTH_NUM = { abril: '04', mayo: '05', junio: '06', agosto: '08', septiembre: '09' };
const MONTH_ES = { abril: 'abril', mayo: 'mayo', junio: 'junio', agosto: 'agosto', septiembre: 'septiembre' };
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

// ── Helpers ─────────────────────────────────────────────────────────────────

function log(msg, dryRun) {
  console.log(`${dryRun ? '  ⚠ [DRY-RUN] ' : ''}  ${msg}`);
}

/** Strips accents + URL-unsafe characters from a basename. */
function sanitizeName(name) {
  const ext = path.extname(name);
  let base = path.basename(name, ext);
  base = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  base = base.replace(/[?'´`"‘’¿¡]/g, '');
  base = base.replace(/[^\w\s-]+/g, '-');
  base = base.trim().replace(/\s+/g, '-').toLowerCase();
  base = base.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return (base || 'img') + ext.toLowerCase();
}

/** Extracts the first day number from a folder name. */
function extractDay(folderName) {
  const m = folderName.match(/^(\d{1,2})/);
  return m ? parseInt(m[1], 10) : null;
}

/** Builds the date key for a folder: YYYY-MM-DD[-pm|-2]. */
function buildDateKey(monthKey, folderName, day) {
  let key = `2026-${MONTH_NUM[monthKey]}-${String(day).padStart(2, '0')}`;
  const lower = folderName.toLowerCase();
  if (/pm/.test(lower)) key += '-pm';
  else if (/\b2\b/.test(lower) || /(septeiember|septiem) 2/.test(lower)) key += '-2';
  return key;
}

/** Spanish display date, e.g. "9 de septiembre del 2026" (+ " pm"/" 2" suffix). */
function displayDate(dateKey) {
  const [, mm, dd] = dateKey.split('-');
  const day = parseInt(dd, 10);
  const monthName = Object.entries(MONTH_NUM).find(([, v]) => v === mm)?.[0] || '';
  let name = `${day} de ${MONTH_ES[monthName]} del 2026`;
  if (dateKey.endsWith('-pm')) name += ' pm';
  else if (dateKey.endsWith('-2')) name += ' 2';
  return name;
}

/** Extracts the publication caption from a descriptive jpg filename. */
function extractCaption(files, folderName) {
  const candidate = files
    .filter((f) => path.extname(f).toLowerCase() === '.jpg' && path.basename(f).length > 24)
    .sort((a, b) => path.basename(b).length - path.basename(a).length)[0];
  if (!candidate) return null;
  let name = path.basename(candidate, path.extname(candidate));
  // Cut at the broken-emoji marker "??" or at a " (N)" suffix
  const emojiIdx = name.indexOf('??');
  if (emojiIdx > 10) name = name.slice(0, emojiIdx);
  name = name.replace(/\s*\(\d+\)\s*$/, '').replace(/\s+/g, ' ').trim();
  return name || null;
}

/** Cleans a caption for use as body text (removes broken emoji markers). */
function cleanCaption(text) {
  if (!text) return '';
  return text.replace(/\?\?+/g, '').replace(/\s+/g, ' ').trim();
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const createdPosts = [];
  const skipped = [];

  console.log(`\n  ── Import: OneDrive → Obsidian Vault ──`);
  console.log(`  Source: ${SOURCE_ROOT}`);
  console.log(`  Mode:   ${dryRun ? 'DRY RUN (no files modified)' : 'LIVE'}\n`);

  if (!fs.existsSync(SOURCE_ROOT)) {
    console.error(`  ✖ Source path not found: ${SOURCE_ROOT}`);
    process.exit(1);
  }

  for (const monthFolder of MONTH_FOLDERS) {
    const monthDir = path.join(SOURCE_ROOT, monthFolder);
    if (!fs.existsSync(monthDir)) continue;
    const monthKey = monthFolder.toLowerCase().replace('2026', '').replace(/[^a-z]/g, '');
    const dayDirs = fs
      .readdirSync(monthDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    for (const folderName of dayDirs) {
      const day = extractDay(folderName);
      if (!day) continue;
      const dateKey = buildDateKey(monthKey, folderName, day);

      const dayDir = path.join(monthDir, folderName);
      const files = fs.readdirSync(dayDir).filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()));
      if (files.length === 0) {
        skipped.push(`${folderName} (sin imágenes)`);
        continue;
      }

      const fecha = displayDate(dateKey);
      const postFile = path.join(TEXTOS_DIR, `${fecha}.md`);
      const slug = fecha.replace(/\s+/g, '-').toLowerCase();
      const blogPost = path.join(BLOG_POSTS_DIR, `${slug}.md`);

      // Skip dates already published on the blog
      if (fs.existsSync(blogPost)) {
        skipped.push(`${fecha} (ya publicado)`);
        continue;
      }

      const caption = extractCaption(files, folderName);
      const title = caption || `Lanzamientos del ${fecha}`;
      const description = cleanCaption(caption) || `Novedades del mundo sneaker — ${fecha}.`;

      const imageRefs = [];
      for (const file of files) {
        const norm = sanitizeName(file);
        const target = `${dateKey}-${norm}`;
        const src = path.join(dayDir, file);
        const dst = path.join(CARPETAS_DIR, target);
        imageRefs.push(target);
        if (!dryRun) {
          if (!fs.existsSync(CARPETAS_DIR)) fs.mkdirSync(CARPETAS_DIR, { recursive: true });
          fs.copyFileSync(src, dst);
        }
      }
      if (!fs.existsSync(TEXTOS_DIR) && !dryRun) fs.mkdirSync(TEXTOS_DIR, { recursive: true });

      const galleried = imageRefs.map((img) => `![[${img}]]`).join('\n\n');
      const dateIso = dateKey.slice(0, 10);
      const content = `---
title: "${title.replace(/"/g, '\\"')}"
date: "${dateIso}"
tags: ["sneakers"]
published: true
description: "${description.replace(/"/g, '\\"').slice(0, 200)}"
author: "The Ghetto Shoe's"
image: "${imageRefs[0]}"
---

${description}

${galleried}
`;

      if (!dryRun) fs.writeFileSync(postFile, content, 'utf-8');
      createdPosts.push(`${fecha} → ${path.basename(postFile)} (${imageRefs.length} imágenes)`);
    }
  }

  console.log(`\n  ── Resumen ──`);
  console.log(`  Posts creados: ${createdPosts.length}`);
  for (const p of createdPosts) console.log(`    ✔ ${p}`);
  if (skipped.length) {
    console.log(`  Omitidos (${skipped.length}):`);
    for (const s of skipped) console.log(`    · ${s}`);
  }
  console.log(`\n  Done.`);
}

main();