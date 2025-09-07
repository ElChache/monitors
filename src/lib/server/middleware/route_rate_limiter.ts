import type { Handle } from '@sveltejs/kit';
import { RateLimitService } from './rate_limiter';

// Rate limit configurations for different routes
const RATE_LIMIT_CONFIG = {
  '/api/monitors': {
    limit: 50,
    window: 86400, // 24 hours
    type: 'api'
  },
  '/api/monitors/*/refresh': {
    limit: 10,
    window: 86400, // 24 hours
    type: 'monitor_refresh'
  },
  '/api/auth/login': {
    limit: 5,
    window: 900, // 15 minutes
    type: 'login'
  },
  '/api/auth/register': {
    limit: 3,
    window: 3600, // 1 hour
    type: 'registration'
  }
};

export const routeRateLimiterMiddleware: Handle = async ({ event, resolve }) => {
  const { url, getClientAddress } = event;
  const path = url.pathname;
  const clientIP = getClientAddress();

  // Find matching rate limit configuration
  const matchedConfig = Object.entries(RATE_LIMIT_CONFIG)
    .find(([pattern]) => {
      // Convert wildcard pattern to regex
      const regex = new RegExp(`^${pattern.replace(/\*/g, '[^/]+')}$`);
      return regex.test(path);
    });

  // Apply rate limiting if a matching configuration is found
  if (matchedConfig) {
    const [, config] = matchedConfig;
    const result = await RateLimitService.rateLimit({
      identifier: clientIP,
      limit: config.limit,
      window: config.window,
      type: config.type
    });

    // If rate limit is exceeded, return 429 Too Many Requests
    if (!result.allowed) {
      return new Response(JSON.stringify({
        error: 'Too many requests',
        retryAfter: result.retryAfter
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': result.retryAfter?.toString() || '0',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': (result.limit - result.current).toString(),
          'X-RateLimit-Reset': new Date(Date.now() + (result.retryAfter || 0) * 1000).toISOString()
        }
      });
    }

    // Add rate limit headers to the response
    const response = await resolve(event);
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', (result.limit - result.current).toString());
    return response;
  }

  // If no rate limit configuration is found, proceed normally
  return resolve(event);
};