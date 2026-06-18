# Content Sync Specification

## Purpose
Defines the Node.js sync script that bridges the Obsidian vault to the Astro project, transforming vault markdown and assets into the expected blog format.

## Requirements

### R1: Read from Vault
The script MUST read `.md` files from a configurable vault path (default: `DeepSearch Diarias de Geminis/`). Path MUST be configurable via `.env` file (`VAULT_PATH`).

#### Scenario: Vault path configured
- GIVEN `VAULT_PATH=D:/Cerebro/...` in `.env`
- WHEN the script runs
- THEN it reads all `.md` files from that directory

### R2: Frontmatter Injection
Every synced post MUST have valid frontmatter. Missing frontmatter uses H1 fallback for title and file mtime for date. Existing frontmatter is preserved; partial frontmatter is merged with defaults.

#### Scenario: Full frontmatter present
- GIVEN a file with complete frontmatter
- WHEN synced
- THEN frontmatter is preserved unchanged

#### Scenario: No frontmatter with H1
- GIVEN a file starting with `# Nuevo Lanzamiento` and no frontmatter
- WHEN synced
- THEN frontmatter is injected with title "Nuevo Lanzamiento" and mtime date

### R3: Wiki-Image Conversion
The script MUST convert `![[file.png]]` to `![](/images/file.png)` and copy the image from the vault's image folder (`Carpetas de Contenido de The Ghetto Shoes/`) to `public/images/`.

#### Scenario: Image exists in vault
- GIVEN `![[zapa.png]]` and the file exists in vault images
- WHEN synced
- THEN output is `![](/images/zapa.png)` and file is copied

#### Scenario: Image not found
- GIVEN `![[missing.png]]` but file does not exist in vault images
- WHEN synced
- THEN the script logs a warning and leaves the reference unchanged

### R4: Wikilink Handling
The script MUST convert `[[link]]` syntax: if link matches an existing page route, create an internal link; otherwise strip to plain text.

#### Scenario: Wikilink matches route
- GIVEN `[[about]]` and `/about` exists
- WHEN synced
- THEN output is `[about](/about)`

#### Scenario: Wikilink no match
- GIVEN `[[Nota Aleatoria]]` with no matching page
- WHEN synced
- THEN output is plain text "Nota Aleatoria"

### R5: Asset Copy
Images from `Carpetas de Contenido de The Ghetto Shoes/` MUST copy to `public/images/`. Duplicates are skipped (newer wins).

#### Scenario: New image
- GIVEN a PNG in vault images not yet in `public/images/`
- WHEN synced
- THEN the file is copied

### R6: Script Interface
The script MUST be invocable via `npm run sync` and log synced files, frontmatter changes, and warnings. The `--dry-run` flag SHALL log what would change without modifying files.
