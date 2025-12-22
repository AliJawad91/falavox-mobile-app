// Centralized runtime configuration
// Reads from process.env if available (Metro can inline via babel plugin),
// otherwise falls back to sane defaults for development.

const env = ((globalThis as any)?.process?.env ?? {}) as Record<string, string | undefined>;

export const APP_CONFIG = {
  // Prefer env var; keep existing App ID as fallback for dev
  AGORA_APP_ID: env.AGORA_APP_ID || 'd16f5f8c92514f8c9816c41f96a4340c',
  // Single source of truth for backend base URL
  SERVER_HOST: env.SERVER_HOST || 'https://untreated-nonvisional-neriah.ngrok-free.dev',
  TOKEN_ENDPOINT: '/api/token',
  // Network defaults
  REQUEST_TIMEOUT_MS: 10_000,
  // Stripe configuration - NOTE: This must be a PUBLISHABLE key (pk_test_...), NOT a secret key
  STRIPE_PUBLISHABLE_KEY: env.STRIPE_PUBLISHABLE_KEY || 'pk_test_51RRFI1PoC0ROey43AcXKnDTW5WM4bbkxjxBL2wAuWKHmF6gdAVB3M99Y7eia3f1u16ktOKhGTpKmtQ9rvgzvDcm100NuP5o3mq', // Replace with your Stripe PUBLISHABLE key (starts with pk_test_)
} as const;

export function withBase(path: string): string {
  if (!path.startsWith('/')) return `${APP_CONFIG.SERVER_HOST}/${path}`;
  return `${APP_CONFIG.SERVER_HOST}${path}`;
}

export async function fetchWithTimeout(
  input: string,
  init: RequestInit & { timeoutMs?: number } = {}
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? APP_CONFIG.REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}


