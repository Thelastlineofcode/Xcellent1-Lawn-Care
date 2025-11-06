# Review Invite Agent

Sends review invitations after payment and records responses. Current `handler.ts` is a stub.

Next steps:

1. Wire to outbox for sending and to a `reviews` table for responses.
2. Implement tracking and deduplication of invites.
