import http from 'http';
import https from 'https';

/**
 * HTTP/HTTPS agents with connection pooling for better performance
 * 
 * Benefits:
 * - Reuses TCP connections (keepAlive)
 * - Reduces connection establishment overhead
 * - Improves performance for repeated API calls
 * - Limits concurrent connections to prevent overwhelming external services
 */

export const httpAgent = new http.Agent({
  keepAlive: true,           // Reuse connections
  maxSockets: 50,            // Max concurrent connections per host
  maxFreeSockets: 10,        // Max idle connections to keep
  timeout: 60000,            // Connection timeout (60 seconds)
  keepAliveMsecs: 1000,      // Keep alive probe interval
});

export const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
  keepAliveMsecs: 1000,
});

/**
 * Custom timeout error class
 */
export class TimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`Request to ${url} timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Enhanced fetch with timeout and agent support
 * 
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns Response
 * @throws TimeoutError if request times out
 */
export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      // Note: Node.js fetch implementation supports agent option for connection pooling
      // but it's not in the standard RequestInit type definition
      // @ts-expect-error - agent option is supported by Node.js fetch but not in types
      agent: url.startsWith('https:') ? httpsAgent : httpAgent,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Convert AbortError to TimeoutError for better context
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(url, timeoutMs);
    }
    
    throw error;
  }
};
