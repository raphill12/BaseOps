/**
 * Vercel Edge Middleware — HTTP Basic Auth gate.
 *
 * Set SITE_PASSWORD in your Vercel project's Environment Variables.
 * Leave it unset (or empty) to disable the gate entirely.
 *
 * Browser prompt: username can be anything; only the password is checked.
 */
export const config = { matcher: '/(.*)', };

export default function middleware(request) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return; // no password set → open access

  const auth = request.headers.get('Authorization') || '';
  if (auth.startsWith('Basic ')) {
    try {
      const [, pass] = atob(auth.slice(6)).split(':');
      if (pass === password) return; // ✓ authenticated
    } catch {
      // malformed header — fall through to 401
    }
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="BaseOps Dashboard", charset="UTF-8"',
      'Content-Type': 'text/plain',
    },
  });
}
