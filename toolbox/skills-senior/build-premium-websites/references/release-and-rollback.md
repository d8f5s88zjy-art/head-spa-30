# 088 — Nasadenie a návrat predchádzajúcej verzie

Use when a reviewable change is moving into a shared or production environment. Separate preparing the release from executing external publication.

## Decide

Confirm the authorized environment, release scope, dependencies and rollback owner. Identify changes that cannot be undone by reverting code, including data migrations and external side effects. Carry forward existing user authorization; do not demand redundant approval for an already authorized action.

## Execute

Build reproducibly, run relevant checks and prepare a concrete artifact. Verify environment variable names/configuration without exposing secrets. Choose a staged or incremental rollout where the risk and platform justify it. Keep release notes focused on user behavior and operational consequences.

Prepare rollback criteria and a practical recovery sequence. Keep database compatibility and asset/cache versioning aligned with application versions. Finish preparatory work before asking for any genuinely required final confirmation. Do not publish merely because a preview looks complete if publication is outside scope.

## Verify

After an authorized release, check the real deployed primary journey, configuration, errors and meaningful monitoring. Confirm the version actually served. If a critical issue appears, use the authorized rollback route or clearly report the blocked decision. A successful deployment status alone is not functional acceptance.

## Deliver

Provide the live/review URL when available, version, verification, rollback route and material limits. Keep a blocked release distinct from completed local work. Do not claim deployment or persistence from an unexecuted command or a failed push.
