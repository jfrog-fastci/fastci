# Tracer Action

A GitHub Action for FastCI Tracer that collects and sends OpenTelemetry traces.

## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `jfrog_user_writer` | JFrog User Writer | Yes | - |
| `jfrog_password_writer` | JFrog Password Writer | Yes | - |
| `fastci_otel_endpoint` | OpenTelemetry Endpoint that will receive the traces | Yes | - |
| `fastci_otel_token` | OpenTelemetry token | Yes | - |
| `tracer_version` | Version of the tracer binary to use | No | latest |

## Usage

```yaml
name: FastCI Tracer Workflow

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  trace:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Run FastCI Tracer
        uses: fastci-dev/tracer-action@v1
        with:
          jfrog_user_writer: ${{ secrets.JFROG_USER_WRITER }}
          jfrog_password_writer: ${{ secrets.JFROG_PASSWORD_WRITER }}
          fastci_otel_endpoint: ${{ secrets.FASTCI_OTEL_ENDPOINT }}
          fastci_otel_token: ${{ secrets.FASTCI_OTEL_TOKEN }}
          # Optional: specify a different version
          # tracer_version: v1.0.0
```

## Development

### Prerequisites

- Node.js 20.x or later
- npm 9.x or later

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Build

```bash
npm run build
```

### Package for distribution

```bash
npm run package
``` 