import type { Handle } from '@sveltejs/kit';

// Configurable CORS options
const CORS_CONFIG = {
  // Allowed origins (configure based on your deployment)
  allowedOrigins: [
    'https://monitors.app',
    'https://www.monitors.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  
  // Allowed HTTP methods
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  // Allowed headers
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'X-Rate-Limit-Limit',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset'
  ],
  
  // Max age for preflight requests
  maxAge: 86400 // 24 hours
};

export const corsMiddleware: Handle = async ({ event, resolve }) => {
  // Handle preflight requests
  if (event.request.method === 'OPTIONS') {
    const origin = event.request.headers.get('origin') || '';
    
    // Check if origin is allowed
    if (CORS_CONFIG.allowedOrigins.includes(origin)) {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': CORS_CONFIG.allowedMethods.join(', '),
          'Access-Control-Allow-Headers': CORS_CONFIG.allowedHeaders.join(', '),
          'Access-Control-Max-Age': CORS_CONFIG.maxAge.toString()
        }
      });
    }
  }

  // Resolve the main request
  const response = await resolve(event);

  // Add CORS headers to the response
  const origin = event.request.headers.get('origin') || '';
  
  if (CORS_CONFIG.allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  }

  return response;
};