import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pi Network API base URL
const PI_API_URL = "https://api.minepi.com";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { paymentId, txid, userId, amount, memo, metadata } = body;
    
    if (!paymentId || !txid) {
      return new Response(
        JSON.stringify({ error: "Missing paymentId or txid" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get PI API Key from environment
    const PI_API_KEY = Deno.env.get("PI_API_KEY");
    const PI_VALIDATION_KEY = Deno.env.get("PI_VALIDATION_KEY");
    
    if (!PI_API_KEY || !PI_VALIDATION_KEY) {
      console.error("PI_API_KEY or PI_VALIDATION_KEY not configured");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error", 
          details: "PI keys not configured" 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://vjkpkqajjohqisfzkxvp.supabase.co";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    let supabase = null;
    if (supabaseServiceKey) {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    }

    console.log(`[Complete Payment] PaymentId: ${paymentId}, TxId: ${txid}`);

    // Call Pi Network API to complete payment
    // Reference: https://pi-apps.github.io/community-developer-guide/docs/piPayment/
    const completeResponse = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/complete`, {
      method: "POST",
      headers: {
        "Authorization": `Key ${PI_API_KEY}`,
        "Content-Type": "application/json",
        "X-Validation-Key": PI_VALIDATION_KEY
      },
      body: JSON.stringify({
        txid: txid
      })
    });

    const completeData = await completeResponse.json();

    if (!completeResponse.ok) {
      console.error("Pi Network complete error:", completeData);
      return new Response(
        JSON.stringify({ 
          error: "Pi Network API error", 
          details: completeData.error_message || completeData.message || "Unknown error",
          pi_error_code: completeData.error_code
        }),
        { status: completeResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record payment in database if Supabase is available
    if (supabase && userId) {
      try {
        const { error: insertError } = await supabase
          .from('payments')
          .insert({
            payment_id: paymentId,
            user_id: userId,
            amount: amount || 0,
            currency: 'PI',
            status: 'completed',
            txid: txid,
            memo: memo,
            metadata: metadata,
            completed_at: new Date().toISOString()
          });

        if (insertError) {
          console.error("Error recording payment:", insertError);
        } else {
          console.log("Payment recorded successfully in database");
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
      }
    }

    console.log(`[Complete Payment] Success for ${paymentId}:`, completeData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Payment completed successfully",
        payment: completeData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Complete payment error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});