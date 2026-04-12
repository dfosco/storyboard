# Plan: Metadata-driven AGENTS scaffolding (core + client)

## Problem

`AGENTS.md` has hardcoded critical instructions and skills bullets that can drift from actual `SKILL.md` files. We need AGENTS sections generated from skill metadata and wired into setup/update scaffolding in both:

- `/Users/dfosco/workspace/storyboard-core`
- `/Users/dfosco/workspace/storyboard`

## Current state

- Core AGENTS has hardcoded skill list (`<!-- skills-block -->` markers) and hardcoded critical ship instructions.
- Skill frontmatter currently has `name`/`description` but no `agent-description` / `agent-critical`.
- Core scaffold sync does not generate AGENTS blocks.
- Core has no `npm run setup`.
- Client has update scripts but no setup script, and AGENTS is hardcoded.

## Confirmed decisions

- Implement in **both repos now**.
- Client skill discovery scope: **top-level only** (`.github/skills/*/SKILL.md`).
- Generated entries ordered **alphabetically by skill name**.
- If `<agent-skills-critical>` / `<agent-skills>` tokens exist, use them as start boundaries and replace with full opening/closing boundary blocks.
- Ignore files/paths that are:
  - gitignored
  - starting with `_`
  - starting with `+`

## Token and marker examples

### 1) Token-driven insertion (preferred)

If AGENTS contains token lines:

```md
## General instructions
...
<agent-skills-critical>
...
## Skills
<agent-skills>
```

Generator replaces each token line with a full boundary block:

```md
<agent-skills-critical>
- **"Ship", "ship this", "ship a change", "ship a feature"** → always invoke the **ship** skill.
- **"Ship-pr", "[ship-pr]", "ship with PR"** → invoke the **ship** skill in PR mode.
</agent-skills-critical>
```

```md
<agent-skills>
- **agent-browser** (`.github/skills/agent-browser/SKILL.md`) — ...
- **create** (`.github/skills/create/SKILL.md`) — ...
- **ship** (`.github/skills/ship/SKILL.md`) — ...
</agent-skills>
```

### 2) Marker fallback (when tokens are absent)

If tokens are missing, replace between matching marker pairs:

```md
<!-- skills-critical -->
...generated critical block...
<!-- skills-critical -->
```

```md
<!-- skills-block -->
...generated skills block...
<!-- skills-block -->
```

### 3) Metadata fallback behavior (required)

Generator should degrade gracefully when metadata is incomplete:

1. Display name fallback order:
   - `name` (frontmatter)
   - skill folder name
   - file path
2. Skills-block description fallback order:
   - `agent-description`
   - `description`
   - synthesized fallback text from available metadata/path
3. Critical entries:
   - Use `agent-critical` when present.
   - If absent, skip critical lines for that skill (do not error).
4. Missing metadata must never fail generation; minimum output is a list entry using path + any existing metadata.

## Approach

1. Define skill metadata contract
   - Add support for `agent-description` and `agent-critical` in SKILL frontmatter.
2. Migrate AGENTS hardcoded content into skill metadata
   - Move skills-block bullet text into `agent-description`.
   - Move critical ship rules into `agent-critical`.
3. Build AGENTS generator
   - Implement as a dedicated script/module with its own command (separate from scaffold copy logic).
   - Parse top-level skill frontmatter.
   - Apply ignore filters (`_`, `+`, gitignored).
   - Generate critical + skills blocks (alphabetical order).
   - Apply metadata fallback rendering when specific fields are missing.
   - Replace token/boundary blocks idempotently, with marker fallback.
4. Wire scripts in core
   - Add generator entrypoint and `npm run setup` (`npm install` + generation step).
5. Wire scaffold/update for client
   - Ensure scaffold/update path runs AGENTS generation.
   - Add client `npm run setup` that calls the AGENTS generator script directly.
