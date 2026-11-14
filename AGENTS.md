# Dr Plant — instructions for AI coding agents

This file is the shared source of truth for Codex, Gemini, Claude, Manus, Copilot, and other assistants working in this public repository. Read it before changing code or evidence records.

## Project purpose and current truth

Dr Plant is an Arabic-first plant-health project focused first on grapevine and coastal Syrian crops. The current camera workflow performs **coarse visual screening only** using image-quality gates and approximate color statistics. It is not a trained plant-disease classifier, does not identify a pathogen with certainty, and must not recommend pesticide products or doses.

Never claim diagnostic accuracy, model training, image-based learning, or improved diagnosis unless the repository contains reproducible training and independent evaluation evidence supporting that exact claim.

## Safe collaboration rules

1. Work on `feature/coastal-leaf-diagnosis-v2` unless the maintainer explicitly selects another branch.
2. Do not merge into `main`, publish a release, change repository visibility, add collaborators, or expose secrets.
3. Keep changes small, reviewable, and documented. Explain changed files, tests run, and remaining limitations in the pull request.
4. Never add API keys, tokens, private user data, patient/farm identifying data, or credentials.
5. Do not remove safety warnings or convert preliminary symptom triage into a confirmed diagnosis.
6. Do not add pesticide recommendations, rates, pre-harvest intervals, or re-entry intervals unless each is verified against a current official local label for the crop and jurisdiction.
7. If a source is inaccessible, say so. Do not invent a source, image, field location, date, expert, or verification result.

## Evidence registry: `data/knowledge-base.json`

The registry is a curated evidence index, not a training dataset. Preserve the distinction between:

- `reference_only`: scientific/extension reference; not local confirmation.
- `suspected`: a plausible but unverified finding.
- `reported`: a report from a grower/community; not independently confirmed.
- `expert_confirmed`: reviewed by a qualified plant-health expert with the reviewer role, review date, and verification method recorded.

For each disease record, retain a stable unique `id`, crop, common names, scientific name, evidence status, explanatory notes, and source URLs. Prefer primary scientific papers, universities, government extension services, and recognized plant-health institutions.

For each image or dataset:
- Record the original source, creator/provider, date and region when known, license, attribution requirements, and the exact permitted reuse.
- Treat a dataset's landing-page license as a lead until the actual package and per-image terms are checked.
- If reuse rights are unclear, record only the source URL and metadata; do not copy or redistribute the image.
- Do not treat social-media captions, comments, or group posts as expert diagnoses. Public posts are leads only; never claim access to private groups.
- Avoid duplicate images and record provenance so future reviewers can trace each item.

Do not promote a record to `expert_confirmed` merely because several websites repeat the same claim. Record uncertainty explicitly.

## Required checks

Before proposing or committing a change, inspect the existing implementation and avoid duplicate records. Run:

```sh
bun run validate:knowledge
bun run lint
bun run test
bun run build
```

If a command cannot be run in the available environment, state that clearly; do not imply it passed. GitHub Actions is the authoritative remote check after a push.

## Pull request expectations

Use a focused PR against `main` and keep it open for human review. Include:
- what changed and why;
- sources and evidence status for new research records;
- image licensing/provenance decisions;
- commands actually run and their results;
- what remains unverified.

The public repository may be inspected by external AI assistants, but repository access does not grant access to private accounts, private datasets, or private social-media groups.
