import type { Handle } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { userDailyLimiter, ipHourlyLimiter, apiHourlyLimiter, authLimiter } from './rate_limiter';
import { AuthService } from '../auth/service';
import sanitizeHtml from 'sanitize-html';

/**
 * Extract user ID and IP from request
 */
async function getRequestInfo(event: any) {
  const authHeader = event.request.headers.get('authorization');
  const forwarded = event.request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 
            event.request.headers.get('x-real-ip') || 
            event.getClientAddress();

  let userId: string | undefined;
  
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const user = await AuthService.getCurrentUser(authHeader.substring(7));
      userId = user?.id;
    } catch {
      // Token invalid or expired, continue without user ID
    }
  }

  return { userId, ip };
}

/**
 * Apply rate limiting headers to response
 */
function addRateLimitHeaders(response: Response, result: any) {
  response.headers.set('X-RateLimit-Limit', result.maxRequests?.toString() || '0');
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime.getTime() / 1000).toString());
  response.headers.set('X-RateLimit-Window', Math.ceil(result.windowMs / 1000).toString());
  
  if (!result.allowed) {
    response.headers.set('Retry-After', Math.ceil(result.windowMs / 1000).toString());
  }
}

/**
 * Rate limiting middleware
 */
export const rateLimitMiddleware: Handle = async ({ event, resolve }) => {
  const { url, request } = event;
  const { userId, ip } = await getRequestInfo(event);
  
  // Skip rate limiting for static assets and non-API routes
  if (!url.pathname.startsWith('/api/')) {
    return resolve(event);
  }

  // Authentication endpoints use stricter IP-based limiting
  if (url.pathname.startsWith('/api/auth/')) {
    const result = await authLimiter.checkLimit(undefined, ip, 'auth');
    
    if (!result.allowed) {
      const response = json(
        { error: 'Too many authentication attempts. Please try again later.' },
        { status: 429 }
      );
      addRateLimitHeaders(response, result);
      return response;
    }
  }

  // Manual refresh endpoint uses daily user limits
  if (url.pathname.includes('/refresh') && request.method === 'POST') {
    if (!userId) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const dailyResult = await userDailyLimiter.checkLimit(userId, ip, 'manual_refresh');
    
    if (!dailyResult.allowed) {
      const response = json(
        { 
          error: 'Daily manual refresh limit exceeded (50/day). Automatic monitoring continues.',
          limit: 50,
          remaining: dailyResult.remaining,
          resetTime: dailyResult.resetTime.toISOString()
        },
        { status: 429 }
      );
      addRateLimitHeaders(response, dailyResult);
      return response;
    }
  }

  // General API rate limiting
  const apiResult = await apiHourlyLimiter.checkLimit(userId, ip, 'api');
  if (!apiResult.allowed) {
    const response = json(
      { error: 'API rate limit exceeded. Please slow down.' },
      { status: 429 }
    );
    addRateLimitHeaders(response, apiResult);
    return response;
  }

  // IP-based abuse prevention
  const ipResult = await ipHourlyLimiter.checkLimit(undefined, ip, 'abuse');
  if (!ipResult.allowed) {
    const response = json(
      { error: 'Too many requests from this IP address.' },
      { status: 429 }
    );
    addRateLimitHeaders(response, ipResult);
    return response;
  }

  // Continue with request
  const response = await resolve(event);
  
  // Add rate limit headers to successful responses
  addRateLimitHeaders(response, apiResult);
  
  return response;
};

/**
 * Security headers middleware
 */
export const securityHeadersMiddleware: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS for production
  if (event.url.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // SvelteKit needs unsafe-inline/eval in dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.openai.com https://api.anthropic.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);

  // CORS headers for API endpoints
  if (event.url.pathname.startsWith('/api/')) {
    const origin = event.request.headers.get('origin');
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:4173',
      'https://yourdomain.com' // Replace with actual production domain
    ];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    } else {
      response.headers.set('Access-Control-Allow-Origin', '*');
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  return response;
};

/**
 * Input sanitization utility
 */
export function sanitizeInput(input: any, options: {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
} = {}): any {
  if (typeof input === 'string') {
    return sanitizeHtml(input, {
      allowedTags: options.allowedTags || [],
      allowedAttributes: options.allowedAttributes || {},
      disallowedTagsMode: 'discard',
      allowedSchemes: ['http', 'https', 'mailto'],
    });
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item, options));
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value, options);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Input validation middleware for API endpoints
 */
export const inputValidationMiddleware: Handle = async ({ event, resolve }) => {
  const { request, url } = event;
  
  // Only apply to API POST/PUT requests with JSON body
  if (!url.pathname.startsWith('/api/') || 
      !['POST', 'PUT', 'PATCH'].includes(request.method) ||
      !request.headers.get('content-type')?.includes('application/json')) {
    return resolve(event);
  }

  try {
    const body = await request.json();
    
    // Basic sanitization - remove potentially harmful HTML/script content
    const sanitizedBody = sanitizeInput(body, {
      allowedTags: [], // No HTML tags allowed in JSON API
      allowedAttributes: {}
    });

    // Create new request with sanitized body
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(sanitizedBody),
    });

    // Replace the original request
    event.request = newRequest;

  } catch (error) {
    // If JSON parsing fails, let it continue to the actual handler
    // which will return appropriate error
  }

  return resolve(event);
};

/**
 * Admin override utility
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  // TODO: Implement admin user checking logic
  // For now, return false - implement when user roles are added
  return false;
}

/**
 * Check if user has admin override for rate limits
 */
export async function hasRateLimitOverride(userId?: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    return await isAdminUser(userId);
  } catch {
    return false;
  }
}