6. Structure as a transferable tool boundary
   - Separate a generic engine from storyboard-specific defaults.
   - Generic engine responsibilities:
     - skill discovery (glob + ignore rules)
     - frontmatter parsing
     - sorting/deduping
     - block replacement (tokens + marker fallback)
     - dry-run/check mode support
   - Storyboard adapter responsibilities:
     - default discovery scope (`.github/skills/*/SKILL.md`)
     - default ignore policy (`_`, `+`, gitignored)
     - default block labels (`agent-skills-critical`, `agent-skills`, `skills-critical`, `skills-block`)
   - Add repo-level `skillz.config.json` contract (future-proof) so external repos can override defaults without code edits.
   - Add config discovery/merge logic across supported locations.
7. Define external-tool publish path
   - Prepare CLI shape suitable for any project (e.g., `agent-skills-scaffold generate|check|init`).
   - Ensure no hardcoded storyboard paths in core engine; only adapter/config values.
   - Keep output deterministic for CI usage.
8. Validate in both repos
   - Added/changed/removed skills
   - Token insertion and marker fallback
   - Repeat runs produce stable output
   - Config-driven behavior remains deterministic and portable.

## Transferable tool design (explicit)

### Engine vs adapter split

- **Engine (publishable)**: path filtering, parsing, generation, replacement.
- **Adapter (storyboard defaults)**: where to look, what to ignore, what block names to use.

### Proposed config shape (repo-local, reusable)

```json
{
  "skillsGlob": ".github/skills/*/SKILL.md",
  "ignorePrefixes": ["_", "+"],
  "respectGitIgnore": true,
  "sort": "name-asc",
  "blocks": {
    "criticalToken": "agent-skills-critical",
    "skillsToken": "agent-skills",
    "criticalMarker": "skills-critical",
    "skillsMarker": "skills-block"
  }
}
```

### Config file locations and resolution

Supported locations in a target repo:

1. `./skillz.config.json`
2. `./.github/skillz.config.json`
3. `./.claude/skillz.config.json`

Resolution strategy (confirmed):

- At runtime, detect how many of the 3 supported config files exist.
- If **more than one** exists, fail with a clear error and list conflicting paths.
- If exactly one exists, use it.
- If none exist, use built-in defaults.

### Source vs client behavior

- Recommended scope: support config in both repos, with client repo as the primary customization point.
- The tool always reads config from the **repo where it runs**.
- Source repo (`storyboard-core`) can define/test defaults and scaffold a starter config template.
- Client repo can keep scaffold defaults or override them locally.

### External CLI contract (future publish target)

- `agent-skills-scaffold generate` — rewrite AGENTS blocks.
- `agent-skills-scaffold check` — verify AGENTS is up to date (non-zero exit on drift).
- `agent-skills-scaffold init` — create default config/tokens in AGENTS.

## Todo list

1. **define-agent-metadata-contract** — Frontmatter schema + parser behavior.
2. **migrate-core-skill-metadata** — Move AGENTS content into skill metadata.
3. **implement-agents-generator** — Idempotent standalone AGENTS generator script with ignore filters and metadata fallback rendering.
4. **wire-core-setup** — Add core setup script and generator invocation.
5. **wire-scaffold-and-update-flow** — Update scaffolded update/setup behavior while keeping copy logic separate from generation logic.
6. **update-client-setup-and-placeholders** — Add client setup and block insertion points; setup must call the AGENTS generator script directly.
7. **design-transferable-engine-boundary** — Split generic generator logic from storyboard-specific defaults.
8. **define-config-contract** — Add a repo-local config format so behavior can be reused in non-storyboard repos.
9. **implement-config-discovery-resolution** — Implement `skillz.config.json` discovery from root/`.github`/`.claude` with strict single-file validation (error on multiple files).
10. **prepare-external-cli-shape** — Define `generate/check/init` command surface for future standalone publication.
11. **validate-generation-paths** — Verify correctness/stability and portability in both repos, including missing-metadata fallback behavior.

## Notes / risks

- Token-boundary replacement must preserve surrounding AGENTS content exactly.
- Client repo includes nested skill trees; generator must intentionally ignore nested paths.
- Setup/update scripts should remain extensible for future setup tasks.
- To keep future publication easy, avoid introducing storyboard-specific assumptions into engine internals.
