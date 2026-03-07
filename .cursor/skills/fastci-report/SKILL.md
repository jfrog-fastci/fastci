---
name: fastci-report
description: Generate a CI performance report from FastCI OTEL traces. Produces a structured YAML that mirrors the workflow definition enriched with per-job/step stats (p50/p90/p95), docker layer phases, and best-practice insights. Use when the user wants to generate a CI report, show build times, visualize the critical path, or review workflow performance.
---

# FastCI Performance Report

Generate a structured performance report for a GitHub Actions workflow. Fetches FastCI OTEL trace artifacts, ingests them into an in-memory SQLite database, and produces a YAML report that mirrors the workflow definition enriched with stats and insights at every level.

## Prerequisites

- `gh` CLI installed and authenticated (`gh auth status`)
- `bun` runtime installed (no `bun install` needed — the script has zero npm dependencies)
- Repository uses GitHub Actions with FastCI (`jfrog-fastci/fastci`) producing `fastci-trace-*` artifacts
- `GITHUB_TOKEN` env var set (falls back to `gh auth token` if unset)

## Usage

```bash
bun run .cursor/skills/fastci-report/scripts/generate-report.ts \
  --branch <BRANCH> \
  --limit <LIMIT> \
  --output /tmp/fastci-report
```

| Arg | Default | Description |
|-----|---------|-------------|
| `--branch` | `main` | Branch to analyze |
| `--limit` | `10` | Number of recent runs to fetch |
| `--workflow` | auto-detect | Workflow file name (e.g. `ci.yml`) |
| `--output` | `/tmp/fastci-report` | Output prefix (writes `.yaml`) |
| `--local` | -- | Path to local traces directory (skips GitHub fetch; useful for testing) |

## Output

A single **`<output>.yaml`** that mirrors the structure of the workflow definition, enriched with performance stats and best-practice insights at every level:

- **Workflow level** — `stats:` block with `runs`, `avg_duration_sec`, `p50/p90/p95_duration_sec`, `success_rate`
- **Job level** — same stat fields per job
- **Step level** — `uses:` or `run:` from the workflow YAML, `stats:` with avg/percentile durations, and a `best_practices:` block showing implemented (✔︎) vs missing (✖︎) insights
- **Docker build steps** — additional `docker:` block with `layers:` (total, cached_ratio, avg_rebuilt_layers)

The script prints the YAML to stdout and also writes it to `<output>.yaml`. Present the stdout output to the user inline, and always include the path to the saved file at the end of your message so the user can open or reference it later:

> Full report saved to `/tmp/fastci-report.yaml`
