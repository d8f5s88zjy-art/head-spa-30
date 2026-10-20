# 096 — Enterprise riadenie a oddelenie tenantov

Use when the actual programme has multiple organizations, teams or privileged workflows. Do not infer enterprise needs from a large price aspiration alone.

## Decide

Map tenants, actors, data boundaries, identity systems, audit needs and operating responsibilities. Choose isolation appropriate to risk and scale. Separate brand customization from data authority. A tenant ID in a UI filter is not enforced isolation.

## Execute

Propagate tenant context through server authorization, queries, caches, file storage, jobs, exports and search indexes. Keep administrative actions scoped and auditable. Define provisioning, role changes, suspension, deletion and recovery across integrated systems.

Plan contracts among teams: versioned APIs, schema compatibility, release coordination, incident ownership and service objectives. Use governance to settle consequential decisions, not to block every routine change. Route jurisdictional and regulated requirements to verified sources and appropriate specialists.

## Verify

Use authorized fixtures for two tenants and several roles. Test direct resource IDs, cached reads, exports, background events and revoked access. Exercise migration/rollout compatibility across consumers. Verify the actual server boundary; visual separation and login alone cannot prove isolation.

## Deliver

Provide the tenancy/permission model, responsibility map, compatibility plan, targeted evidence and material gaps. Make the first useful release explicit. Avoid presenting a marketing frontend with an admin login as a complete enterprise platform.
