const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'x-swor-edge-version': '3.4'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // No body or invalid JSON — default to full health check
  }

  const action = (body.action as string) || 'full';

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const gatewayKey = Deno.env.get('GATEWAY_API_KEY');

  // Go-live action: returns only boolean presence indicators (no values)
  if (action === 'go_live') {
    const result = {
      success: true,
      version: '3.4',
      time: new Date().toISOString(),
      env: {
        supabaseUrlConfigured: !!supabaseUrl,
        supabaseAnonKeyConfigured: !!anonKey,
        supabaseServiceRoleConfigured: !!serviceRoleKey,
        resendConfigured: !!resendKey,
        gatewayConfigured: !!gatewayKey,
      },
      connectivity: {
        restApi: false,
        storageApi: false,
      }
    };

    // Quick connectivity test
    if (supabaseUrl && anonKey) {
      try {
        const resp = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'GET',
          headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
        });
        result.connectivity.restApi = resp.ok;
      } catch {
        // leave false
      }
    }

    if (supabaseUrl && serviceRoleKey) {
      try {
        const resp = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
          method: 'GET',
          headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` }
        });
        result.connectivity.storageApi = resp.ok;
      } catch {
        // leave false
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Full health check (original behavior)
  let urlHost = 'NOT_SET';
  let projectRef = 'UNKNOWN';

  if (supabaseUrl) {
    try {
      const parsed = new URL(supabaseUrl);
      urlHost = parsed.host;
      const hostParts = parsed.host.split('.');
      if (hostParts.length >= 3) {
        projectRef = hostParts[0];
      }
    } catch {
      urlHost = 'PARSE_ERROR';
    }
  }

  const result: Record<string, unknown> = {
    version: '3.4',
    timestamp: new Date().toISOString(),
    environment: {
      SUPABASE_URL_host: urlHost,
      project_ref: projectRef,
      expected_ref: 'lbweciluypxgmqcckfhu',
      ref_matches: projectRef === 'lbweciluypxgmqcckfhu',
      service_role_key_present: !!serviceRoleKey,
      service_role_key_length: serviceRoleKey?.length || 0,
      anon_key_present: !!anonKey,
      anon_key_length: anonKey?.length || 0,
      resend_api_key_present: !!resendKey,
      gateway_api_key_present: !!gatewayKey,
    },
    connectivity: {}
  };

  // Test REST API
  if (supabaseUrl && anonKey) {
    try {
      const restUrl = `${supabaseUrl}/rest/v1/`;
      const resp = await fetch(restUrl, {
        method: 'GET',
        headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
      });
      (result.connectivity as Record<string, unknown>).rest_api = { url: restUrl, status: resp.status, ok: resp.ok };
    } catch (e) {
      (result.connectivity as Record<string, unknown>).rest_api = { error: e.message };
    }
  }

  // Test Storage API
  if (supabaseUrl && serviceRoleKey) {
    try {
      const storageUrl = `${supabaseUrl}/storage/v1/bucket`;
      const resp = await fetch(storageUrl, {
        method: 'GET',
        headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` }
      });
      const respBody = await resp.text();
      (result.connectivity as Record<string, unknown>).storage_api = { url: storageUrl, status: resp.status, ok: resp.ok, body_preview: respBody.substring(0, 300) };
    } catch (e) {
      (result.connectivity as Record<string, unknown>).storage_api = { error: e.message };
    }
  }

  result.summary = {
    rest_ok: (result.connectivity as any).rest_api?.ok === true,
    storage_ok: (result.connectivity as any).storage_api?.ok === true,
    ready_for_uploads: (result.connectivity as any).rest_api?.ok === true && (result.connectivity as any).storage_api?.ok === true
  };

  return new Response(JSON.stringify(result, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
});
