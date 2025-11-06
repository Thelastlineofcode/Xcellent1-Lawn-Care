#!/usr/bin/env bash
# Run all agent stubs locally (simple, uses background jobs). Inspect logs on console.

set -euo pipefail

echo "Starting local agents..."

deno run --allow-net --allow-read --allow-write --allow-env bmad/agents/outbox/worker.ts &
OUTBOX_PID=$!

deno run --allow-net --allow-read --allow-write --allow-env bmad/agents/intake/handler.ts &
INTAKE_PID=$!

deno run --allow-net --allow-read --allow-write --allow-env bmad/agents/quote/handler.ts &
QUOTE_PID=$!

deno run --allow-net --allow-read --allow-write --allow-env bmad/agents/invoice/handler.ts &
INVOICE_PID=$!

echo "Agents started: outbox=$OUTBOX_PID intake=$INTAKE_PID quote=$QUOTE_PID invoice=$INVOICE_PID"
echo "Press Ctrl+C to stop"

wait
