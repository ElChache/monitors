import type { Handle } from '@sveltejs/kit';

export const securityHeadersMiddleware: Handle = async ({ event, resolve }) => {
  // Resolve the response
  const response = await resolve(event);

  // Security headers configuration
  const securityHeaders = {
    // Prevent clickjacking attacks
    'X-Frame-Options': 'DENY',
    
    // Enforce HTTPS and prevent MITM attacks
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent XSS attacks
    'X-XSS-Protection': '1; mode=block',
    
    // Restrict access to sensitive resources
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Restrict content sources for additional security
    'Content-Security-Policy': 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data:; " +
      "connect-src 'self'; " +
      "font-src 'self'; " +
      "object-src 'none'; " +
      "media-src 'self'; " +
      "frame-src 'none'"
  };

  // Add security headers to the response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
};