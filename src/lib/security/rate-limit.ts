import { NextResponse } from "next/server";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtMs: number;
  retryAfterSeconds: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __codeverseRateLimitStore: Map<string, number[]> | undefined;
}

const MAX_BUCKETS = 2000;

function getStore(): Map<string, number[]> {
  if (!globalThis.__codeverseRateLimitStore) {
    globalThis.__codeverseRateLimitStore = new Map<string, number[]>();
  }
  return globalThis.__codeverseRateLimitStore;
}

function pruneExpiredBuckets(store: Map<string, number[]>, nowMs: number, windowMs: number): void {
  const cutoff = nowMs - Math.max(windowMs, 60_000);
  for (const [bucketKey, timestamps] of store.entries()) {
    const active = timestamps.filter((ts) => ts > cutoff);
    if (active.length === 0) {
      store.delete(bucketKey);
    } else if (active.length !== timestamps.length) {
      store.set(bucketKey, active);
    }
  }
  if (store.size > MAX_BUCKETS) {
    const excess = store.size - MAX_BUCKETS;
    let deleted = 0;
    for (const bucketKey of store.keys()) {
      store.delete(bucketKey);
      deleted += 1;
      if (deleted >= excess) break;
    }
  }
}

export function resetRateLimiterStore(): void {
  getStore().clear();
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  return "unknown";
}

export function checkRateLimit(opts: {
  namespace: string;
  key: string;
  maxRequests: number;
  windowMs: number;
  nowMs?: number;
}): RateLimitResult {
  const nowMs = opts.nowMs ?? Date.now();
  const windowMs = Math.max(1000, opts.windowMs);
  const limit = Math.max(1, opts.maxRequests);
  const store = getStore();

  if (store.size > MAX_BUCKETS) {
    pruneExpiredBuckets(store, nowMs, windowMs);
  }

  const bucketKey = `${opts.namespace}:${opts.key}`;
  const cutoff = nowMs - windowMs;
  const recent = (store.get(bucketKey) ?? []).filter((ts) => ts > cutoff);

  if (recent.length >= limit) {
    const oldestActive = recent[0] ?? nowMs;
    const resetAtMs = oldestActive + windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAtMs - nowMs) / 1000));
    store.set(bucketKey, recent);
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAtMs,
      retryAfterSeconds,
    };
  }

  recent.push(nowMs);
  store.set(bucketKey, recent);

  const oldestActive = recent[0] ?? nowMs;
  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - recent.length),
    resetAtMs: oldestActive + windowMs,
    retryAfterSeconds: 0,
  };
}

export function checkDualRateLimit(opts: {
  namespace: string;
  userId: string;
  request: Request;
  maxRequests: number;
  windowMs: number;
  nowMs?: number;
}): RateLimitResult {
  const userResult = checkRateLimit({
    namespace: opts.namespace,
    key: `user:${opts.userId}`,
    maxRequests: opts.maxRequests,
    windowMs: opts.windowMs,
    nowMs: opts.nowMs,
  });

  if (!userResult.allowed) {
    return userResult;
  }

  const ip = getClientIp(opts.request);
  if (ip === "unknown") {
    return userResult;
  }

  const ipResult = checkRateLimit({
    namespace: opts.namespace,
    key: `ip:${ip}`,
    maxRequests: opts.maxRequests * 2,
    windowMs: opts.windowMs,
    nowMs: opts.nowMs,
  });

  return ipResult.allowed ? userResult : ipResult;
}

export function applyRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.ceil(result.resetAtMs / 1000)),
  );
  if (!result.allowed) {
    response.headers.set("Retry-After", String(result.retryAfterSeconds));
  }
  return response;
}

export function createRateLimitResponse(
  result: RateLimitResult,
  messageAr?: string,
): NextResponse {
  const response = NextResponse.json(
    {
      error:
        messageAr ??
        `تم تجاوز الحد المسموح للطلبات. حاول مجدداً بعد ${result.retryAfterSeconds} ثانية.`,
      retryAfterSeconds: result.retryAfterSeconds,
    },
    { status: 429 },
  );
  return applyRateLimitHeaders(response, result);
}

function parsePositiveIntEnv(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.round(parsed);
}

export function getVoucherRedeemRateLimitConfig(): {
  maxRequests: number;
  windowMs: number;
} {
  return {
    maxRequests: parsePositiveIntEnv(process.env.RATE_LIMIT_VOUCHER_MAX, 5),
    windowMs: parsePositiveIntEnv(process.env.RATE_LIMIT_VOUCHER_WINDOW_MS, 60_000),
  };
}

export function getAiGenerateRateLimitConfig(): {
  maxRequests: number;
  windowMs: number;
} {
  return {
    maxRequests: parsePositiveIntEnv(process.env.RATE_LIMIT_AI_MAX, 5),
    windowMs: parsePositiveIntEnv(process.env.RATE_LIMIT_AI_WINDOW_MS, 60_000),
  };
}
