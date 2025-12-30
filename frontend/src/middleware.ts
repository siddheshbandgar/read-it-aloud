// Middleware disabled - no authentication required for testing
// All routes are public

export default function middleware() {
    // No-op
}

export const config = {
    matcher: [], // Don't match any routes
};
