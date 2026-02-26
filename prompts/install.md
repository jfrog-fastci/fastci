# FastCI Installation Instructions

Install FastCI in GitHub Actions workflows. FastCI must be the **first step** in each job.

## Requirements

- Add `issues: write` permission at the workflow level
- For container jobs: add volume mount `/home/runner:/tmp/fastci/mounts/home/runner`

## Basic Setup

```yaml
- uses: jfrog-fastci/fastci@v0
```

## Complete Example

```yaml
permissions:
  contents: read
  issues: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: jfrog-fastci/fastci@v0
      - uses: actions/checkout@v4
      # ... rest of your build steps
```

## Container Jobs

For jobs using a container, add the volume mount:

```yaml
container:
  image: <your-image>
  volumes:
    - /home/runner:/tmp/fastci/mounts/home/runner
```

## AI Agent Instructions

When installing FastCI via AI:

1. Scan all workflow files in `.github/workflows/` for FastCI usage
2. For each workflow using `jfrog-fastci/fastci@v0`:
   - Ensure `issues: write` permission exists at workflow level (add if missing)
   - If set to `false`, prompt user to change to `write`
3. Add FastCI as the first step in each job with the basic setup above
4. For container jobs, add the volume mount as shown
