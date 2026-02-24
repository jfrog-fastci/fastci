---
name: website-persona-content-review
description: Reviews and improves website copy using three buyer personas (10x developer, DevOps portfolio owner, VP R&D). Use when the user asks to audit, rewrite, or optimize website marketing content by persona, messaging, pains, or value propositions.
---

# Website Persona Content Review

Use this skill to review and improve content under `website/src/` through three specific perspectives:
- Max (10x developer with no time for CI maintenance)
- Priya (DevOps/platform owner across many pipelines)
- Dana (VP R&D / engineering group manager)

## Required context

1. Read [personas.md](personas.md).
2. Review the relevant copy files under `website/src/` (home page sections, CTA, blog posts, and related markdown/astro/tsx content files).
3. Ignore generated output like `website/dist/` and dependency folders.

## Subagent orchestration workflow

Run three subagents in parallel, one per persona, then synthesize.

### Subagent A: Max reviewer
Use `subagent_type="generalPurpose"` with this task:

```text
Review website copy for Persona: Max (10x feature sprinter). Focus on flow disruption, CI wait-time frustration, and low-maintenance expectations. Return:
1) Top 5 messaging gaps ranked by impact
2) Rewrites for hero/feature/CTA copy where needed
3) One short customer-story paragraph in Max's voice
4) Claims that sound vague or unproven, with stronger alternatives
Keep language concise, practical, and outcome-first.
```

### Subagent B: Priya reviewer
Use `subagent_type="generalPurpose"` with this task:

```text
Review website copy for Persona: Priya (DevOps/platform owner managing many CI/CD pipelines). Focus on scale, governance, safety, and operational workload. Return:
1) Top 5 messaging gaps ranked by impact
2) Rewrites that emphasize fleet-level visibility, safe automation, and prioritization
3) Missing trust/governance language and how to add it
4) Any wording that implies risky automation without guardrails
Keep language concrete, credible, and operations-aware.
```

### Subagent C: Dana reviewer
Use `subagent_type="generalPurpose"` with this task:

```text
Review website copy for Persona: Dana (VP R&D / group engineering manager). Focus on productivity outcomes, predictability, delivery risk, and ROI. Return:
1) Top 5 messaging gaps ranked by impact
2) Rewrites that connect CI speed to business outcomes
3) Suggested KPI-oriented phrasing (lead time, throughput, deployment frequency)
4) Content likely to be too tactical for executive readers
Keep language strategic, measurable, and low-jargon.
```

## Synthesis step

After all three subagents return:

1. Merge overlapping findings into a single prioritized backlog:
   - Critical: blocks trust or relevance for a persona
   - Important: weakens conversion clarity
   - Nice-to-have: style and polish
2. Resolve conflicts by audience placement:
   - Home hero/CTA: cross-persona clarity
   - Feature sections: Max + Priya depth
   - Blog long-form: persona-targeted depth by article intent
3. Produce concrete edits in source files (not only recommendations).

## Editing rules

- Prefer precise, measurable claims over generic superlatives.
- Keep tone professional and confident; avoid caricatures.
- Tie capability -> operational impact -> business impact.
- Preserve technical correctness.
- If data is not available, avoid fabricated numbers.

## Output format to user

Return:

1. What was changed (files and rationale by persona)
2. Key messaging improvements by persona
3. Remaining open questions or evidence gaps
4. Optional next step: run another pass focused on one persona only
