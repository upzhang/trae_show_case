export interface MetricData {
  timestamp: number;
  value: number;
  labels?: Record<string, string>;
}

export interface MetricSummary {
  min: number;
  max: number;
  avg: number;
  sum: number;
  count: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export class MetricsCollector {
  private metrics: Map<string, MetricData[]> = new Map();

  record(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push({
      timestamp: Date.now(),
      value,
      labels
    });
  }

  get(name: string): MetricData[] {
    return this.metrics.get(name) || [];
  }

  clear(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  summarize(name: string): MetricSummary {
    const data = this.get(name);
    if (data.length === 0) {
      return { min: 0, max: 0, avg: 0, sum: 0, count: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
    }

    const sorted = [...data].sort((a, b) => a.value - b.value);
    const sum = sorted.reduce((acc, d) => acc + d.value, 0);
    const count = sorted.length;

    return {
      min: sorted[0].value,
      max: sorted[sorted.length - 1].value,
      avg: sum / count,
      sum,
      count,
      p50: sorted[Math.floor(count * 0.5)].value,
      p90: sorted[Math.floor(count * 0.9)].value,
      p95: sorted[Math.floor(count * 0.95)].value,
      p99: sorted[Math.floor(count * 0.99)].value
    };
  }

  getMetricsNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  export(): Record<string, MetricData[]> {
    const result: Record<string, MetricData[]> = {};
    this.metrics.forEach((data, name) => {
      result[name] = data;
    });
    return result;
  }

  reset(): void {
    this.metrics.clear();
  }
}

export const metricsCollector = new MetricsCollector();

export function measureExecutionTime<T>(name: string, fn: () => T): T {
  const start = Date.now();
  try {
    return fn();
  } finally {
    const duration = Date.now() - start;
    metricsCollector.record(`${name}_duration_ms`, duration);
  }
}

export async function measureAsyncExecutionTime<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    const duration = Date.now() - start;
    metricsCollector.record(`${name}_duration_ms`, duration);
  }
}

export function trackRequest(method: string, path: string, statusCode: number, duration: number): void {
  metricsCollector.record("http_request_duration_ms", duration, { method, path, statusCode: String(statusCode) });
  metricsCollector.record("http_request_count", 1, { method, path, statusCode: String(statusCode) });
}

export function trackError(errorType: string, message?: string): void {
  metricsCollector.record("error_count", 1, { errorType, message: message || "unknown" });
}

export function trackMemoryUsage(): void {
  const memory = process.memoryUsage();
  metricsCollector.record("memory_heap_used_bytes", memory.heapUsed);
  metricsCollector.record("memory_heap_total_bytes", memory.heapTotal);
  metricsCollector.record("memory_rss_bytes", memory.rss);
}

export function trackGC(): void {
  if ((global as unknown as { gc?: () => void }).gc) {
    (global as unknown as { gc: () => void }).gc();
  }
  trackMemoryUsage();
}

export function calculateApdex(samples: number[], targetMs: number): number {
  const satisfied = samples.filter(s => s <= targetMs).length;
  const tolerating = samples.filter(s => s > targetMs && s <= targetMs * 4).length;
  const frustrated = samples.filter(s => s > targetMs * 4).length;
  
  const total = satisfied + tolerating + frustrated;
  if (total === 0) return 0;
  
  return (satisfied + tolerating * 0.5) / total;
}

export function calculateErrorRate(totalRequests: number, errorCount: number): number {
  if (totalRequests === 0) return 0;
  return (errorCount / totalRequests) * 100;
}

export function calculateAvailability(uptimeMs: number, totalTimeMs: number): number {
  if (totalTimeMs === 0) return 0;
  return (uptimeMs / totalTimeMs) * 100;
}

export function calculateThroughput(requests: number, durationMs: number): number {
  if (durationMs === 0) return 0;
  return requests / (durationMs / 1000);
}

export function aggregateByTime(data: MetricData[], intervalMinutes: number): MetricData[] {
  const aggregated: Record<string, { sum: number; count: number; labels: Record<string, string> }> = {};

  data.forEach(d => {
    const intervalStart = Math.floor(d.timestamp / (intervalMinutes * 60 * 1000)) * intervalMinutes * 60 * 1000;
    const key = `${intervalStart}-${JSON.stringify(d.labels)}`;
    
    if (!aggregated[key]) {
      aggregated[key] = { sum: 0, count: 0, labels: d.labels || {} };
    }
    aggregated[key].sum += d.value;
    aggregated[key].count++;
  });

  return Object.entries(aggregated).map(([key, value]) => ({
    timestamp: parseInt(key.split("-")[0]),
    value: value.sum / value.count,
    labels: value.labels
  }));
}

export function filterByLabels(data: MetricData[], labels: Record<string, string>): MetricData[] {
  return data.filter(d => {
    return Object.entries(labels).every(([key, value]) => {
      return d.labels?.[key] === value;
    });
  });
}

export function getTimeRangeData(data: MetricData[], startMs: number, endMs: number): MetricData[] {
  return data.filter(d => d.timestamp >= startMs && d.timestamp <= endMs);
}

export function generateMetricsReport(): Record<string, MetricSummary> {
  const report: Record<string, MetricSummary> = {};
  metricsCollector.getMetricsNames().forEach(name => {
    report[name] = metricsCollector.summarize(name);
  });
  return report;
}

export function formatMetricsReport(report: Record<string, MetricSummary>): string {
  let output = "Metrics Report:\n";
  output += "=".repeat(60) + "\n";
  
  Object.entries(report).forEach(([name, summary]) => {
    output += `${name}:\n`;
    output += `  Count: ${summary.count}\n`;
    output += `  Min: ${summary.min}\n`;
    output += `  Max: ${summary.max}\n`;
    output += `  Avg: ${summary.avg.toFixed(2)}\n`;
    output += `  Sum: ${summary.sum}\n`;
    output += `  P50: ${summary.p50}\n`;
    output += `  P90: ${summary.p90}\n`;
    output += `  P95: ${summary.p95}\n`;
    output += `  P99: ${summary.p99}\n`;
    output += "-".repeat(40) + "\n";
  });
  
  return output;
}