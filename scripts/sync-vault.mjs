#!/usr/bin/env node

/**
 * sync-vault.mjs
 *
 * Syncs content from the Obsidian vault to the Astro blog.
 * Transforms markdown (frontmatter injection, wiki images → markdown images,
 * wikilinks → plain text), copies images, and processes static pages.
 *
 * Usage:
 *   node scripts/sync-vault.mjs           # normal sync
 *   node scripts/sync-vault.mjs --dry-run # preview only
 *
 * Environment:
 *   VAULT_PATH  – path to the Obsidian vault (default: D:\Cerebro...)
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// ── Configuration ───────────────────────────────────────────────────────────

const DEFAULT_VAULT_PATH = 'D:\\Cerebro Shagy\\Programación Luis\\The Ghetto Shoe´s';
const VAULT_PATH = process.env.VAULT_PATH || DEFAULT_VAULT_PATH;

const POSTS_SOURCE   = path.join(VAULT_PATH, 'Textos del contenido para posts');
const IMAGES_SOURCE  = path.join(VAULT_PATH, 'Carpetas de Contenido de The Ghetto Shoes');
const POSTS_DEST     = path.join(projectRoot, 'src', 'content', 'posts');
const PAGES_DEST     = path.join(projectRoot, 'src', 'content', 'pages');
const IMAGES_DEST    = path.join(projectRoot, 'public', 'images');

const STATIC_PAGES = [
  { name: 'about', vaultFile: path.join(VAULT_PATH, '¿Que es The Ghetto Shoe´s.md'),   destFile: path.join(PAGES_DEST, 'about.md') },
  { name: 'metas', vaultFile: path.join(VAULT_PATH, 'Matriz de lo que se desea conseguir.md'), destFile: path.join(PAGES_DEST, 'metas.md') },
];

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);

const MONTHS = {
  enero: '01', febrero: '02', marzo: '03', abril: '04',
  mayo: '05', junio: '06', julio: '07', agosto: '08',
  septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
};

// ── Logging ─────────────────────────────────────────────────────────────────

const LOG_LEVELS = { error: 0, warn: 1, info: 2, ok: 2 };

function log(level, message, dryRun) {
  if (!(level in LOG_LEVELS)) level = 'info';
  const prefix = dryRun ? '  ⚠ [DRY-RUN]' : '';
  const icons = { error: '✖', warn: '⚠', info: '•', ok: '✔' };
  const icon = icons[level] || '•';
  const out = level === 'error' ? process.stderr : process.stdout;
  out.write(`  ${prefix ? prefix + ' ' : ''}${icon} ${message}\n`);
}

function logSummary(sections, dryRun) {
  if (dryRun) console.log('\n  ── DRY RUN — no files were modified ──');
  console.log('');
  for (const [title, counts] of Object.entries(sections)) {
    const parts = [];
    if (counts.synced > 0)   parts.push(`${counts.synced} synced`);
    if (counts.skipped > 0)  parts.push(`${counts.skipped} skipped`);
    if (counts.errors?.length > 0) parts.push(`${counts.errors.length} errors`);
    console.log(`  ${title}: ${parts.join(', ') || 'nothing changed'}`);
    for (const err of counts.errors || []) {
      console.log(`    ✖ ${err}`);
    }
  }
}

// ── Slug & Filename Utilities ───────────────────────────────────────────────

/**
 * Converts a filename to a URL-safe slug.
 * "14 de junio del 2026.md" → "14-de-junio-del-2026"
 * "¿Que es The Ghetto Shoe's.md" → "que-es-the-ghetto-shoes"
 */
