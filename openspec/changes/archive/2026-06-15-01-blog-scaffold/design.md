# Design: 01 — Blog Scaffold

## Technical Approach

Greenfield Astro 5.x SSG with content collections. All pages are statically generated at build time — zero client JS except for decorative interactions. A Node.js sync script (`scripts/sync.js`) bridges the Obsidian vault to `src/content/`, transforming wiki-markdown to Astro-compatible frontmatter and copying assets to `public/images/`.

## Architecture Decisions

| # | Decision | Choice | Rejected | Rationale |
|---|----------|--------|----------|-----------|
| 1 | Build mode | SSG (no SSR) | SSR, hybrid | Static blog needs no server; GitHub Pages can serve flat files |
| 2 | Content source | Astro Content Collections | External CMS, markdown files | Collections give schema validation + type safety; sync script handles vault→src bridge |
| 3 | Post slug strategy | Filename-derived, normalized | Frontmatter `slug` field | Must match vault filenames; sync script normalizes accents (R3) |
| 4 | Pagination | Astro built-in `paginate()` | Custom logic | Zero-dependency, integrates with collections |
| 5 | Image pipeline | Sync script copies to `public/images/` | Dynamic fetch at build | Build-time determinism; no network deps during build |
| 6 | Page styling | CSS custom properties + global stylesheet | Framework (Tailwind/MDC) | Minimal deps; retro theme is unique enough to handcraft |
| 7 | Deploy target | GitHub Pages via `gh-pages` branch | Vercel/Netlify | User requirement, free, no config needed |
| 8 | Font loading | Google Fonts via `<link>` in BaseLayout | `@fontsource` npm | Simpler, no npm version management needed |

## Color System

```css
:root {
  --color-primary: #590111;    /* Body bg, header bg, footer bg */
  --color-accent: #BFC024;     /* H1/H2, highlights, accent borders */
  --color-secondary: #7A4D26;  /* Decorative borders, vintage details */
  --color-surface: #E7A594;    /* Card bg, section bg, sidebar */
  --color-cta: #C95F5F;        /* Buttons, links, hover states, CTAs */
  --color-text-light: #f5f0e8; /* Text on dark backgrounds */
  --color-text-dark: #1a1a1a;  /* Text on light backgrounds */
  --font-heading: 'Luckiest Guy', 'Bebas Neue', 'Arial Black', cursive;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
}
```

## Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Obsidian Vault  │────▶│  scripts/sync.js  │────▶│  src/content/  │
│  DeepSearch/*.md │     │  (transform +     │     │  posts/  *.md  │
│  Carpetas/*.png  │     │   copy assets)    │     │  pages/  *.md  │
└─────────────────┘     └──────────────────┘     └───────┬────────┘
       │                     │                           │
       │              public/images/                     │
       │                                                 ▼
       └────────────────────────────────────────▶  astro build
                                                    │
                                                    ▼
                                              dist/ ──▶ GitHub Pages
```

## Component Architecture

### Content Collections Schema

```typescript
// src/content/config.ts
const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
    published: z.boolean().default(true),
    description: z.string().optional(),
    author: z.string().default("The Ghetto Shoe's"),
    image: z.string().optional(),      // hero image path relative to /images/
  }),
});
const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date().optional(),
    order: z.number().optional(),      // nav ordering
  }),
});
```

### Component Props & Color Map

| Component | Props | Colors | States |
|-----------|-------|--------|--------|
| `BaseLayout.astro` | `title`, `description?`, `image?` | `--color-primary` bg, `--color-text-light` body text | N/A — structural |
| `PostLayout.astro` | `(collection entry)` | Sidebar: `--color-surface` | N/A |
| `Header.astro` | none (reads nav from site config) | `--color-primary` bg, `--color-accent` logo, `--color-text-light` nav links | Hover: `--color-cta` |
| `Footer.astro` | none | `--color-primary` bg, `--color-text-light` text, `--color-accent` links | Hover: `--color-cta` |
| `HeroPost.astro` | `{ post: CollectionEntry<'posts'> }` | `--color-surface` card bg, `--color-cta` badge | Hover: subtle translateY |
| `PostCard.astro` | `{ post, index? }` | `--color-surface` card bg, `--color-secondary` 3px border, `--color-accent` title | Hover: `--color-secondary` border lifts |
| `PostGrid.astro` | `{ posts }` + `{ page }` for pagination | N/A — layout only, CSS grid | Empty: friendly message |
| `TagBadge.astro` | `{ tag, active? }` | `--color-secondary` bg default, `--color-cta` bg active | Hover: `--color-cta` bg |
| `ShareButtons.astro` | `{ url, title }` | `--color-cta` buttons | Hover: opacity 0.8 |
| `Pagination.astro` | `{ page, totalPages }` | `--color-accent` numbers, `--color-cta` active page | Hover: `--color-cta` |
| `SyncStatus.astro` | `{ lastSync? }` | `--color-surface` card | Shows "Última sincronización: ..." |

### Responsive Grid

- **Mobile** (<640px): 1 column
- **Tablet** (640–1023px): 2 columns
- **Desktop** (≥1024px): 3 columns (post grid), 2 columns (hero + sidebar)

Implemented via CSS Grid with `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Create | Astro project deps |
| `astro.config.mjs` | Create | SSG config, `@astrojs/sitemap` integration |
| `tsconfig.json` | Create | TypeScript for Astro |
| `src/content/config.ts` | Create | Content collection schemas (posts, pages) |
| `src/layouts/BaseLayout.astro` | Create | HTML shell, fonts, meta/OG tags, CSS vars |
| `src/layouts/PostLayout.astro` | Create | Article layout + sidebar |
| `src/components/Header.astro` | Create | Nav bar |
| `src/components/Footer.astro` | Create | Footer |
| `src/components/HeroPost.astro` | Create | Featured post card |
| `src/components/PostCard.astro` | Create | Grid card |
| `src/components/PostGrid.astro` | Create | Grid wrapper |
| `src/components/TagBadge.astro` | Create | Tag pill |
| `src/components/ShareButtons.astro` | Create | Share links |
| `src/components/Pagination.astro` | Create | Page nav |
| `src/components/SyncStatus.astro` | Create | Sync indicator |
| `src/pages/index.astro` | Create | Homepage |
| `src/pages/posts/index.astro` | Create | Paginated archive |
| `src/pages/posts/[...slug].astro` | Create | Dynamic post route |
| `src/pages/tags/[tag].astro` | Create | Tag filter |
| `src/pages/about.astro` | Create | About page |
| `src/pages/metas.astro` | Create | Goals page |
| `src/pages/rss.xml.js` | Create | RSS feed |
| `src/styles/global.css` | Create | CSS custom properties, base styles, grid |
| `scripts/sync.js` | Create | Vault sync script |
| `public/images/.gitkeep` | Create | Image directory placeholder |
| `.env.example` | Create | `VAULT_PATH` example |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Build | All routes render without 404s | `astro check`; CI build step |
| Sync | Frontmatter injection, wikilink conversion | Manual with `--dry-run` flag; real vault file test |
| Visual | Color application, responsive grid | Browser inspection at 3 breakpoints |

## Migration / Rollout

No migration required — greenfield project. First deploy after `astro build` confirms all routes render and RSS validates.

## Open Questions

- [ ] Exact Google Font choice: confirm "Luckiest Guy" for headings or use "Bebas Neue" (lighter weight)?
- [ ] Vault default path: use `.env` or hardcode relative path in sync script?
- [ ] Monthly archive page (`/archive` per R5): include in this scaffold or defer to a follow-up change?
