#!/usr/bin/env node

/**
 * link-neural-central.mjs
 *
 * Connects all blog posts in the vault to the "Sistema Neuronal Central"
 * hub note, following the existing pattern from June 2026:
 *
 *   - Textos post:     text + wikilink to the hub
 *   - Contenido note:  gallery (![[img]]) + wikilink to the hub
 *   - Hub note:        lists every post under "Posts del Blog" and every
 *                      gallery under "Contenido Visual"
 *
 * Only touches posts that do NOT already link to the hub (safe for re-runs:
 * the June posts already carry the link and are left untouched).
 *
 * Usage:
 *   node scripts/link-neural-central.mjs            # normal run
 *   node scripts/link-neural-central.mjs --dry-run  # preview only
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// ── Configuration ───────────────────────────────────────────────────────────

const VAULT_PATH = 'D:\\Cerebro Shagy\\Programaci\u00f3n Luis\\The Ghetto Shoe\u00b4s';
const TEXTOS_DIR = path.join(VAULT_PATH, 'Textos del contenido para posts');
const CARPETAS_DIR = path.join(VAULT_PATH, 'Carpetas de Contenido de The Ghetto Shoes');
const HUB_FILE = path.join(VAULT_PATH, 'Sistema Neuronal Central de The Ghetto Shoes.md');

const HUB_LINK = '[[Sistema Neuronal Central de The Ghetto Shoes]]';

const MONTHS_ORDER = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function log(msg, dryRun) {
  console.log(`${dryRun ? '  ⚠ [DRY-RUN] ' : '  '}${msg}`);
}

/** Parses a post filename into a sortable date string. */
function dateKeyFromName(name) {
  const m = name.match(/^(\d{1,2})\s+de\s+(\w+)\s+(?:del|de)\s+(\d{4})(?:\s+(pm|2))?/i);
  if (!m) return null;
  const day = String(parseInt(m[1], 10)).padStart(2, '0');
  const month = String(MONTHS_ORDER[m[2].toLowerCase()] || 0).padStart(2, '0');
  const suffix = m[4] ? `-${m[4].toLowerCase()}` : '';
  return `${m[3]}-${month}-${day}${suffix}`;
}

/** Splits content into frontmatter block and the rest. */
function splitFrontmatter(content) {
  if (!content.startsWith('---')) return { fm: null, rest: content };
  const endIndex = content.indexOf('---', 3);
  if (endIndex === -1) return { fm: null, rest: content };
  return {
    fm: content.slice(0, endIndex + 3),
    rest: content.slice(endIndex + 3).trim(),
  };
}

/** Removes trailing blank lines and returns trimmed content with one trailing \n. */
function trimmedLines(body) {
  return body.replace(/\n{2,}/g, '\n\n').trim() + '\n';
}

/** Extracts gallery image references from body text. */
function extractGallery(body) {
  const images = [];
  const text = [];
  for (const line of body.split('\n')) {
    const m = line.trim().match(/^!\[\[([^\]]+\.(?:png|jpg|jpeg|webp|gif))\]\]$/i);
    if (m) images.push(m[1]);
    else if (line.trim()) text.push(line);
  }
  return { images, text };
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const posts = fs
    .readdirSync(TEXTOS_DIR)
    .filter((f) => f.endsWith('.md') && !f.startsWith('Textos'))
    .sort((a, b) => (dateKeyFromName(a) || '').localeCompare(dateKeyFromName(b) || ''));

  const linked = [];
  const already = [];

  for (const file of posts) {
    const filePath = path.join(TEXTOS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Skip posts that already link to the hub (June pattern, safe re-runs)
    if (content.includes(HUB_LINK)) {
      already.push(file);
      continue;
    }

    const { fm, rest } = splitFrontmatter(content);
    const { images, text } = extractGallery(rest);

    // 1. Rewrite the post: frontmatter + gallery-less body + hub link
    const postBody = fm
      ? `${fm}\n\n${trimmedLines(text.join('\n'))}\n${HUB_LINK}\n`
      : `${trimmedLines(text.join('\n'))}\n${HUB_LINK}\n`;

    // 2. Create/update the Contenido note with the gallery
    const baseName = path.basename(file, path.extname(file));
    const contenidoFile = path.join(CARPETAS_DIR, `Contenido del ${baseName}.md`);
    const galleryBody = images.length
      ? images.map((img) => `![[${img}]]`).join('\n\n') + '\n'
      : '';
    const contenidoContent = `${galleryBody}${HUB_LINK}\n`;

    if (!dryRun) {
      fs.writeFileSync(filePath, postBody, 'utf-8');
      if (images.length || fs.existsSync(contenidoFile)) {
        fs.writeFileSync(contenidoFile, contenidoContent, 'utf-8');
      }
    }
    linked.push({ file, baseName, images: images.length, text: text.length });
  }

  // 3. Regenerate the hub note sections (posts + galleries)
  if (!dryRun) {
    regenerateHub(posts);
  }

  console.log(`\n  ── Resumen ──`);
  console.log(`  Posts enlazados: ${linked.length}`);
  for (const l of linked) {
    log(`✔ ${l.file} → ${HUB_LINK} (${l.images} imágenes → nota Contenido)`, dryRun);
  }
  if (already.length) console.log(`  Ya enlazados (sin cambios): ${already.length}`);
  console.log(`\n  Done.`);
}

/** Rebuilds the hub note's post + gallery sections from the vault. */
function regenerateHub(posts) {
  if (!fs.existsSync(HUB_FILE)) {
    console.log(`  ⚠ Hub note not found: ${HUB_FILE}`);
    return;
  }
  const hub = fs.readFileSync(HUB_FILE, 'utf-8');

  const postLinks = posts.map((f) => {
    const name = path.basename(f, path.extname(f));
    return `[[Textos del contenido para posts/${name}]]`;
  });
  const galleryLinks = posts
    .map((f) => {
      const name = path.basename(f, path.extname(f));
      const contenidoFile = path.join(CARPETAS_DIR, `Contenido del ${name}.md`);
      return fs.existsSync(contenidoFile) ? `[[Carpetas de Contenido de The Ghetto Shoes/Contenido del ${name}]]` : null;
    })
    .filter(Boolean);

  const postsSection = `## Posts del Blog - Textos fuente\n${postLinks.join('\n')}`;
  const gallerySection = `## Contenido Visual - Carpetas de imágenes\n${galleryLinks.join('\n')}`;

  const start = hub.indexOf('## Posts del Blog - Textos fuente');
  const end = hub.indexOf('## Redes Sociales');
  if (start === -1 || end === -1) {
    console.log('  ⚠ Could not locate hub sections — hub NOT modified.');
    return;
  }

  const head = hub.slice(0, start).trimEnd();
  const tail = hub.slice(end).trimStart();
  const newHub = `${head}\n\n${postsSection}\n\n${gallerySection}\n\n${tail}`;
  fs.writeFileSync(HUB_FILE, newHub, 'utf-8');
  console.log(`  ✔ Hub note actualizado con ${postLinks.length} posts y ${galleryLinks.length} galerías`);
}

main();