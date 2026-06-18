# Tasks: 01 — Blog Scaffold

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~750–900 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation + Layout + Theme | PR 1 | Astro scaffold, CSS, BaseLayout/Header/Footer, content config |
| 2 | Content Pipeline | PR 2 | Sync script + wiki-image/wikilink transform + asset copy |
| 3 | Pages + Polish | PR 3 | All pages (home, post, archive, tags, about, metas) + RSS/sitemap + deploy |

---

## Phase 1: Foundation

- [x] **T1** — Scaffold Astro project: create `package.json`, `astro.config.mjs` (SSG mode), `tsconfig.json`. Install deps: `astro`, `@astrojs/sitemap`, `@astrojs/rss`.
- [x] **T2** — Create `src/styles/global.css` with CSS custom properties (`--color-*`), typography (`--font-heading`, `--font-body`), base reset, and responsive grid classes.
- [x] **T3** — Create `.env.example` with `VAULT_PATH` and `public/images/.gitkeep`.

## Phase 2: Layout

- [x] **T4** — Create `src/content/config.ts` with posts schema (title, date, tags, published, description, author, image) and pages schema (title, date, order).
- [x] **T5** — Create `src/layouts/BaseLayout.astro` with HTML shell, Google Fonts link, meta tags, OG tags, canonical URL, and CSS import.
- [x] **T6** — Create `src/layouts/PostLayout.astro` with article wrapper and sidebar.
- [x] **T7** — Create `src/components/Header.astro` (nav bar with brand colors, hover → `--color-cta`) and `src/components/Footer.astro`.

## Phase 3: Content Pipeline

- [x] **T8** — Create `scripts/sync-vault.mjs`: reads vault `.md` files, injects frontmatter (H1→title fallback, mtime→date fallback), slug normalization (strip accents, ñ→n), copies images to `public/images/`, strips wikilinks. Supports `--dry-run`.
- [x] **T9** — Implement wiki-image conversion (`![[img.png]]` → `![](/images/img.png)`) and wikilink conversion (`[[about]]` → `[about](/about)`) in sync script with warning logging for missing images.

## Phase 4: Pages

- [x] **T10** — Create `src/components/HeroPost.astro`, `PostCard.astro`, `PostGrid.astro`, `TagBadge.astro`, `Pagination.astro`, `ShareButtons.astro`, `SyncStatus.astro`.
- [x] **T11** — Create `src/pages/index.astro` (homepage with featured HeroPost + recent PostGrid + brand intro).
- [x] **T12** — Create `src/pages/posts/[...slug].astro` (post detail with image, date, tags, share buttons).
- [x] **T13** — Create `src/pages/posts/index.astro` (paginated archive, 9 per page, empty state message) and `src/pages/tags/[tag].astro` (filtered by tag).
- [x] **T14** — Create `src/pages/about.astro` and `src/pages/metas.astro` (static pages from vault content collections).

## Phase 5: Polish

- [x] **T15** — Create `src/pages/rss.xml.js` (RSS feed from posts collection) and enable `@astrojs/sitemap` in config for `/sitemap-index.xml`.
- [x] **T16** — Run `npm run sync` with real vault content, then `astro build` — verify all routes render, no broken links, RSS validates.
- [x] **T17** — Git init, create `.gitignore`, first commit, deploy to GitHub Pages.
