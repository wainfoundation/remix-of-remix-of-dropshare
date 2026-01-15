import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PI_API_URL = "https://api.minepi.com";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, paymentId, txid } = await req.json();
    
    const PI_API_KEY = Deno.env.get("PI_API_KEY");

    if (!PI_API_KEY) {
      console.error("PI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!PI_API_KEY) {
      console.error("PI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing payment action: ${action}, paymentId: ${paymentId}`);

    switch (action) {
      case "approve": {
        // Approve the payment with Pi API
        const approveResponse = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/approve`, {
          method: "POST",
          headers: {
            "Authorization": `Key ${PI_API_KEY}`,
            "Content-Type": "application/json",
          },
        });

        if (!approveResponse.ok) {
          const errorText = await approveResponse.text();
          console.error("Payment approval failed:", approveResponse.status, errorText);
          return new Response(
            JSON.stringify({ error: "Payment approval failed", details: errorText }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const approvalData = await approveResponse.json();
        console.log("Payment approved:", approvalData);

        return new Response(
          JSON.stringify({ success: true, payment: approvalData }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "complete": {
        if (!txid) {
          return new Response(
            JSON.stringify({ error: "Missing transaction ID" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Complete the payment with Pi API
        const completeResponse = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/complete`, {
          method: "POST",
          headers: {
            "Authorization": `Key ${PI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ txid }),
        });

        if (!completeResponse.ok) {
          const errorText = await completeResponse.text();
          console.error("Payment completion failed:", completeResponse.status, errorText);
          return new Response(
            JSON.stringify({ error: "Payment completion failed", details: errorText }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const completionData = await completeResponse.json();
        console.log("Payment completed:", completionData);

        return new Response(
          JSON.stringify({ success: true, payment: completionData }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "verify": {
        // Get payment details from Pi API
        const verifyResponse = await fetch(`${PI_API_URL}/v2/payments/${paymentId}`, {
          headers: {
            "Authorization": `Key ${PI_API_KEY}`,
          },
        });

        if (!verifyResponse.ok) {
          const errorText = await verifyResponse.text();
          console.error("Payment verification failed:", verifyResponse.status, errorText);
          return new Response(
            JSON.stringify({ error: "Payment verification failed", details: errorText }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const paymentData = await verifyResponse.json();
        console.log("Payment verified:", paymentData);

        return new Response(
          JSON.stringify({ 
            success: true, 
            status: paymentData.status?.developer_completed ? "verified" : "pending",
            payment: paymentData 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "cancel": {
        // Cancel the payment with Pi API
        const cancelResponse = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/cancel`, {
          method: "POST",
          headers: {
            "Authorization": `Key ${PI_API_KEY}`,
            "Content-Type": "application/json",
          },
        });

        if (!cancelResponse.ok) {
          const errorText = await cancelResponse.text();
          console.error("Payment cancellation failed:", cancelResponse.status, errorText);
          return new Response(
            JSON.stringify({ error: "Payment cancellation failed", details: errorText }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("Payment cancelled:", paymentId);

        return new Response(
          JSON.stringify({ success: true, cancelled: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Payment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Payment processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
