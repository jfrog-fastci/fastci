---
name: fastci-document-pr
description: Generate a richly formatted PR for FastCI CI acceleration changes. Builds the PR body with key-change rationale, insight checklists, and raw reports from baseline and post-change YAML reports. Use when opening or updating a FastCI acceleration PR.
---

# FastCI — Document & Open PR

Generate a pull request with a concise, visual PR body that documents CI acceleration changes and measured improvements.

## Inputs

This skill expects the following data to already exist before it is invoked:

| Input | Source | Description |
|-------|--------|-------------|
| Baseline report | `/tmp/fastci-report.yaml` | YAML report from the **base branch** (before changes) |
| Post-change report | `/tmp/fastci-report-after.yaml` | YAML report from the **working branch** (after changes) |
| Applied insights | Git log on the current branch | Each remediation is a separate commit (`ci: apply fastci insight - <TITLE>`) |
| Skipped/reverted insights | Agent context | Any insights that were attempted but reverted or skipped |

If any input is missing, ask the user to provide it or run the relevant upstream phase first.

## PR Creation

Open a pull request using `gh pr create`. The PR body must include the following sections **in order**.

### Summary

Open with a single impact paragraph. Use the workflow name, measured durations, and projected savings from the reports. Format the new duration in bold. Example:

```markdown
This PR applied fixes to **10 out of 11** detected missing best practices in `ci.yml`.

Average workflow duration: ~2 min 6s → <b>~20s</b>

Based on the current run frequency of `ci.yml`, this will save your team approximately:

| | |
|---|---|
| **Per week** | ~18 min |
| **Per month** | ~70 min |
| **Per year** | ~14 hours |

<details>
<summary><b>Insight status (10/11 resolved)</b></summary>

#### Resolved

- [x] .dockerignore present *(already healthy)*
- [x] Unpinned base image version
- [x] apt update/install separate RUNs + missing cleanup
- [x] apt-get install without --no-install-recommends
- [x] Remove apt-get upgrade
- [x] Inefficient layer ordering (COPY before uncached RUN)
- [x] Go dependency download not separated from build
- [x] ARG before dependency install invalidates cache
- [x] Using npm install instead of npm ci
- [x] Single-stage build with build tools detected
- [x] No remote cache configured

#### Skipped

- ~~Consider using --push flag~~ — no registry configured

</details>
```

Substitute the actual numbers from the baseline and post-change reports. Use `stats.runs` count to project the weekly/monthly/yearly savings.

The `<details>` summary should show the resolved count (e.g., "10/11 resolved"). Inside, present insights as two groups:
- **Resolved** items use checked GitHub task-list syntax. Mark items that were already implemented before this PR with an *(already healthy)* suffix.
- **Skipped** items use a plain bullet with strikethrough text on the insight name, followed by an em-dash and the reason.

### Key Changes

For each remediation that was applied, wrap the explanation in an HTML `<details>` / `<summary>` block so the PR body stays scannable. The summary line uses the insight title as a bold heading; the collapsible body provides a 2-3 sentence rationale focused on the compounding long-term benefit.

Example structure (substitute the actual insights applied):

```markdown
<details>
<summary><b>Pinned base image version (<code>golang:1.25-bookworm</code>)</b></summary>

Replaces a floating `:latest` or minor-version tag with an exact release. This eliminates surprise rebuilds when the upstream image publishes a new digest, keeping the base-image layer cached indefinitely until you explicitly bump the version.
</details>

<details>
<summary><b>Consolidated and optimized <code>apt-get</code> commands</b></summary>

Merges multiple `RUN apt-get` invocations into a single layer and adds `--no-install-recommends` + cleanup. Fewer layers means a smaller image and faster pulls; the single-layer pattern also ensures the package cache is cleaned in the same layer it was created, preventing layer bloat from compounding over time.
</details>

<details>
<summary><b>Dependency-first layer ordering (<code>go mod download</code>, <code>npm ci</code>)</b></summary>

Copies only dependency manifests (go.sum, package-lock.json) before source code, then runs the install step in its own layer. Because dependencies change far less frequently than application code, this layer stays cached across the vast majority of commits — turning a multi-minute download into a no-op on most builds.
</details>

<details>
<summary><b>Multi-stage build (<code>frontend-builder</code> → <code>backend-builder</code> → <code>runtime</code>)</b></summary>

Splits the build into isolated stages so compilers, dev-dependencies, and intermediate artifacts never reach the final image. The runtime stage copies only the compiled binary and static assets, producing a minimal image that is faster to push, pull, and deploy. Over time this also reduces the CVE surface since build tools are excluded.
</details>

<details>
<summary><b>GHA remote cache (<code>--cache-from type=gha --cache-to type=gha,mode=max</code>)</b></summary>

Enables GitHub Actions' native cache backend for Docker BuildKit. With `mode=max`, every intermediate layer is cached — not just the final image. Subsequent CI runs on any branch can reuse these layers, so the cache benefit compounds across the entire team, not just sequential runs on the same branch.
</details>
```

Only include the insights that were actually applied. If an insight was skipped or reverted, omit it here (it is already tracked in the Insight Status section).

### What Needs Manual Review

Generate a checklist of things the reviewer should verify before merging, based on the changes made.

For example if the agent applied a change to the Dockerfile, the checklist should include:

- [ ] Multi-stage build changes don't omit runtime dependencies
- [ ] Pinned image versions are appropriate and maintained
- [ ] Cache configuration (registry, GHA, etc.) aligns with team policy
- [ ] `.dockerignore` additions don't exclude needed files

Another example if the agent applied a change to the dependencies installation process:
- [ ] Lockfile changes (if any) are intentional

Think about what can go wrong with the changes made and list those risks in the checklist.

### Raw Reports & Data Sources

Include data sources and raw reports in a single collapsible section. First list the trace artifacts and GitHub Actions runs used, then embed the full YAML reports.

```markdown
<details>
<summary><b>Data sources & raw reports</b></summary>

**Traces:** fastci-trace-* artifacts from runs #A, #B, … #N on `main`; runs #X, #Y on the working branch.

**Baseline report** (`/tmp/fastci-report.yaml`):
\`\`\`yaml
<contents of /tmp/fastci-report.yaml>
\`\`\`

**Post-change report** (`/tmp/fastci-report-after.yaml`):
\`\`\`yaml
<contents of /tmp/fastci-report-after.yaml>
\`\`\`
</details>
```

Read `/tmp/fastci-report.yaml` and `/tmp/fastci-report-after.yaml` and paste their full contents into the code blocks above. If either file is missing, omit that block and note its absence.

## Final Step

After creating the PR, always print the PR URL so the user can access it directly.
