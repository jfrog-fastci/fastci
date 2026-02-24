# Website Content Personas

Use these personas to evaluate and improve `website/src/` content. Keep reviews product-aware but grounded in each persona's broader goals, pressures, and decision criteria.

## Persona 1: Max, the 10x Feature Sprinter

### Profile
- Senior IC shipping a high volume of tickets.
- Optimizes for uninterrupted flow and fast PR cycles.
- Will not volunteer for CI maintenance work unless the ROI is immediate.

### Core pains
- CI wait time breaks coding momentum and causes context switching.
- Pipeline regressions appear gradually and are hard to diagnose quickly.
- Team backlog pressure pushes CI upkeep behind feature and bug work.
- Slow feedback loops delay PR handoff and increase merge pain.

### What Max cares about
- Fast, predictable feedback after each push.
- Very low setup and near-zero ongoing maintenance overhead.
- High-confidence CI signals (fewer flaky failures and re-runs).
- Concrete "time returned to me today" outcomes.

### Messaging angles that resonate
- "Stay in flow" and "ship more in the same day."
- "No extra ownership tax for your team."
- "Automatic fixes over manual CI archaeology."
- "Minutes saved per PR, multiplied across the week."

### Narrative baseline (improved from user example)
Max is a high-output engineer focused on closing tickets and unblocking reviewers quickly. On every feature branch push, he waits for both AI review and CI before requesting teammate review. The pipeline now takes around 15 minutes end-to-end, and no one on the team has bandwidth to tune it because urgent bugs and feature work keep winning prioritization. The result is fragmented focus: instead of finishing a change set in one pass, Max repeatedly context-switches while waiting for CI to catch up.

## Persona 2: Priya, the Platform/DevOps Portfolio Owner

### Profile
- Owns reliability and performance for many CI/CD pipelines across teams.
- Measured on stability, velocity, governance, and operational efficiency.
- Has limited bandwidth per repo and cannot do deep manual tuning everywhere.

### Core pains
- Too many workflows and repos to inspect in detail.
- High operational toil from recurring, low-level CI regressions.
- Difficulty enforcing consistent best practices across heterogeneous stacks.
- Pressure to improve speed without compromising reliability or security.

### What Priya cares about
- Fleet-level visibility into bottlenecks and regressions.
- Safe, auditable automation with human-review checkpoints.
- Policy consistency (cache strategy, runner usage, workflow hygiene).
- Clear prioritization: biggest impact opportunities first.

### Messaging angles that resonate
- "Scale pipeline optimization without adding headcount."
- "Standardize improvements while preserving team autonomy."
- "Reviewable PRs, not black-box changes."
- "Reliability first, optimization second."

## Persona 3: Dana, VP R&D / Engineering Group Manager

### Profile
- Responsible for delivery velocity, engineering productivity, and team health.
- Balances roadmap commitments, quality targets, and budget constraints.
- Cares about outcomes across the org more than tooling internals.

### Core pains
- Slow CI increases cycle time and reduces release cadence.
- Engineering hours are lost to waiting instead of building.
- Delivery predictability suffers when feedback loops are inconsistent.
- Developer frustration from tooling friction hurts retention and morale.

### What Dana cares about
- Measurable productivity gains and improved throughput.
- Predictable delivery and faster time-to-value.
- Risk-managed automation with governance and traceability.
- Cost-efficiency at the org level.

### Messaging angles that resonate
- "Increase developer output without increasing team size."
- "Improve lead time and deployment frequency."
- "Protect focus time for product work."
- "Create a compounding productivity advantage."

## Shared review constraints
- Avoid persona caricatures or hype-heavy language.
- Keep claims evidence-oriented and specific.
- Prefer outcomes, trade-offs, and decision confidence over features lists.
- Ensure each page has clear relevance for at least one persona, and no page alienates the others.
