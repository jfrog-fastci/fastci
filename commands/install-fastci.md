---
name: install-fastci
description: Install FastCI into all GitHub Actions workflows in the current repository.
---

# Install FastCI

Add FastCI CI monitoring to every GitHub Actions workflow in this repository.

## Instructions

Before moving on ask the user if they agree to the terms of service.
Link in github to the terms of service.  [Terms of Service](https://github.com/jfrog-fastci/fastci/blob/main/BETA_AGREEMENT.md)

Follow these steps in order:

### 1. Create the configuration file

Create `fastci.config.json` in the repository root with:

```json
{
  "accept_terms": "yes"
}
```

If the file already exists, leave it as-is.

### 2. Scan workflows

Read all `.yml` and `.yaml` files in `.github/workflows/`.

For each workflow file, apply steps 3 and 4.

### 3. Ensure permissions

Check whether the workflow has `issues: write` at the **workflow level** (top-level `permissions` block).

- If `permissions` is missing entirely, add a top-level `permissions` block with `issues: write`.
- If `permissions` exists but does not include `issues`, add `issues: write` to it.
- If `issues` is already set to `write`, do nothing.
- If `issues` is set to something other than `write` (e.g. `read` or `none`), **ask the user** before changing it: "Workflow [filename] has `issues: [current value]`. Change to `write` for FastCI?"

### 4. Add FastCI step to each job

For every job in the workflow:

1. Check if the job already has a step using `jfrog-fastci/fastci`. If so, skip it.
2. Add `- uses: jfrog-fastci/fastci@v0` as the **very first step** in the job — before `actions/checkout` and any other steps.
3. If the job has a `container:` block, check whether it already includes the volume `/home/runner:/tmp/fastci/mounts/home/runner`. If not, add it under `container.volumes`.

### 5. Summary

After modifying all workflows, print a summary listing:
- Which workflow files were modified
- Which workflow files were skipped (already had FastCI)
- Any permissions the user was asked about
