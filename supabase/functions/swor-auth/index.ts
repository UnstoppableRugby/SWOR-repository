import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERSION = "3.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getEnv(name: string) {
  return Deno.env.get(name);
}

function getProjectUrl() {
  return getEnv("PROJECT_URL") ?? getEnv("SUPABASE_URL");
}

function getServiceRoleKey() {
  return getEnv("SERVICE_ROLE_KEY") ?? getEnv("SUPABASE_SERVICE_ROLE_KEY");
}

function getAnonKey() {
  return getEnv("ANON_KEY") ?? getEnv("SUPABASE_ANON_KEY");
}

function getAdminClient() {
  const supabaseUrl = getProjectUrl();
  const serviceRoleKey = getServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing environment variables (PROJECT_URL / SERVICE_ROLE_KEY)");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function getUserClient(authHeader: string) {
  const supabaseUrl = getProjectUrl();
  const anonKey = getAnonKey();

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing environment variables (PROJECT_URL / ANON_KEY)");
  }

  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return json(405, { success: false, error: "Method not allowed", version: VERSION });
    }

    const body = await req.json().catch(() => ({}));
    const { action, email, redirect_url, callback_path } = body ?? {};

    if (action === "send_magic_link") {
      if (!email) {
        return json(400, { success: false, error: "Missing email", version: VERSION });
      }

      const supabase = getAdminClient();

      let finalRedirectUrl = redirect_url;

      if (callback_path !== undefined && redirect_url) {
        try {
          const urlObj = new URL(redirect_url);
          finalRedirectUrl = urlObj.origin + (callback_path || "/");
        } catch {
          finalRedirectUrl = redirect_url;
        }
      } else if (!redirect_url) {
        finalRedirectUrl = "https://www.smallworldofrugby.com/";
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: finalRedirectUrl },
      });

      if (error) {
        return json(400, { success: false, error: error.message, version: VERSION });
      }

      return json(200, {
        success: true,
        version: VERSION,
        redirect_to: finalRedirectUrl,
      });
    }

    if (action === "ensureprofile") {
      const authHeader = req.headers.get("Authorization");

      if (!authHeader?.startsWith("Bearer ")) {
        return json(401, { success: false, error: "Missing Authorization header", version: VERSION });
      }

      const admin = getAdminClient();
      const userClient = getUserClient(authHeader);

      const { data: userData, error: userError } = await userClient.auth.getUser();

      if (userError || !userData?.user) {
        return json(401, {
          success: false,
          error: userError?.message || "Unable to resolve authenticated user",
          version: VERSION,
        });
      }

      const authUser = userData.user;

      const { data: existingProfile, error: profileReadError } = await admin
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profileReadError) {
        return json(400, {
          success: false,
          error: profileReadError.message,
          stage: "read_profile",
          version: VERSION,
        });
      }

      if (existingProfile) {
        return json(200, {
          success: true,
          version: VERSION,
          profile: existingProfile,
          created: false,
        });
      }

      const newProfile = {
        id: authUser.id,
        email: authUser.email,
        full_name:
          authUser.user_metadata?.full_name ??
          authUser.user_metadata?.name ??
          "",
        user_type: "fan",
      };

      const { data: insertedProfile, error: insertError } = await admin
        .from("profiles")
        .insert(newProfile)
        .select("*")
        .single();

      if (insertError) {
        return json(400, {
          success: false,
          error: insertError.message,
          stage: "insert_profile",
          version: VERSION,
        });
      }

      return json(200, {
        success: true,
        version: VERSION,
        profile: insertedProfile,
        created: true,
      });
    }

    if (action === "verify_token") {
      const token = body?.token;
      if (!token) {
        return json(400, { success: false, error: "Missing token", version: VERSION });
      }

      const supabase = getAdminClient();

      const { data, error } = await supabase
        .from("auth_tokens")
        .select("user_id, expires_at")
        .eq("token", token)
        .single();

      if (error || !data) {
        return json(401, { success: false, error: "Invalid or expired token", version: VERSION });
      }

      if (new Date(data.expires_at) < new Date()) {
        return json(401, { success: false, error: "Token expired", version: VERSION });
      }

      return json(200, {
        success: true,
        user_id: data.user_id,
        version: VERSION,
      });
    }

    if (action === "validate_session") {
      return json(401, {
        success: false,
        error: "Custom session validation is not enabled in this function version",
        version: VERSION,
      });
    }

    if (action === "sign_out") {
      return json(200, {
        success: true,
        version: VERSION,
      });
    }

    return json(400, {
      success: false,
      error: `Invalid action: ${action}. Supported: send_magic_link, ensureprofile, verify_token, validate_session, sign_out`,
      version: VERSION,
    });
  } catch (err) {
    return json(500, {
      success: false,
      error: String(err),
      version: VERSION,
    });
  }
});
