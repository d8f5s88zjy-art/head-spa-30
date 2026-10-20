# 060 — Závislosti a reprodukovateľný build

Use when adding packages, upgrading a stack or preparing a maintainable handoff. Every dependency becomes part of the operating cost.

## Decide

Inspect the existing package manager, lockfile and scripts. Add a library only for a demonstrated need that justifies bundle, maintenance and compatibility costs. Prefer one coherent motion/rendering authority over overlapping libraries performing the same job.

## Execute

Check current official docs, supported versions, license and compatibility before use. Keep runtime and development dependencies intentional. Follow the established install/build workflow and preserve unrelated working-tree changes. Avoid rewriting lockfiles with a different package manager.

Pin reproducible inputs according to project policy. Record required environment variable names without secret values. Inspect generated client bundles for server-only imports or secret exposure when that boundary changes. Make version upgrades as small and reviewable as the migration permits.

## Verify

Run the relevant build and targeted checks from the actual project. Inspect changed dependency/lockfile scope and investigate unexpected churn. Confirm that documented start/build commands are real. A passing type check does not establish runtime library compatibility or visual quality.

## Deliver

Provide dependency rationale, lockfile changes, build evidence and any upgrade limitations. Remove unused experiments and temporary packages. Do not treat the skill's catalog of 100 tools as an instruction to install them or as evidence that they are already available.
