# Dr Plant — instructions for AI coding agents

This file is the shared source of truth for Codex, Gemini, Claude, Manus, Copilot, and other assistants working in this public repository. Read it before changing code or evidence records.

## Project purpose and current truth

Dr Plant is an Arabic-first plant-health project focused first on grapevine and coastal Syrian crops. The current camera workflow performs **coarse visual screening only** using image-quality gates and approximate color statistics. It is not a trained plant-disease classifier, does not identify a pathogen with certainty, and must not recommend pesticide products or doses.

Never claim diagnostic accuracy, model training, image-based learning, or improved diagnosis unless the repository contains reproducible training and independent evaluation evidence supporting that exact claim.

## Safe collaboration rules

1. Make development changes on a focused, short-lived branch based on the latest `main`.
2. The maintainer has explicitly authorized automatic merging of completed development PRs into `main`: once all required GitHub Actions checks pass, the PR is mergeable, and the exact tested head SHA is unchanged, merge it immediately without asking for separate confirmation. Never merge while checks are pending/failed, when conflicts remain, or when a safety/evidence gate is unresolved.
3. Do not publish a release, change repository visibility, add collaborators, or expose secrets unless separately authorized.
4. Keep changes small, reviewable, and documented. Explain changed files, tests run, and remaining limitations in the pull request.
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

## Mandatory training-data gate

Every Python training entry point must invoke `scripts/training_gate_guard.py` and require `--training-profile` plus `--training-data-root` before loading training data or creating a model. The profile must pass `scripts/research/validate-training-gate.py`. New notebooks or workflows that train models must invoke `.github/actions/verify-training-gate` (or the same validator) immediately before training. Never bypass the gate for exploratory work; use a dataset/task-specific signed profile. A Phase 0 `RESEARCH-GO` permits only the declared research task and does not authorize hybrid adoption or production activation.

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

Use a focused PR against `main`. After all required checks pass and the tested head SHA is unchanged, merge it immediately under the maintainer's standing instruction. Include:
- what changed and why;
- sources and evidence status for new research records;
- image licensing/provenance decisions;
- commands actually run and their results;
- what remains unverified.

The public repository may be inspected by external AI assistants, but repository access does not grant access to private accounts, private datasets, or private social-media groups.
