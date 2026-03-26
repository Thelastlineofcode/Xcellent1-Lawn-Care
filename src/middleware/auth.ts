
import { authenticateRequest } from "../../supabase_auth.ts";

// Helper for constructing security headers (CORS, etc.)
// Re-implemented to avoid circular dependency on server.ts
export function getSecurityHeaders(req: Request): Headers {
    const headers = new Headers();
    const origin = req.headers.get("origin");

    // Allow localhost for dev, and production domains
    const allowedOrigins = [
        "http://localhost:8000",
        "http://0.0.0.0:8000",
        "https://xcellent1lawncare.com",
        "https://www.xcellent1lawncare.com",
        "https://xcellent1-lawn-care.fly.dev",
        "https://xcellent1-lawn-care-rpneaa.fly.dev",
    ];

    if (origin && allowedOrigins.includes(origin)) {
        headers.set("Access-Control-Allow-Origin", origin);
        headers.set("Access-Control-Allow-Credentials", "true");
    } else if (!origin) {
        // Non-browser requests (curl, etc) - no CORS needed usually, but some tools like it
        headers.set("Access-Control-Allow-Origin", "*");
    }
    // Fallback for strict production: do not allow * if origin is present but unauthorized

    headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    );
    headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, Accept, Origin",
    );
    // Security headers
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-XSS-Protection", "1; mode=block");
    return headers;
}

export async function requireAuth(
    req: Request,
    allowedRoles?: string[],
): Promise<
    { authorized: false; response: Response } | { authorized: true; auth: any }
> {
    const auth = await authenticateRequest(req);

    if (!auth) {
        return {
            authorized: false,
            response: new Response(
                JSON.stringify({ ok: false, error: "Unauthorized - please log in" }),
                {
                    status: 401,
                    headers: getSecurityHeaders(req),
                },
            ),
        };
    }

    // Check role-based authorization if roles specified
    if (allowedRoles && !allowedRoles.includes(auth.profile.role)) {
        return {
            authorized: false,
            response: new Response(
                JSON.stringify({
                    ok: false,
                    error: "Forbidden - insufficient permissions",
                }),
                {
                    status: 403,
                    headers: getSecurityHeaders(req),
                },
            ),
        };
    }

    return {
        authorized: true,
        auth,
    };
}
