// Supabase Edge Function for Pi Network Authentication
// Verifies Pi access token via Pi API and creates/returns the corresponding DropShare user.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PI_API_URL = "https://api.minepi.com";

type PiMeResponse = {
  uid: string;
  username?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessToken } = await req.json().catch(() => ({}));

    if (!accessToken || typeof accessToken !== "string") {
      return new Response(JSON.stringify({ error: "Missing access token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Verify Pi access token (critical per Pi docs)
    const meResponse = await fetch(`${PI_API_URL}/v2/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!meResponse.ok) {
      const errorText = await meResponse.text();
      console.error("Pi /v2/me verification failed:", meResponse.status, errorText);
      return new Response(
        JSON.stringify({
          error: "Invalid Pi access token",
          details: `Pi API returned ${meResponse.status}`,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const piUserData: PiMeResponse = await meResponse.json();

    if (!piUserData?.uid) {
      return new Response(JSON.stringify({ error: "Invalid Pi user response" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedUsername = (piUserData.username || `Pioneer${piUserData.uid.slice(0, 8)}`).toLowerCase();

    // 2) Initialize admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing backend environment variables");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3) Find existing user
    // NOTE: For now we scan users (small apps OK). A future improvement is storing a pi_uid -> user_id mapping table.
    const { data: usersPage, error: listUsersError } = await supabase.auth.admin.listUsers();
    if (listUsersError) {
      console.error("Error listing users:", listUsersError);
    }

    const existingAuthUser = usersPage?.users?.find(
      (u) => u.user_metadata?.pi_uid === piUserData.uid
    );

    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", normalizedUsername)
      .maybeSingle();

    if (profileError) {
      console.error("Error checking profiles:", profileError);
    }

    let userId: string | undefined = existingAuthUser?.id || existingProfile?.user_id;
    let isNewUser = false;

    // 4) Create user if needed
    if (!userId) {
      isNewUser = true;

      const email = `${piUserData.uid}@pi.dropshare.app`;
      const randomPassword = crypto.randomUUID() + crypto.randomUUID();

      const { data: created, error: createUserError } = await supabase.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          pi_uid: piUserData.uid,
          pi_username: piUserData.username,
        },
      });

      if (createUserError || !created?.user?.id) {
        console.error("Error creating auth user:", createUserError);
        return new Response(
          JSON.stringify({
            error: "Failed to create user account",
            details: createUserError?.message || "Unknown error",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      userId = created.user.id;

      // Create profile (best effort)
      const { error: createProfileError } = await supabase.from("profiles").insert({
        user_id: userId,
        username: normalizedUsername,
        display_name: piUserData.username || `Pioneer ${piUserData.uid.slice(0, 8)}`,
        account_type: "shopper",
        bio: "Pi Network Pioneer",
      });

      if (createProfileError) {
        console.error("Error creating profile:", createProfileError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        isNewUser,
        piUser: {
          uid: piUserData.uid,
          username: piUserData.username,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Pi auth error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Authentication failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
