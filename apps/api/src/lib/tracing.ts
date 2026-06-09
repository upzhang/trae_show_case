import crypto from "crypto";

export function generateTraceId(): string {
  return crypto.randomUUID().replace(/-/g, "").substring(0, 16);
}

export function generateRequestId(): string {
  return `${Date.now().toString(36)}-${crypto.randomBytes(4).toString("base64url")}`;
}

export interface TraceContext {
  traceId: string;
  requestId: string;
  parentSpanId?: string;
  spanId?: string;
}

export class Tracer {
  private traceId: string;
  private requestId: string;
  private spanId?: string;

  constructor(traceId?: string, requestId?: string) {
    this.traceId = traceId ?? generateTraceId();
    this.requestId = requestId ?? generateRequestId();
  }

  getTraceId(): string {
    return this.traceId;
  }

  getRequestId(): string {
    return this.requestId;
  }

  getSpanId(): string | undefined {
    return this.spanId;
  }

  setSpanId(spanId: string): void {
    this.spanId = spanId;
  }

  generateSpanId(): string {
    const spanId = crypto.randomBytes(4).toString("hex");
    this.spanId = spanId;
    return spanId;
  }

  toContext(): TraceContext {
    return {
      traceId: this.traceId,
      requestId: this.requestId,
      spanId: this.spanId
    };
  }

  toHeaders(): Record<string, string> {
    return {
      "x-trace-id": this.traceId,
      "x-request-id": this.requestId,
      ...(this.spanId && { "x-span-id": this.spanId })
    };
  }

  static fromHeaders(headers: Record<string, string>): Tracer {
    return new Tracer(headers["x-trace-id"], headers["x-request-id"]);
  }

  startSpan(name: string): Span {
    const spanId = this.generateSpanId();
    return new Span(name, this.traceId, spanId, this.requestId);
  }
}

export class Span {
  private name: string;
  private traceId: string;
  private spanId: string;
  private requestId: string;
  private startTime: number;
  private endTime?: number;
  private attributes: Record<string, unknown> = {};

  constructor(name: string, traceId: string, spanId: string, requestId: string) {
    this.name = name;
    this.traceId = traceId;
    this.spanId = spanId;
    this.requestId = requestId;
    this.startTime = Date.now();
  }

  setAttribute(key: string, value: unknown): void {
    this.attributes[key] = value;
  }

  addEvent(name: string, attributes?: Record<string, unknown>): void {
    const events = (this.attributes["events"] as Array<{ name: string; time: number; attributes?: Record<string, unknown> }>) || [];
    events.push({
      name,
      time: Date.now(),
      attributes
    });
    this.attributes["events"] = events;
  }

  end(): void {
    this.endTime = Date.now();
  }

  getDuration(): number {
    return (this.endTime ?? Date.now()) - this.startTime;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      traceId: this.traceId,
      spanId: this.spanId,
      requestId: this.requestId,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.getDuration(),
      attributes: this.attributes
    };
  }

  toString(): string {
    const duration = this.getDuration();
    return `${this.name} (${this.traceId}): ${duration}ms`;
  }
}

export function getTraceIdFromHeaders(headers: Record<string, string | string[] | undefined>): string {
  const traceId = headers["x-trace-id"];
  if (Array.isArray(traceId)) {
    return traceId[0] ?? generateTraceId();
  }
  return traceId ?? generateTraceId();
}

export function getRequestIdFromHeaders(headers: Record<string, string | string[] | undefined>): string {
  const requestId = headers["x-request-id"];
  if (Array.isArray(requestId)) {
    return requestId[0] ?? generateRequestId();
  }
  return requestId ?? generateRequestId();
}

export function createTracerFromHeaders(headers: Record<string, string | string[] | undefined>): Tracer {
  return new Tracer(
    getTraceIdFromHeaders(headers),
    getRequestIdFromHeaders(headers)
  );
}

export interface LogEntry {
  timestamp: number;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  traceId?: string;
  requestId?: string;
  spanId?: string;
  data?: Record<string, unknown>;
}

export class Logger {
  private traceId?: string;
  private requestId?: string;

  constructor(traceId?: string, requestId?: string) {
    this.traceId = traceId;
    this.requestId = requestId;
  }

  setTraceId(traceId: string): void {
    this.traceId = traceId;
  }

  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log("debug", message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log("warn", message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log("error", message, data);
  }

  private log(level: "debug" | "info" | "warn" | "error", message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      traceId: this.traceId,
      requestId: this.requestId,
      ...(data && { data })
    };

    const logString = JSON.stringify(entry);

    switch (level) {
      case "debug":
        console.debug(logString);
        break;
      case "info":
        console.info(logString);
        break;
      case "warn":
        console.warn(logString);
        break;
      case "error":
        console.error(logString);
        break;
    }
  }
}

export function createLogger(traceId?: string, requestId?: string): Logger {
  return new Logger(traceId, requestId);
}
