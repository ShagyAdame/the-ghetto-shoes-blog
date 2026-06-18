# Proposal: 01 — Blog Scaffold

## Intent

Greenfield Astro blog for "The Ghetto Shoe's" — a retro/vaporwave-themed static site sourcing content from an Obsidian vault. Magazine-style homepage, blog posts, static pages (About, Metas), image pipeline, RSS, and sitemap.

## Scope

### In Scope
1. Astro project scaffold with SSG config
2. Content collection (posts from vault MD files)
3. Magazine-style homepage (featured post + 4 product images)
4. Post detail page with archive/routing
5. About + Metas static pages
6. Vault-to-blog sync script (Node.js)
7. Wiki-image → standard image pipeline
8. Retro color theme (5-brand palette)
9. RSS feed + sitemap

### Out of Scope
- E-commerce / store
- Comments system
- Search
- Multi-language
- Analytics
- Internal workflow docs (PASO 1-3, YouTube, Sistema Neuronal)

## Capabilities

> Contract between proposal and specs phases. No existing specs — all capabilities are new.

### New Capabilities
- `blog-content`: Content collection schema, frontmatter fallback (H1→title, mtime→date), slug routing, pagination, monthly archive
- `content-sync`: Node.js sync script — read vault MDs, inject frontmatter, convert `![[img.png]]` → `![](/images/img.png)`, strip wikilinks, copy assets
- `retro-theme`: Design system — CSS custom properties for the 5-brand palette, chunky typography, responsive grid, retro/vaporwave aesthetic
- `rss-seo`: Astro RSS feed from posts collection, sitemap generation

### Modified Capabilities
None — this is the first change.

## Approach

Astro SSG with content collections. Node.js sync script bridges Obsidian vault to the project. Deploy to GitHub Pages via `astro build`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `astro.config.*` | New | Astro config (SSG, integrations) |
| `src/content/` | New | Blog post collection + schema |
| `src/pages/` | New | Routes: index, [slug], about, metas |
| `src/layouts/` | New | Base HTML layout |
| `src/styles/` | New | Retro theme CSS |
| `scripts/sync.js` | New | Vault → blog sync script |
| `public/images/` | New | Copied product/screenshot PNGs |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Wikilink edge cases break sync | Med | Test with real vault files first |
| Vault file encoding issues | Low | Force UTF-8 in sync script |
| Color contrast accessibility | Low | Verify WCAG ratios for body text |

## Rollback Plan

Remove all generated files (everything except `.atl/` and `openspec/`). Openspec artifacts stay to document what was attempted.

## Dependencies

- Astro v5.x (stable)
- `@astrojs/rss`, `@astrojs/sitemap`
- Node.js 18+ for sync script
- `remark-wiki-link` or custom rehype plugin

## Success Criteria

- [ ] `astro build` produces static output with no broken links
- [ ] All 5 brand colors applied as CSS custom properties
- [ ] Homepage renders 4 product images + latest featured post
- [ ] `/about` and `/metas` pages render from vault source
- [ ] RSS feed validates
- [ ] sitemap.xml lists all pages
- [ ] Sync script transforms a vault `.md` into a valid blog post
