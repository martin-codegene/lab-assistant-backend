import { Context, Next } from 'hono';
import { JwtService } from './jwt';

export interface AuthContext extends Context {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export async function authMiddleware(c: AuthContext, next: Next) {
  // Try Authorization header first, then query param (for WebSocket connections)
  let token: string | undefined;

  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    token = c.req.query('token') ?? undefined;
  }

  if (!token) {
    return c.json({ error: 'No token provided' }, 401);
  }

  const payload = JwtService.verifyToken(token);

  if (!payload) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  c.set('user', { ...payload, id: payload.userId });

  await next();
}

export function requireRole(role: string) {
  return async (c: AuthContext, next: Next) => {
    if (!c.user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    if (c.user.role !== role) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    await next();
  };
}

export function requireAnyRole(roles: string[]) {
  return async (c: AuthContext, next: Next) => {
    if (!c.user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    if (!roles.includes(c.user.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    await next();
  };
}