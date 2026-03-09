import { createClient } from '@supabase/supabase-js';

// Read database credentials from environment variables (set via .env or hosting provider)
// Fallbacks are provided for local development convenience but should be overridden in production
const supabaseUrl = import.meta.env.VITE_database_URL
  || 'https://haqqahzxutnjgtmfizme.supabase.co';

const supabaseKey = import.meta.env.VITE_database_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImE5MjlmZGIzLTg5YmYtNDFlNS1iNGIxLWIwMmMwYmZkZDc3NiJ9.eyJwcm9qZWN0SWQiOiJsYndlY2lsdXlweGdtcWNja2ZodSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY5NzE2NjkzLCJleHAiOjIwODUwNzY2OTMsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.Hz8CWkSEVa0jkT7AhydWBvt04ZUdGBgEBrA7niFaqp4';

const supabase = createClient(supabaseUrl, supabaseKey);

// Export raw URL and key for components that need direct fetch (e.g. file uploads)
export { supabase, supabaseUrl, supabaseKey };

// ─────────────────────────────────────────────────────────────
// Edge Function invocation with timeout
// ─────────────────────────────────────────────────────────────
// When an edge function is not deployed, the CORS preflight may hang or
// the request may time out. This wrapper ensures the UI never hangs
// indefinitely waiting for a response.
// ─────────────────────────────────────────────────────────────

interface InvokeResult<T = any> {
  data: T | null;
  error: { message: string; name?: string } | null;
}

/**
 * Invoke a Supabase Edge Function with a timeout.
 * Returns { data, error } — same shape as supabase.functions.invoke.
 * If the function is unreachable or times out, returns an error instead of hanging.
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body: Record<string, any>,
  timeoutMs: number = 15000
): Promise<InvokeResult<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const resultPromise = supabase.functions.invoke(functionName, {
      body,
      // Note: supabase-js v2 doesn't support AbortSignal in functions.invoke,
      // so we race the promise against a timeout instead
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      controller.signal.addEventListener('abort', () => {
        reject(new Error(`Edge function '${functionName}' timed out after ${timeoutMs}ms`));
      });
    });

    const { data, error } = await Promise.race([resultPromise, timeoutPromise]) as any;

    clearTimeout(timeoutId);

    if (error) {
      return {
        data: null,
        error: { message: error.message || `Edge function '${functionName}' returned an error`, name: error.name }
      };
    }

    return { data: data as T, error: null };
  } catch (err: any) {
    // Network error, CORS error, timeout, or function not found
    const message = err?.message || `Failed to invoke edge function '${functionName}'`;
    console.error(`[invokeEdgeFunction] ${functionName} failed:`, message);
    return {
      data: null,
      error: { message, name: 'EdgeFunctionError' }
    };
  }
}
