import type { Handle } from '@sveltejs/kit';
import sanitizeHtml from 'sanitize-html';

// Sanitization options
const SANITIZE_OPTIONS = {
  // Allowed tags for basic text formatting
  allowedTags: ['b', 'i', 'em', 'strong', 'a'],
  allowedAttributes: {
    'a': ['href']
  },
  // Prevent XSS by stripping all script tags
  allowedSchemesByTag: {},
  // Maximum input length to prevent DoS attacks
  MAX_INPUT_LENGTH: 10000
};

export const inputSanitizerMiddleware: Handle = async ({ event, resolve }) => {
  // Sanitize request body for POST, PUT, PATCH methods
  if (['POST', 'PUT', 'PATCH'].includes(event.request.method)) {
    try {
      const contentType = event.request.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        const rawBody = await event.request.text();
        
        // Check input length
        if (rawBody.length > SANITIZE_OPTIONS.MAX_INPUT_LENGTH) {
          return new Response(JSON.stringify({
            error: 'Input too large'
          }), { 
            status: 413,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        try {
          // Parse and sanitize JSON
          const parsedBody = JSON.parse(rawBody);
          const sanitizedBody = sanitizeJsonRecursive(parsedBody);

          // Recreate the request with sanitized body
          const sanitizedRequest = new Request(event.request, {
            body: JSON.stringify(sanitizedBody)
          });

          // Replace the original request
          event.request = sanitizedRequest;
        } catch (jsonError) {
          // Invalid JSON
          return new Response(JSON.stringify({
            error: 'Invalid JSON'
          }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    } catch (error) {
      console.error('Input sanitization error:', error);
      return new Response(JSON.stringify({
        error: 'Input sanitization failed'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return resolve(event);
};

// Recursive JSON sanitization
function sanitizeJsonRecursive(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Sanitize HTML in string values
    return sanitizeHtml(obj, SANITIZE_OPTIONS);
  }

  if (Array.isArray(obj)) {
    // Recursively sanitize array elements
    return obj.map(sanitizeJsonRecursive);
  }

  if (typeof obj === 'object') {
    const sanitizedObj: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip potential sensitive keys
      if (['password', 'token', 'secret'].includes(key.toLowerCase())) {
        continue;
      }

      sanitizedObj[key] = sanitizeJsonRecursive(value);
    }

    return sanitizedObj;
  }

  // For primitives (number, boolean), return as-is
  return obj;
}