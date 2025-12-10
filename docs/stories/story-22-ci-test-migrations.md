---
title: CI Test Migrations
id: story-22-ci-test-migrations
epic: epic-10-ci-observability
owner: devops
points: 3
---

Tasks
-----
- Configure CI pipeline to run `scripts/run_migrations.sh` in test mode.
- Ensure tests run against a migrated test DB and rollback/cleanup happens.

Acceptance Criteria
-------------------
- CI runs migrations successfully and tests pass against the test DB.