function generateSlug(filename) {
  let name = path.basename(filename, path.extname(filename));
  // Strip accents (NFD decomposition then remove combining marks)
  name = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Remove special characters: apostrophes, quotes, ñ→n handled by NFD already
  name = name.replace(/['´`"‘’]/g, '');
  name = name.replace(/[¿¡]/g, '');
  // Replace any non-alphanumeric (except spaces and hyphens) with nothing
  name = name.replace(/[^\w\s-]/g, '');
  // Replace whitespace runs with hyphens
  name = name.trim().replace(/\s+/g, '-');
  // Lowercase
  name = name.toLowerCase();
  // Collapse multiple hyphens
  name = name.replace(/-+/g, '-');
  // Remove leading/trailing hyphens
  name = name.replace(/^-+|-+$/g, '');
  return name;
}

/**
 * Normalizes image filenames for the web.
 * "ChatGPT Image 14 jun 2026, 06_01_17 p.m.png" → "chatgpt-image-14-jun-2026-06-01-17-pm.png"
 */
function normalizeImageName(filename) {
  const ext = path.extname(filename).toLowerCase();
  let name = path.basename(filename, ext);
  name = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  name = name.replace(/['´`"‘’]/g, '');
  name = name.replace(/[¿¡]/g, '');
  name = name.replace(/[^\w\s-]/g, '');
  name = name.trim().replace(/\s+/g, '-');
  name = name.toLowerCase();
  name = name.replace(/-+/g, '-');
  name = name.replace(/^-+|-+$/g, '');
  return name + ext;
}

/**
 * Attempts to extract a date like "14 de junio del 2026" from a filename.
 * Returns "2026-06-14" or null.
 */
function extractDateFromFilename(filename) {
  const name = path.basename(filename, path.extname(filename));
  const dateMatch = name.match(/(\d{1,2})\s+de\s+(\w+)\s+(?:del|de)\s+(\d{4})/);
  if (dateMatch) {
    const [, day, monthName, year] = dateMatch;
    const month = MONTHS[monthName.toLowerCase()];
    if (month && day >= 1 && day <= 31) {
      return `${year}-${month}-${String(day).padStart(2, '0')}`;
    }
  }
  return null;
}

// ── Frontmatter ─────────────────────────────────────────────────────────────

/**
 * Parses existing YAML frontmatter from markdown content.
 * Returns { frontmatter: {...}, restContent: "..." } or null.
 */
function extractFrontmatter(content) {
  if (!content.startsWith('---')) return null;

  const endIndex = content.indexOf('---', 3);
  if (endIndex === -1) return null;

  const yamlBlock = content.slice(3, endIndex).trim();
  const restContent = content.slice(endIndex + 3).trimStart();

  const frontmatter = {};
  for (const line of yamlBlock.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    let value = trimmed.slice(colonIndex + 1).trim();

    // Handle arrays: [item1, item2]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
    }
    // Handle quoted strings
    else if ((value.startsWith('"') && value.endsWith('"')) ||
             (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // Handle booleans
    else if (value === 'true') value = true;
    else if (value === 'false') value = false;

    frontmatter[key] = value;
  }

  return { frontmatter, restContent };
}

/**
 * Generates frontmatter for a post that has none.
 * Extracts title from H1, date from filename/mtime, description from first paragraph.
 */
function generateFrontmatter(content, { filename, mtime, slug }) {
  const title = extractTitle(content) || slug || 'Untitled';
  const date = extractDateFromFilename(filename) ||
               mtime.toISOString().split('T')[0];
  const description = extractDescription(content);

  return {
    title,
    date,
    tags: ['sneakers'],
    published: true,
    description,
    author: "The Ghetto Shoe's",
  };
}

/** Extracts the first H1 heading from content. */
function extractTitle(content) {
  const match = content.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : null;
}

/** Extracts a description: first sentence or first 150 chars of body content. */
function extractDescription(content) {
  // Strip frontmatter and H1
  const body = content
    .replace(/---[\s\S]*?---\s*/, '')
    .replace(/^#\s+.*$/m, '')
    .trim();
  const firstSentence = body.match(/^[^.]+\./);
  if (firstSentence) {
    return firstSentence[0].trim().slice(0, 200);
  }
  return body.replace(/\n+/g, ' ').slice(0, 150).trim();
}

/** Converts a frontmatter object back to YAML string. */
function frontmatterToString(fm) {
  let result = '---\n';
  for (const [key, value] of Object.entries(fm)) {
    if (Array.isArray(value)) {
      result += `${key}: [${value.map(v => `"${v.replace(/"/g, '\\"')}"`).join(', ')}]\n`;
    } else if (typeof value === 'string') {
      // Escape backslashes and double quotes for YAML double-quoted strings
      const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      result += `${key}: "${escaped}"\n`;
    } else {
      result += `${key}: ${value}\n`;
    }
  }
  result += '---\n\n';
  return result;
}

// ── Wiki Transformations (T9) ──────────────────────────────────────────────

/**
 * Transforms Obsidian wiki-image syntax to standard markdown.
 * `![[file.png]]` → `![](/images/normalized-file.png)`
 *
 * @param {string} content - The markdown content
 * @param {Object<string,string>} imageMap - Mapping of original → normalized filenames
 * @returns {string}
 */
function transformWikiImages(content, imageMap) {
  return content.replace(/!\[\[([^\]]+\.(png|jpg|jpeg|gif|webp|svg))\]\]/gi, (_match, filename) => {
    const normalized = imageMap[filename] || null;
    if (normalized) {
      return `![](/images/${encodeURIComponent(normalized)})`;
    }
    // Image not found in vault — leave reference but log warning
    console.warn(`    ⚠ Image not found in vault: "${filename}" — keeping original reference`);
    return _match;
  });
}

/**
 * Phrases that refer to vault-internal organizational notes, not content.
 * Wikilinks containing these phrases are stripped entirely.
 */
const VAULT_ORG_PHRASES = [
  'sistema neuronal central',
];

/**
 * Checks if a wikilink target should be stripped entirely (not shown in published content).
 * @param {string} text - The wikilink target text (trimmed)
 * @returns {boolean}
 */
function shouldStripWikilink(text) {
  // Strip file paths (vault-internal navigation, not content)
  if (/[/\\]/.test(text)) return true;
  // Strip known organizational phrases
  const lower = text.toLowerCase();
  return VAULT_ORG_PHRASES.some((phrase) => lower.includes(phrase));
}

/**
 * Transforms Obsidian wikilinks.
 * - Known pages → `[Text](/link)`
 * - Strip internal paths and org phrases → removed entirely
 * - Others → plain text
 *
 * @param {string} content - The markdown content
 * @param {Set<string>} [knownPages] - Set of known page slugs for link generation
 * @returns {string}
 */
function transformWikiLinks(content, knownPages = new Set()) {
  return content.replace(/\[\[([^\]]+)\]\]/g, (_match, text) => {
    const trimmed = text.trim();

    // Strip vault-internal paths and organizational phrases
    if (shouldStripWikilink(trimmed)) return '';

    // If the link matches a known page slug, create an internal link
    const slug = generateSlug(trimmed);
    if (knownPages.has(slug)) {
      return `[${trimmed}](/${slug})`;
    }

    // Otherwise show as plain text
    return trimmed;
  });
}

// ── Image Pipeline ──────────────────────────────────────────────────────────

/**
 * Builds a map of original → normalized image filenames
 * and copies images to the public directory.
 *
 * @param {boolean} dryRun
 * @returns {{ imageMap: Object<string,string>, stats: { synced: number, skipped: number, errors: string[] } }}
 */
function processImages(dryRun) {
  const stats = { synced: 0, skipped: 0, errors: [] };
  const imageMap = {};

  if (!fs.existsSync(IMAGES_SOURCE)) {
    log('warn', `Images source not found: ${IMAGES_SOURCE}`, dryRun);
    return { imageMap, stats };
  }

  // Ensure destination exists
  if (!fs.existsSync(IMAGES_DEST)) {
    if (!dryRun) fs.mkdirSync(IMAGES_DEST, { recursive: true });
    log('info', `Created images directory: ${IMAGES_DEST}`, dryRun);
  }

  const files = fs.readdirSync(IMAGES_SOURCE);

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!IMAGE_EXTS.has(ext)) continue;

    const sourcePath = path.join(IMAGES_SOURCE, file);
    const normalizedName = normalizeImageName(file);
    const destPath = path.join(IMAGES_DEST, normalizedName);

    imageMap[file] = normalizedName;

    // Skip if destination already exists with same size (use size as quick check)
    if (fs.existsSync(destPath)) {
      const srcStat = fs.statSync(sourcePath);
      const dstStat = fs.statSync(destPath);
      if (srcStat.size === dstStat.size) {
        log('info', `Image "${file}" → already exists as "${normalizedName}", skipping`, dryRun);
        stats.skipped++;
        continue;
      }
      // Different size — newer wins (overwrite)
      log('info', `Image "${file}" → updating "${normalizedName}" (size differs)`, dryRun);
    } else {
      log('info', `Image "${file}" → "${normalizedName}"`, dryRun);
    }

    if (!dryRun) {
      try {
        fs.copyFileSync(sourcePath, destPath);
        stats.synced++;
      } catch (err) {
        const msg = `Failed to copy "${file}": ${err.message}`;
        log('error', msg, dryRun);
        stats.errors.push(msg);
      }
    } else {
      stats.synced++;
    }
  }

  return { imageMap, stats };
}

