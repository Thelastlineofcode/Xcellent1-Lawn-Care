# Story: Comprehensive User Flow Testing

**As a** QA Engineer\
**I want** comprehensive E2E tests covering all user journeys\
**So that** I can validate the complete application functionality

## Acceptance Criteria

### Owner Workflow Tests

- [ ] Owner can log in and access dashboard
- [ ] Owner can view business KPIs and metrics
- [ ] Owner can create and manage client records
- [ ] Owner can schedule jobs for clients
- [ ] Owner can create and send invoices
- [ ] Owner can record payments on invoices
- [ ] Owner can view crew performance metrics
- [ ] Owner can use the quote calculator

### Crew Workflow Tests

- [ ] Crew member can log in to mobile interface
- [ ] Crew can view assigned jobs for the day
- [ ] Crew can start jobs and update status
- [ ] Crew can upload before/after photos
- [ ] Crew can mark jobs as completed
- [ ] Crew can add notes to job completion

### Client Workflow Tests

- [ ] Client can log in to self-service portal
- [ ] Client can view upcoming scheduled jobs
- [ ] Client can view service history and photos
- [ ] Client can view outstanding invoices
- [ ] Client can make online payments
- [ ] Client can mark payments as completed

### Guest/Public Workflow Tests

- [ ] Visitors can access careers page
- [ ] Visitors can join waitlist for services
- [ ] Visitors can use instant quote calculator
- [ ] Visitors can view service information

## Technical Requirements

- Tests must run against live server instance
- Tests must handle authentication properly
- Tests must clean up test data appropriately
- Tests must be deterministic and not flaky
- Tests must cover error scenarios and edge cases
- Tests must validate both UI and API responses

## Story Points: 21

## Priority: P0

## Dependencies: All core functionality implemented
