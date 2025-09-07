import type { Handle } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

// Simple in-memory rate limiting for testing
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const handle: Handle = async ({ event, resolve }) => {
  const { url, request } = event;
  
  // Basic rate limiting for API endpoints
  if (url.pathname.startsWith('/api/')) {
    const ip = event.getClientAddress();
    const key = `${ip}:api`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 100;
    
    const current = rateLimitMap.get(key);
    
    if (current && now < current.resetTime) {
      if (current.count >= maxRequests) {
        return json(
          { error: 'Rate limit exceeded' },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil(current.resetTime / 1000).toString(),
            }
          }
        );
      }
      current.count++;
    } else {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    }
  }

  const response = await resolve(event);

  // Basic security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Access-Control-Allow-Origin', '*');
  
  // Add rate limit headers for API requests
  if (url.pathname.startsWith('/api/')) {
    const ip = event.getClientAddress();
    const key = `${ip}:api`;
    const current = rateLimitMap.get(key);
    
    if (current) {
      response.headers.set('X-RateLimit-Limit', '100');
      response.headers.set('X-RateLimit-Remaining', (100 - current.count).toString());
      response.headers.set('X-RateLimit-Reset', Math.ceil(current.resetTime / 1000).toString());
    }
  }

  return response;
};