/**
 * Generates a set of known page slugs from the pages collection.
 * Used by transformWikiLinks to create internal links.
 */
function getKnownPages() {
  const pages = new Set();
  if (fs.existsSync(PAGES_DEST)) {
    const files = fs.readdirSync(PAGES_DEST);
    for (const file of files) {
      if (file.endsWith('.md')) {
        pages.add(generateSlug(file));
      }
    }
  }
  return pages;
}

// ── Content Gallery (Contenido del {date}.md) ────────────────────────────────

/**
 * Finds a matching "Contenido del {date}.md" in the images vault and returns
 * its full body with wiki images transformed to markdown, plus the first image
 * for the hero.
 *
 * @param {string} postFile - The vault post filename (e.g. "17 de junio del 2026.md")
 * @param {Object<string,string>} imageMap - Mapping of original → normalized filenames
 * @returns {{ body: string|null, firstImage: string|null }}
 */
function getContenidoNote(postFile, imageMap) {
  const name = path.basename(postFile, path.extname(postFile));
  const dateMatch = name.match(/(\d{1,2}\s+de\s+\w+\s+(?:del|de)\s+\d{4})/);
  if (!dateMatch) return { body: null, firstImage: null };

  const contenidoFile = path.join(IMAGES_SOURCE, `Contenido del ${dateMatch[1]}.md`);
  if (!fs.existsSync(contenidoFile)) return { body: null, firstImage: null };

  let body = fs.readFileSync(contenidoFile, 'utf-8');

  // Strip any frontmatter if present
  const parsed = extractFrontmatter(body);
  if (parsed) {
    body = parsed.restContent;
  }

  // Transform wiki images to markdown: ![[file.png]] → ![](/images/normalized-file.png)
  body = body.replace(/!\[\[([^\]]+\.(png|jpg|jpeg|gif|webp|svg))\]\]/gi, (_match, filename) => {
    const normalized = imageMap[filename];
    if (normalized) {
      return `![](/images/${encodeURIComponent(normalized)})`;
    }
    return _match;
  });

  // Transform wikilinks: strip org phrases and paths, others to plain text
  body = body.replace(/\[\[([^\]]+)\]\]/g, (_match, text) => {
    const trimmed = text.trim();
    if (shouldStripWikilink(trimmed)) return '';
    return trimmed;
  });

  // Extract first image for hero
  const firstImgMatch = body.match(/\/images\/([^"')]+)/);
  const firstImage = firstImgMatch ? decodeURIComponent(firstImgMatch[1]) : null;

  if (!body.trim()) return { body: null, firstImage: null };

  return { body: '\n\n' + body.trim() + '\n', firstImage };
}

// ── Post Processing ─────────────────────────────────────────────────────────

function processPosts(dryRun, imageMap) {
  const stats = { synced: 0, skipped: 0, errors: [] };

  if (!fs.existsSync(POSTS_SOURCE)) {
    log('error', `Posts source not found: ${POSTS_SOURCE}`, dryRun);
    return stats;
  }

  if (!fs.existsSync(POSTS_DEST)) {
    if (!dryRun) fs.mkdirSync(POSTS_DEST, { recursive: true });
  }

  const files = fs.readdirSync(POSTS_SOURCE).filter(f => f.endsWith('.md') && !f.startsWith('Textos'));
  const knownPages = getKnownPages();

  for (const file of files) {
    const filePath = path.join(POSTS_SOURCE, file);
    const stats_f = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const slug = generateSlug(file);
    const destFile = path.join(POSTS_DEST, `${slug}.md`);

    // Process frontmatter
    const parsed = extractFrontmatter(content);
    let newContent;
    let action;

    // Check for matching Contenido del note inside the content folder
    const contenido = getContenidoNote(file, imageMap);

    if (parsed) {
      // Existing frontmatter: merge with defaults for missing fields
      const defaults = generateFrontmatter(parsed.restContent, {
        filename: file, mtime: stats_f.mtime, slug,
      });
      const fm = { ...defaults, ...parsed.frontmatter };
      // Use first image from Contenido note as hero if post doesn't have its own
      if (contenido.body && !fm.image) {
        fm.image = contenido.firstImage;
      }
      newContent = frontmatterToString(fm) + parsed.restContent;
      action = 'merged existing frontmatter';
    } else {
      // No frontmatter: inject from file analysis
      const fm = generateFrontmatter(content, {
        filename: file, mtime: stats_f.mtime, slug,
      });
      // Use first image from Contenido note as hero if post doesn't have its own
      if (contenido.body && !fm.image) {
        fm.image = contenido.firstImage;
      }
      newContent = frontmatterToString(fm) + content;
      action = 'injected new frontmatter';
    }

    // Transform wiki syntax in the post body
    newContent = transformWikiImages(newContent, imageMap);
    newContent = transformWikiLinks(newContent);

    // Append the Contenido del note body right after the post text
    if (contenido.body) {
      newContent += contenido.body;
    }

    // Write or dry-run
    if (!dryRun) {
      fs.writeFileSync(destFile, newContent, 'utf-8');
    }

    log('ok', `Post "${file}" → ${slug}.md (${action})`, dryRun);
    stats.synced++;
  }

  return stats;
}

// ── Static Page Processing ──────────────────────────────────────────────────

function processStaticPages(dryRun, imageMap) {
  const stats = { synced: 0, skipped: 0, errors: [] };

  if (!fs.existsSync(PAGES_DEST)) {
    if (!dryRun) fs.mkdirSync(PAGES_DEST, { recursive: true });
  }

  for (const page of STATIC_PAGES) {
    if (!fs.existsSync(page.vaultFile)) {
      log('warn', `Static page source not found: ${page.vaultFile}`, dryRun);
      stats.skipped++;
      continue;
    }

    const content = fs.readFileSync(page.vaultFile, 'utf-8');
    const stats_f = fs.statSync(page.vaultFile);

    // Handle frontmatter
    const parsed = extractFrontmatter(content);
    let newContent;
    let action;

    if (parsed) {
      const defaults = generateFrontmatter(parsed.restContent, {
        filename: path.basename(page.vaultFile),
        mtime: stats_f.mtime,
        slug: page.name,
      });
      // For pages, only add title and date if missing
      const fm = {
        title: defaults.title,
        date: defaults.date,
        ...parsed.frontmatter,
      };
      newContent = frontmatterToString(fm) + parsed.restContent;
      action = 'merged existing frontmatter';
    } else {
      const fm = generateFrontmatter(content, {
        filename: path.basename(page.vaultFile),
        mtime: stats_f.mtime,
        slug: page.name,
      });
      // Pages only need title + optional date
      const pageFm = { title: fm.title, date: fm.date };
      newContent = frontmatterToString(pageFm) + content;
      action = 'injected new frontmatter';
    }

    // Transform wiki syntax
    newContent = transformWikiImages(newContent, imageMap);
    newContent = transformWikiLinks(newContent);

    if (!dryRun) {
      fs.writeFileSync(page.destFile, newContent, 'utf-8');
    }

    log('ok', `Page "${path.basename(page.vaultFile)}" → ${page.name}.md (${action})`, dryRun);
    stats.synced++;
  }

  return stats;
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const startTime = Date.now();

  console.log(`\n  ── Sync: Obsidian Vault → Astro Blog ──`);
  console.log(`  Vault: ${VAULT_PATH}`);
  console.log(`  Mode:  ${dryRun ? 'DRY RUN (no files modified)' : 'LIVE'}\n`);

  // Validate vault path
  if (!fs.existsSync(VAULT_PATH)) {
    log('warn', `Vault path does not exist: ${VAULT_PATH}`);
    log('warn', 'Set VAULT_PATH env var or check the default. Using existing content.');
    console.log('');
    return 0;
  }

  // 1. Process images (build image map + copy)
  log('info', '── Images ──', dryRun);
  const { imageMap, stats: imgStats } = processImages(dryRun);

  // 2. Process blog posts
  log('info', '── Blog Posts ──', dryRun);
  const postStats = processPosts(dryRun, imageMap);

  // 3. Process static pages
  log('info', '── Static Pages ──', dryRun);
  const pageStats = processStaticPages(dryRun, imageMap);

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalSynced = imgStats.synced + postStats.synced + pageStats.synced;
  const totalSkipped = imgStats.skipped + postStats.skipped + pageStats.skipped;
  const totalErrors = imgStats.errors.length + postStats.errors.length + pageStats.errors.length;

  logSummary({
    Images: imgStats,
    Posts: postStats,
    Pages: pageStats,
  }, dryRun);

  console.log(`\n  Done in ${elapsed}s — ${totalSynced} synced, ${totalSkipped} skipped, ${totalErrors > 0 ? totalErrors + ' errors' : '0 errors'}`);
  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
