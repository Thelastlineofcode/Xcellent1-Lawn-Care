---
title: CI/CD & Observability
id: epic-10-ci-observability
owner: devops
priority: medium
points: 5
---

## Summary

Add CI pipeline improvements (automate migrations and run tests), monitoring and
logging for production deployments, and basic alerting for server health and
failed background tasks.

## Acceptance Criteria

- CI runs tests and lints and applies migrations to a test DB during the CI run.
- Basic logging and health monitoring are in place with an incident alerting
  doc.

## Initial Stories

- `story-22-ci-test-migrations.md`
- `story-23-logging-monitoring.md`
