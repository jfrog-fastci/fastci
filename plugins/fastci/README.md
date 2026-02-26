# FastCI Cursor Plugin

This folder is a Cursor plugin package. It’s meant to be consumed by Cursor via the plugin/marketplace format.

## Included (for now)

- `commands/install-fastci.md`: installation instructions + an agent checklist for adding FastCI to GitHub Actions
- `rules/fastci-installation.mdc`: rule guidance scoped to `.github/workflows/*.{yml,yaml}`

## Development notes

- Plugin manifest: `.cursor-plugin/plugin.json`
- Multi-plugin manifest (repo root): `.cursor-plugin/marketplace.json`

