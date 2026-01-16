// @ts-nocheck
// Edge Function: record-payment
// Activates or renews a user's monthly 10π subscription and restores their account_type

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { userId, plan, accountType } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: "Missing userId" }), { status: 400 });
    }

    // Only one plan for now
    const planId = plan || "monthly_20pi";
    const validTypes = ["business", "creator", "shopper"]; // shopper allowed but no-op
    if (accountType && !validTypes.includes(accountType)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid accountType" }), { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ success: false, error: "Missing service credentials" }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch current profile
    const { data: profile, error: fetchErr } = await supabase
      .from("profiles")
      .select("user_id, account_type, desired_account_type, subscription_expires_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!profile) {
      return new Response(JSON.stringify({ success: false, error: "Profile not found" }), { status: 404 });
    }

    const now = new Date();
    const currentExpiry = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
    // If already active, extend from current expiry; else from now
    const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(base.getTime());
    newExpiry.setDate(newExpiry.getDate() + 30);

    const nextType = accountType && accountType !== 'shopper'
      ? accountType
      : (profile.desired_account_type && profile.desired_account_type !== 'shopper' ? profile.desired_account_type : profile.account_type);

    // Ensure desired_account_type is set for paid tiers
    const desired = accountType && accountType !== 'shopper' ? accountType : (profile.desired_account_type || profile.account_type);

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        desired_account_type: desired,
        account_type: nextType,
        subscription_status: "active",
        subscription_plan: planId,
        subscription_expires_at: newExpiry.toISOString(),
        last_payment_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateErr) throw updateErr;

    return new Response(
      JSON.stringify({ success: true, plan: planId, expiresAt: newExpiry.toISOString(), accountType: nextType }),
      { status: 200 },
    );
  } catch (e) {
    console.error("record-payment error", e);
    return new Response(JSON.stringify({ success: false, error: e?.message || "Internal error" }), { status: 500 });
  }
});
