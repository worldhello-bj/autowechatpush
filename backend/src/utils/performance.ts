import { createLogger } from './logger.js';
import { Request, Response, NextFunction } from 'express';

const logger = createLogger('performance');

/**
 * Performance monitoring utilities
 * 
 * Provides tools to monitor and track performance metrics for the backend service
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Store recent metrics in memory (last 1000 entries)
const recentMetrics: PerformanceMetric[] = [];
const MAX_METRICS = 1000;

/**
 * Measure execution time of an async function
 * 
 * @param name - Name of the operation being measured
 * @param fn - Async function to measure
 * @param metadata - Optional metadata to attach to the metric
 * @returns Result of the function
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = process.hrtime.bigint();
  
  try {
    const result = await fn();
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
    
    recordMetric({ name, duration, timestamp: new Date(), metadata });
    
    return result;
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1_000_000;
    
    recordMetric({ 
      name: `${name}_error`, 
      duration, 
      timestamp: new Date(), 
      metadata: { ...metadata, error: error instanceof Error ? error.message : String(error) }
    });
    
    throw error;
  }
}

/**
 * Record a performance metric
 */
function recordMetric(metric: PerformanceMetric): void {
  // Add to recent metrics
  recentMetrics.push(metric);
  
  // Trim if exceeds max size
  if (recentMetrics.length > MAX_METRICS) {
    recentMetrics.shift();
  }
  
  // Log slow operations (> 1000ms)
  if (metric.duration > 1000) {
    logger.warn('Slow operation detected', {
      operation: metric.name,
      duration: `${metric.duration.toFixed(2)}ms`,
      metadata: metric.metadata,
    });
  } else if (metric.duration > 100) {
    logger.debug('Operation performance', {
      operation: metric.name,
      duration: `${metric.duration.toFixed(2)}ms`,
      metadata: metric.metadata,
    });
  }
}

/**
 * Get performance statistics for a specific operation
 */
export function getOperationStats(operationName: string): {
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
} | null {
  const metrics = recentMetrics.filter(m => m.name === operationName);
  
  if (metrics.length === 0) {
    return null;
  }
  
  const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
  const count = durations.length;
  const sum = durations.reduce((a, b) => a + b, 0);
  
  return {
    count,
    avgDuration: sum / count,
    minDuration: durations[0],
    maxDuration: durations[count - 1],
    p50: durations[Math.floor(count * 0.5)],
    p95: durations[Math.floor(count * 0.95)],
    p99: durations[Math.floor(count * 0.99)],
  };
}

/**
 * Get all performance statistics
 */
export function getAllStats(): Record<string, ReturnType<typeof getOperationStats>> {
  const operations = new Set(recentMetrics.map(m => m.name));
  const stats: Record<string, ReturnType<typeof getOperationStats>> = {};
  
  for (const operation of operations) {
    stats[operation] = getOperationStats(operation);
  }
  
  return stats;
}

/**
 * Get memory usage statistics
 */
export function getMemoryStats() {
  const usage = process.memoryUsage();
  
  return {
    rss: formatBytes(usage.rss),
    heapTotal: formatBytes(usage.heapTotal),
    heapUsed: formatBytes(usage.heapUsed),
    external: formatBytes(usage.external),
    arrayBuffers: formatBytes(usage.arrayBuffers || 0),
  };
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Clear all metrics (useful for testing)
 */
export function clearMetrics(): void {
  recentMetrics.length = 0;
}

/**
 * Performance monitoring middleware for Express
 */
export function performanceMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = process.hrtime.bigint();
    
    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1_000_000;
      
      recordMetric({
        name: `http_${req.method}_${req.route?.path || 'unknown'}`,
        duration,
        timestamp: new Date(),
        metadata: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
        },
      });
    });
    
    next();
  };
}
