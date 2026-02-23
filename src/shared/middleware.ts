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
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'No token provided' }, 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const payload = JwtService.verifyToken(token);

  if (!payload) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  // Attach user info to context
  c.set('user', {...payload, id: payload.userId})
  
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