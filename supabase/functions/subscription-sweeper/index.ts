// @ts-nocheck
// Edge Function: subscription-sweeper
// Downgrades expired subscriptions to shopper and marks status expired

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ success: false, error: "Missing service credentials" }), { status: 500 });
    }
    const supabase = createClient(supabaseUrl, serviceKey);

    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update({ account_type: 'shopper', subscription_status: 'expired' })
      .lt('subscription_expires_at', nowIso)
      .in('account_type', ['business','creator'])
      .select('user_id');

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, downgraded: data?.length || 0 }), { status: 200 });
  } catch (e) {
    console.error('subscription-sweeper error', e);
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Internal error' }), { status: 500 });
  }
});
