# Skill Registry — the-ghetto-shoes-blog

**Generated**: 2026-06-15
**Agent**: opencode (big-pickle)
**Persistence**: hybrid (openspec + Engram)

---

## Scanned Sources

- `C:\Users\laea-\.config\opencode\skills\` — user-level (scan order: 1)
- `C:\Users\laea-\.claude\skills\` — user-level (scan order: 5)

## Registry Contract

- This is an INDEX, not a summary. Subagents receive exact SKILL.md paths and read the full source of truth.
- Skip `sdd-*`, `_shared`, and `skill-registry` skills from the index (SDD skills are loaded by orchestrator phase, not by matching).
- Deduplicate by skill name, preferring first source in scan order.
- Convention files (`AGENTS.md`, etc.) are included when present.

---

## Convention Files

No project-level convention files detected (greenfield project).

---

## Indexed Skills

### branch-pr
- **Description**: Create Gentle AI pull requests with issue-first checks. Trigger: creating, opening, or preparing PRs for review.
- **Scope**: user
- **Path**: `C:\Users\laea-\.config\opencode\skills\branch-pr\SKILL.md`

### chained-pr
- **Description**: Trigger: PRs over 400 lines, stacked PRs, review slices. Split oversized changes into chained PRs that protect review focus.
- **Scope**: user
- **Path**: `C:\Users\laea-\.config\opencode\skills\chained-pr\SKILL.md`

### cognitive-doc-design
- **Description**: Design docs that reduce cognitive load. Trigger: writing guides, READMEs, RFCs, onboarding, architecture, or review-facing docs.
- **Scope**: user
- **Path**: `C:\Users\laea-\.config\opencode\skills\cognitive-doc-design\SKILL.md`

### comment-writer
- **Description**: Write warm, direct collaboration comments. Trigger: PR feedback, issue replies, reviews, Slack messages, or GitHub comments.
- **Scope**: user
- **Path**: `C:\Users\laea-\.config\opencode\skills\comment-writer\SKILL.md`

### customize-opencode
- **Description**: Use ONLY when the user is editing or creating opencode's own configuration: opencode.json, opencode.jsonc, files under .opencode/, or files under ~/.config/opencode/. Also use when creating or fixing opencode agents, subagents, skills, plugins, MCP servers, or permission rules.
- **Scope**: built-in
- **Path**: `<built-in>`

### go-testing
- **Description**: Trigger: Go tests, go test coverage, Bubbletea teatest, golden files. Apply focused Go testing patterns.
- **Scope**: user
- **Path**: `C:\Users\laea-\.config\opencode\skills\go-testing\SKILL.md`

### issue-creation
- **Description**: Create Gentle AI issues with issue-first checks. Trigger: creating GitHub issues, bug reports, or feature requests.
- **Scope**: user
- **Path**: `C:\Users\laea-\.config\opencode\skills\issue-creation\SKILL.md`

### judgment-day
- **Description**: Trigger: judgment day, dual review, adversarial review, juzgar. Run blind dual review, fix confirmed issues, then re-judge.
- **Scope**: user
- **Path**: `C:\Users\laea-\.config\opencode\skills\judgment-day\SKILL.md`

### skill-creator
- **Description**: Trigger: new skills, agent instructions, documenting AI usage patterns. Create LLM-first skills with valid frontmatter.
- **Scope**: user
- **Path**: `C:\Users\laea-\.config\opencode\skills\skill-creator\SKILL.md`

### skill-improver
- **Description**: Trigger: improve skills, audit skills, refactor skills, skill quality. Audit and upgrade existing LLM-first skills.
- **Scope**: user
- **Path**: `C:\Users\laea-\.config\opencode\skills\skill-improver\SKILL.md`

### work-unit-commits
- **Description**: Plan commits as reviewable work units. Trigger: implementation, commit splitting, chained PRs, or keeping tests and docs with code.
- **Scope**: user
- **Path**: `C:\Users\laea-\.config\opencode\skills\work-unit-commits\SKILL.md`

---

## Skipped Skills

| Pattern | Reason |
|---------|--------|
| `sdd-*` (10 skills) | SDD skills loaded by orchestrator phase, not by matching |
| `_shared` (1 skill) | Shared references only |
| `skill-registry` (1 skill) | Registry itself is excluded from indexing |

---

## Summary

- **Total scanned**: 22 SKILL.md files across 2 directories
- **Indexed**: 11 skills
- **Skipped**: 11 (SDD: 10, _shared: 1, registry: 1, duplicates: 0)
- **Convention files**: 0
- **Cache**: regenerated (first init)
