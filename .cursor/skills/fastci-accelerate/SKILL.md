---
name: fastci-accelerate
description: Analyze FastCI OTEL traces from GitHub Actions CI runs to identify and auto-apply CI acceleration opportunities. Use when the user wants to speed up CI, optimize Docker builds, analyze FastCI traces, reduce build times, or apply FastCI insights.
---

# FastCI CI Acceleration

Fetch OTEL traces, generate a performance report, and auto-apply remediations to speed up GitHub Actions workflows.

## Prerequisites

- `gh` CLI installed and authenticated (`gh auth status`)
- `bun` runtime installed (no `bun install` needed — scripts have zero npm dependencies)
- Repository uses GitHub Actions with FastCI (`jfrog-fastci/fastci`) producing `fastci-trace-*` artifacts

## Phase 1: Generate Baseline Report

Use the shared report generator to fetch traces and produce a structured YAML report:

```bash
bun run .cursor/skills/fastci-report/scripts/generate-report.ts \
  --branch <BRANCH> \
  --limit <LIMIT> \
  --output /tmp/fastci-report
```

| Arg | Default | Description |
|-----|---------|-------------|
| `--branch` | `main` | Branch to analyze (use target/base branch) |
| `--limit` | `10` | Number of recent runs to fetch |
| `--workflow` | auto-detect | Workflow file name (e.g. `ci.yml`) |
| `--output` | `/tmp/fastci-report` | Output prefix (writes `.yaml`) |
| `--local` | -- | Path to local traces directory (skips fetch) |

Read the generated `/tmp/fastci-report.yaml`. This is the **baseline report** — save these numbers for later comparison.

If the script fails due to expired artifacts (GitHub retains artifacts for 90 days by default), report this to the user and work with whatever traces are available.

## Phase 2: Build Improvement Plan

Parse the YAML report and build an improvement plan from the `best_practices:` blocks attached to each step.

**Section A — Summary Table:**
Markdown table of all insights found in `best_practices.missing` entries across all jobs/steps. Include: rank, insight title, affected job, affected step, average step duration (from `stats.duration_sec.avg`), and estimated impact (high/medium/low based on step duration weight relative to total workflow duration).

Also list `best_practices.implemented` counts so reviewers see what is already healthy.

**Section B — Remediation Details:**
For each missing insight (priority order — highest step duration first):
1. Title and affected file/step
2. Brief explanation of what the insight means
3. Concrete remediation steps (refer to the insight title and the workflow/Dockerfile in the repo to determine the fix)

Ask the user to confirm before proceeding to auto-apply.

## Phase 3: Auto-Apply Remediations

### Branch Setup

Create a working branch following the repository naming convention:

```bash
git checkout -b fastci/accelerate-ci
```

If the branch already exists, create a fresh one with a date suffix:

```bash
git checkout -b fastci/accelerate-ci-$(date +%Y%m%d)
```

### Apply Each Insight

For each unimplemented insight, in priority order (highest estimated impact first):

1. **Apply the fix** — modify the Dockerfile, workflow YAML, or other relevant files according to the remediation plan from Phase 2.

2. **Commit the change:**
   ```bash
   git add -A && git commit -m "ci: apply fastci insight - <INSIGHT_TITLE>"
   ```

3. Each remediation is a **separate commit** so individual changes can be reverted if needed.

### Push and Trigger First CI Run (Warm-Up)

After all commits are applied:

```bash
git push -u origin HEAD
```

Wait for CI to complete using the ci-watcher subagent or:

```bash
gh run watch --branch $(git branch --show-current)
```

**Evaluate the first run:**
- **CI passes:** Record the total workflow duration as `warm_up_duration`. This run may be slower due to cold caches — this is expected.
- **CI fails:** Identify the failing step. Revert the offending commit(s), push, and re-run CI until it passes. Log which insights were skipped and why.

### Trigger Second CI Run (Validation)

Push a no-op commit or re-run the workflow to trigger a second run with warm caches:

```bash
gh workflow run ci.yml --ref $(git branch --show-current)
```

Or if re-run is preferred:

```bash
gh run rerun <RUN_ID>
```

Wait for the second run to complete.

**Evaluate the second run:**
- Record the total workflow duration as `cached_duration`.
- **Assert: `cached_duration` < `warm_up_duration`.** If the second run is not faster, investigate — the caching or optimization may not be effective. Report findings to the user.

### Generate Post-Change Report

Run the report generator again on the new branch to get post-change metrics:

```bash
bun run .cursor/skills/fastci-report/scripts/generate-report.ts \
  --branch $(git branch --show-current) \
  --limit 2 \
  --output /tmp/fastci-report-after
```

Read `/tmp/fastci-report-after.yaml` and compare against the baseline.

## Phase 4: Open PR with Documentation

Delegate PR creation to the **`fastci-document-pr`** skill. This skill handles the full PR body generation including summary, key changes with long-term rationale, metrics tables with colored deltas, insight status, Mermaid Gantt and bar charts, ROI analysis, and a reviewer checklist.

Before invoking, ensure the required inputs are in place:
- Baseline report at `/tmp/fastci-report.yaml`
- Post-change report at `/tmp/fastci-report-after.yaml`
- All remediations committed on the current branch

The skill is located at `.cursor/skills/fastci-document-pr/SKILL.md`.

## Important Notes

- Never push directly to `main`. All changes go to a `fastci/accelerate-ci-[YYYYMMDD]` branch.
- Each remediation is a separate commit so individual changes can be reverted if needed.
- The estimated savings are approximations based on historical build vertex durations. Actual savings may vary depending on caching behavior and CI runner performance.
- If an insight's remediation references files that don't exist in the repo, skip it.
- The YAML report contains structured data for workflow/job/step stats, docker layer details, and best-practice insights.
- Always run CI at least twice: the first run warms caches, the second run validates that optimizations actually reduce duration.
- Always finish with the link to the PR to make it more accessible to the user.
