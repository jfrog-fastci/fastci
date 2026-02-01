# FastCI

A GitHub Actions optimization tool that speeds up your CI/CD workflows.

## Overview

FastCI analyzes your GitHub Actions workflows to optimize execution time and improve efficiency. It integrates seamlessly with your existing CI/CD pipeline.

## Installation

Add the FastCI step to your GitHub Actions workflow file:

```yaml
jobs:
  build-my-app:
    permissions:
      contents: read
      actions: read  # Required for FastCI to function properly
      
    runs-on: ubuntu-latest  
    steps:
      - name: Checkout Repository  
        uses: actions/checkout@v6

      # Add FastCI step after checkout in each job
      - name: Start FastCI Optimization
        uses: jfrog-fastci/fastci@v0
        with:
          github_token: ${{secrets.GITHUB_TOKEN}}
          fastci_otel_token: ${{ secrets.FASTCI_TOKEN }}  # Will be provided to you (Optional)
          accept_terms: 'true'

      # ... rest of your workflow steps
```

## Requirements

- **Permissions**: Ensure the `actions:read` permission is added to each job using FastCI
- **Token Setup**: Configure the `FASTCI_TOKEN` in your repository or organization GitHub secrets

## Debugging

To enable detailed debug logs for FastCI, set one of the following:

- Repository secret: `ACTIONS_STEP_DEBUG: true`
- Repository variable: `ACTIONS_STEP_DEBUG: true`

This will make all `core.debug` logs visible in your workflow runs.

## Support

If you encounter any issues, please reach out to the FastCI team or file an issue in this repository.
