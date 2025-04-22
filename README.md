# FastCI OpenTelemetry GitHub Actions Tracing

A toolkit for tracing GitHub Actions workflows to OpenTelemetry.

## Features

- Trace GitHub Actions workflow runs with detailed span information
- Capture job and step execution details
- Associate process execution data with workflow spans
- Export traces to OpenTelemetry collectors
- Support for PR and commit metadata

## Debug your action
Enabling debug logs:
To make core.debug logs visible, you need to enable debug logging by setting one of these:
Repository secret: `ACTIONS_STEP_DEBUG: true`
Repository variable: `ACTIONS_STEP_DEBUG: true`
When re-running a workflow: Enable the "Enable debug logging" option

## Development

### Prerequisites

- Node.js 14 or higher
- npm or yarn

### Setup

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

### Running Tests

The project uses Jest for testing. To run the tests:

```bash
npm test
```

To run tests with coverage:

```bash
npm test -- --coverage
```

To run a specific test file:

```bash
npm test -- src/otel-cicd-action/runner.test.ts
```

### Components

The project consists of the following main components:

- `runner.ts`: Main entry point for the GitHub Action
- `trace/`: Contains the tracing logic for workflows, jobs, and steps
- `github/`: GitHub API interaction functions
- `tracer/`: OpenTelemetry configuration

## Tests Overview

The test suite includes tests for:

- `runner.ts`: Tests for the main runner functionality and process tree loading
- `workflow.test.ts`: Tests for workflow tracing functionality
- `job.test.ts`: Tests for job tracing and process filtering
- `step.test.ts`: Tests for step tracing

### Mock Dependencies

Tests use Jest mocks to simulate:
- GitHub API responses
- OpenTelemetry tracing functions
- Process tree data
- Filesystem operations 