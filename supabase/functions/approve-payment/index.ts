/// <reference path="../types.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pi Network API base URL
const PI_API_URL = "https://api.minepi.com";

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { paymentId } = body;
    
    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: "Missing paymentId" }),
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

    console.log(`[Approve Payment] PaymentId: ${paymentId}`);

    // Call Pi Network API to approve payment
    // Reference: https://pi-apps.github.io/community-developer-guide/docs/piPayment/
    const approveResponse = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/approve`, {
      method: "POST",
      headers: {
        "Authorization": `Key ${PI_API_KEY}`,
        "Content-Type": "application/json",
        "X-Validation-Key": PI_VALIDATION_KEY
      },
      body: JSON.stringify({})
    });

    const approveData = await approveResponse.json();

    if (!approveResponse.ok) {
      console.error("Pi Network approve error:", approveData);
      return new Response(
        JSON.stringify({ 
          error: "Pi Network API error", 
          details: approveData.error_message || approveData.message || "Unknown error",
          pi_error_code: approveData.error_code
        }),
        { status: approveResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Approve Payment] Success for ${paymentId}:`, approveData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Payment approved successfully",
        payment: approveData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Approve payment error:", message);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});