# Blog Content Specification

## Purpose
Defines the Astro Content Collection schema and routing for blog posts sourced from the Obsidian vault after sync transformation. All content is in Spanish.

## Requirements

### R1: Content Collection Schema
The system MUST define an Astro Content Collection named `posts` with: `title` (string, required), `date` (date, required), `tags` (string[], optional, default []), `published` (boolean, optional, default true), `description` (string, optional), `author` (string, optional, default "The Ghetto Shoe's"), `image` (string, optional).

#### Scenario: Valid post
- GIVEN a markdown file with all required frontmatter fields
- WHEN Astro loads the collection
- THEN the post is available without validation errors

#### Scenario: Missing optional fields
- GIVEN a markdown file with only title and date
- WHEN Astro loads the collection
- THEN defaults are applied for missing optional fields

### R2: Frontmatter Fallback
Files without frontmatter MUST infer `title` from the first H1 heading and `date` from the file's last modified timestamp.

#### Scenario: H1 present, no frontmatter
- GIVEN a file starting with `# Mi Título` and no frontmatter
- WHEN the sync script processes it
- THEN title becomes "Mi Título" and date becomes the file's mtime

#### Scenario: No H1 and no frontmatter
- GIVEN a file with no heading and no frontmatter
- WHEN processed
- THEN title falls back to the filename (without .md extension)

### R3: Slug Generation
Slugs MUST derive from the filename: lowercase, strip accents, replace ñ with n, spaces to hyphens, remove non-alphanumeric chars.

#### Scenario: Spanish filename
- GIVEN `Lanzamiento Único.md`
- WHEN slug is generated
- THEN result is `lanzamiento-unico`

### R4: Routes
The system MUST define these routes: `/` (homepage with featured post + recent grid + brand intro), `/posts/[slug]` (full post with images/date/tags), `/posts` (paginated archive, 9 per page), `/about` (static brand page), `/metas` (static mission page), `/tags/[tag]` (filtered post list).

#### Scenario: Pagination overflow
- GIVEN 12 published posts at 9 per page
- WHEN visiting `/posts`
- THEN page 1 shows 9 posts with pagination to page 2

#### Scenario: Empty archive
- GIVEN no published posts
- WHEN visiting `/posts`
- THEN a friendly empty-state message is shown

#### Scenario: Tag filter
- GIVEN posts tagged "lanzamientos" and "cultura"
- WHEN visiting `/tags/lanzamientos`
- THEN only matching posts are shown

### R5: Monthly Archive
The system SHOULD provide `/archive` grouping posts by month in reverse chronological order with month headings (e.g., "Junio 2026").
