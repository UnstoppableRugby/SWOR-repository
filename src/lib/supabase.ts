import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL');
}

if (!supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase, supabaseUrl, supabaseKey };

interface InvokeResult<T = any> {
  data: T | null;
  error: { message: string; name?: string } | null;
}

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
        error: {
          message: error.message || `Edge function '${functionName}' returned an error`,
          name: error.name,
        },
      };
    }

    return { data: data as T, error: null };
  } catch (err: any) {
    const message = err?.message || `Failed to invoke edge function '${functionName}'`;
    console.error(`[invokeEdgeFunction] ${functionName} failed:`, message);
    return {
      data: null,
      error: { message, name: 'EdgeFunctionError' },
    };
  }
}
