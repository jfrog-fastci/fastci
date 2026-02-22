---
title: "GitHub Actions Performance Guide"
description: "A curated collection of best practices for GitHub Actions: caching strategies, matrix optimization, runner selection, and more."
tag: "Performance"
readTime: "8 min read"
publishDate: 2026-02-15
gradient: "from-cyan-500/20 to-brand-500/20"
---

GitHub Actions is powerful, flexible, and — if you're not careful — surprisingly slow. This guide covers the most impactful optimizations you can apply to your workflows today.

## 1. Caching Done Right

Caching is the single biggest lever for CI performance. But many teams either don't cache, or cache incorrectly.

### Use `actions/cache` strategically

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

**Key principles:**

- Cache both the package manager cache *and* `node_modules` — restoring `node_modules` directly skips the install step entirely when the lockfile hasn't changed.
- Use `restore-keys` for partial cache hits. A slightly stale cache is almost always better than no cache.
- For monorepos, include the workspace path in the key to avoid cross-project cache pollution.

### Docker layer caching

If you build Docker images in CI, layer caching can save minutes per build:

```yaml
- uses: docker/build-push-action@v6
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

The `mode=max` flag caches all layers, not just the final image layers. This is critical for multi-stage builds where intermediate layers change less frequently.

## 2. Parallelism and Matrix Strategies

### Split your test suite

Instead of running all tests sequentially in one job, split them across parallel runners:

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: npm test -- --shard=${{ matrix.shard }}/4
```

Most test frameworks (Jest, pytest, Go test) support sharding. A 20-minute test suite split across 4 shards finishes in ~5 minutes.

### Right-size your matrix

Matrix strategies are powerful but can be wasteful. Ask yourself:

- Do you really need to test on every OS? If your app only deploys to Linux, drop macOS and Windows.
- Do you need every Node/Python version? Test the minimum and maximum supported versions, skip the middle.
- Can you run linting and type-checking in a separate, fast job instead of in every matrix cell?

## 3. Runner Selection

### GitHub-hosted runners

The default `ubuntu-latest` runner has 4 vCPUs and 16 GB RAM. For most jobs, this is fine. But for heavy builds:

- **`ubuntu-latest-xl` (or larger runners)**: 8+ vCPUs for CPU-bound builds like Rust, C++, or large TypeScript projects.
- **ARM runners**: If your deploy target is ARM (e.g., AWS Graviton), build on ARM runners to avoid emulation overhead.

### Self-hosted runners

For high-volume repos, self-hosted runners can dramatically reduce costs and improve performance:

- Pre-install tools and dependencies to skip setup steps
- Use persistent caches on fast local storage
- Choose machine specs that match your workload

## 4. Workflow Structure

### Use `needs` for dependency graphs

Don't run everything in parallel if some jobs depend on others. Structure your workflow as a DAG:

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [...]
  
  test:
    needs: lint
    runs-on: ubuntu-latest
    steps: [...]
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps: [...]
```

This prevents wasting runner time on builds that will fail at the lint stage.

### Avoid redundant checkouts and setups

If multiple steps in a job need the same tool, install it once. Use composite actions or reusable workflows to DRY up repeated setup logic across jobs.

### Cancel in-progress runs

When a new commit is pushed to the same branch, cancel the previous run:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

This prevents wasting resources on stale commits, especially during active development.

## 5. Reducing Install Time

### Pin action versions

Use exact commit SHAs instead of tags to avoid re-resolving versions:

```yaml
# Slower: resolves tag on every run
- uses: actions/checkout@v4

# Faster: exact version, cached by runner
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
```

### Skip unnecessary steps

Use `if` conditionals to skip steps that aren't needed:

```yaml
- name: Deploy
  if: github.ref == 'refs/heads/main'
  run: ./deploy.sh
```

### Use setup actions with caching built in

Many setup actions have built-in caching:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: 'npm'
```

This is often simpler and more efficient than managing `actions/cache` separately.

## 6. Monitoring and Measurement

You can't improve what you don't measure. Track:

- **Workflow duration** (p50, p95) over time
- **Queue time** — how long jobs wait before a runner picks them up
- **Cache hit rates** — are your caches actually being used?
- **Billable minutes** — are you staying within budget?

GitHub provides some of this in the Actions tab, but for deeper analysis, consider tools like FastCI that provide automated insights and optimization suggestions.

## Conclusion

Fast CI isn't a one-time project — it's an ongoing practice. Start with the biggest wins (caching, parallelism, concurrency), then iterate. The goal isn't perfection; it's continuous improvement.

Every minute you save on CI pays dividends across your entire team, every single day.
