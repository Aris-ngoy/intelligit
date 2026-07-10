# Commit Convention

Every commit in IntelliGit follows a structured format so the history stays readable,
changelog generation stays predictable, and pull requests can be reviewed at a glance.

**Commits that do not follow this convention are rejected locally (via Husky) and in CI
(pull requests will fail the *Commit messages* check).**

---

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

| Part      | Required | Description                                      |
|-----------|----------|--------------------------------------------------|
| `type`    | Yes      | What kind of change this is                      |
| `scope`   | No       | Which area of the codebase is affected           |
| `subject` | Yes      | Short, imperative summary (≤ 72 chars ideal)     |
| `body`    | No       | Extra context — **why**, not **what**            |
| `footer`  | No       | Breaking changes, issue references, co-authors |

### Rules at a glance

- Use the **imperative mood**: “add panel resize” not “added panel resize”
- **No period** at the end of the subject line
- Subject line **≤ 100 characters** (header included)
- Scope is **lowercase** when present
- Separate subject from body with a **blank line**

---

## Types

| Type       | When to use                                              | Example |
|------------|----------------------------------------------------------|---------|
| `feat`     | New feature or user-visible behaviour                    | `feat(rebase): add autostash toggle to dialog` |
| `fix`      | Bug fix                                                  | `fix(merge): preserve cursor when accepting theirs` |
| `docs`     | Documentation only (README, comments, this file)         | `docs: document commit convention` |
| `style`    | Formatting, whitespace — no logic change                 | `style(webview): run biome format on panel` |
| `refactor` | Code restructuring without changing behaviour            | `refactor(git): extract log parser helpers` |
| `perf`     | Performance improvement                                  | `perf(panel): virtualize long commit lists` |
| `test`     | Add or update tests                                      | `test(git): cover interactive rebase edge cases` |
| `build`    | Build system, bundler, or packaging                      | `build: bump esbuild to 0.27.3` |
| `ci`       | CI/CD configuration                                      | `ci: add commitlint job to workflow` |
| `chore`    | Maintenance, tooling, deps — not user-facing             | `chore(deps): update @biomejs/biome` |
| `release`  | Version bump / marketplace publish                       | `release: v0.6.0 stash improvements` |
| `revert`   | Revert a previous commit                                 | `revert: feat(stash): drop experimental apply UI` |

---

## Scopes

Scopes are optional but encouraged. They help reviewers filter history by area.

| Scope        | Area |
|--------------|------|
| `extension`  | VS Code extension host — activation, commands, providers |
| `webview`    | React webview apps (shared UI, routing, styles) |
| `git`        | Git service, log parsing, repository operations |
| `rebase`     | Rebase dialog, interactive rebase, rebase service |
| `merge`      | 3-way merge editor and merge logic |
| `conflicts`  | Conflicts list and resolution flow |
| `stash`      | Stash management UI |
| `commit`     | Commit message UI, staging, amend/append |
| `panel`      | Git log panel, sidebar hub, commit table |
| `protocol`   | Extension ↔ webview message types and routing |
| `ci`         | GitHub Actions and automation |
| `deps`       | Dependency upgrades |
| `release`    | Release scripts and marketplace assets |

If your change spans multiple scopes, pick the **primary** one or omit the scope.

---

## Examples

### Minimal (valid)

```
fix(webview): prevent double submit on commit form
```

### With body

```
feat(commit): support amend and append in commit dialog

Users can now amend the previous commit or append to its message
without leaving the IntelliGit commit UI.
```

### With issue reference

```
fix(rebase): handle empty todo after squash

Fixes #42
```

### Breaking change

```
feat(protocol)!: rename stageFile message to stagePaths

BREAKING CHANGE: webview clients must send `stagePaths` instead of `stageFile`.
Extension versions < 0.6.0 are incompatible with this webview build.
```

### Release

```
release: v0.6.0 interactive rebase polish
```

---

## What gets rejected

| Invalid | Why | Fix |
|---------|-----|-----|
| `Fixed bug in panel` | Missing type | `fix(panel): resolve crash on empty repo` |
| `feat: Added new button.` | Wrong case + trailing period | `feat(panel): add refresh button` |
| `feature(rebase): stuff` | Unknown type | Use `feat`, not `feature` |
| `WIP` | No type or subject | Split into proper commits before pushing |
| `feat(webview)` | Empty subject | Add a short imperative summary |

Merge commits (`Merge pull request #…`) and reverts generated by Git are handled
automatically and do not need to follow this format.

---

## Enforcement

### Local (before commit is created)

Husky runs **commitlint** on every `git commit`. If the message is invalid, the
commit is aborted and commitlint prints what to fix.

```bash
pnpm install   # installs Husky hooks via the "prepare" script
git commit -m "feat(panel): add column resize handle"
```

### Pull requests (CI)

The **Commit messages** job in GitHub Actions validates **every commit** in a PR
against this convention. The check must pass before the PR can merge.

### Manual check

Validate the last commit or a range:

```bash
# Last commit
pnpm exec commitlint --last --verbose

# All commits on your branch since main
pnpm exec commitlint --from origin/main --to HEAD --verbose
```

---

## Tips

1. **One logical change per commit** — easier to review, revert, and bisect.
2. **Write the subject as a command** — “add”, “fix”, “remove”, “update”.
3. **Use the body for context** — explain motivation, trade-offs, or follow-ups.
4. **Reference issues in the footer** — `Fixes #123`, `Closes #456`, `Refs #789`.
5. **Squash fixup commits** before opening a PR if your branch has WIP history.

---

## Configuration

Rules live in [`commitlint.config.js`](../commitlint.config.js) at the repository root.
To propose changes to this convention, open a PR that updates both the config and this
document.
