# RSS & SEO Specification

## Purpose
Defines RSS feed, sitemap, and metadata requirements for discoverability and social sharing of the Spanish-language blog.

## Requirements

### R1: RSS Feed
The system MUST generate an RSS feed at `/rss.xml` from the `posts` collection. Feed includes title, description, pubDate, and link for every published post. Feed title: "The Ghetto Shoe's".

#### Scenario: Published posts exist
- GIVEN 5 published posts
- WHEN visiting `/rss.xml`
- THEN the feed contains 5 valid items

#### Scenario: No published posts
- GIVEN no published posts
- WHEN visiting `/rss.xml`
- THEN the feed is valid XML with an empty channel

### R2: Sitemap
The system MUST generate a sitemap at `/sitemap-index.xml` listing all public routes: `/`, `/posts`, `/posts/[slug]`, `/about`, `/metas`, `/tags/[tag]`.

#### Scenario: All routes indexed
- GIVEN posts and static pages exist
- WHEN visiting `/sitemap-index.xml`
- THEN all routes are listed with correct lastmod dates

### R3: Meta Tags
Every page MUST include `<title>` and `<meta name="description">`. Default description: "Blog oficial de The Ghetto Shoe's — lanzamientos, cultura urbana y estilo."

#### Scenario: Post detail meta
- GIVEN a post titled "Nuevo Lanzamiento" with description "Review exclusivo"
- WHEN rendering the post page
- THEN `<title>` is "Nuevo Lanzamiento | The Ghetto Shoe's" and description is "Review exclusivo"

### R4: Open Graph Tags
Every page MUST include `og:title`, `og:description`, `og:type`, `og:url`, and `og:image` (if available). Blog posts MUST use `og:type: article`.

#### Scenario: Blog post with image
- GIVEN a blog post with title, description, and image
- WHEN rendered
- THEN all OG tags are present, og:type is "article", and og:image matches the post image

#### Scenario: Page without image
- GIVEN a static page with no image field
- WHEN rendered
- THEN og:image falls back to the site's default logo

### R5: Canonical URLs
Every page MUST include `<link rel="canonical" href="...">` pointing to the production domain.

### Notes
- RSS feed generated via `@astrojs/rss` at `/rss.xml`
- Sitemap generated via `@astrojs/sitemap` integration at `/sitemap-index.xml`
- OG image meta tag is conditionally rendered: only present when post has an image
- Default OG image was removed as the referenced `default-og.jpg` did not exist
- Canonical URLs point to `https://theghettoshoes.github.io`
