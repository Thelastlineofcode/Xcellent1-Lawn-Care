# Security Overview

Xcellent1 Lawn Care implements several best-practice security measures to
protect user data and ensure service availability.

## 1. Rate Limiting

To prevent abuse and DoS attacks, the API implements strict rate limiting:

- **Limit**: 300 requests per minute per IP address.
- **Enforcement**: In-memory tracking in `server.ts`.
- **Response**: `429 Too Many Requests` if exceeded.

## 2. Cross-Origin Resource Sharing (CORS)

The API enforces strict CORS policies to prevent unauthorized cross-origin
requests.

- **Allowed Origins**:
  - `https://xcellent1lawncare.com`
  - `https://www.xcellent1lawncare.com`
  - `http://localhost:8000` (Dev)
  - `*.fly.dev` (Preview environments)
- **Blocked Origins**: All others receive `Access-Control-Allow-Origin: null` or
  are blocked.

## 3. Security Headers

All HTTP responses include industry-standard security headers:

- `Strict-Transport-Security` (HSTS): Enforces HTTPS connection.
- `X-Frame-Options: DENY`: Prevents clickjacking by disabling embedding in
  iframes.
- `X-Content-Type-Options: nosniff`: Prevents MIME type sniffing.
- `X-XSS-Protection: 1; mode=block`: Enables browser XSS filtering.
- `Referrer-Policy: same-origin`: Protects referrer data.

## 4. Input Sanitization & SQL Injection Prevention

- The application uses `postgres.js` (or Deno Postgres) parameterized queries
  (`$1`, `$2`, etc.) for all database interactions.
- User input is never concatenated directly into SQL strings.
- Inputs are validated for type and length in API handlers.

## 5. Reporting Vulnerabilities

If you discover a security vulnerability, please do NOT disclose it publicly.
Contact the owner directly via the dashboard or support@xcellent1lawncare.com.

---

_Last Updated: December 2025_
