/// <reference path="../types.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { action, paymentId, txid, userId, amount, memo, metadata } = body;
    
    // Get PI API Key from environment
    const PI_API_KEY = Deno.env.get("PI_API_KEY");
    
    if (!PI_API_KEY) {
      console.error("PI_API_KEY not configured in edge function secrets");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error", 
          details: "PI_API_KEY not configured" 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://vjkpkqajjohqisfzkxvp.supabase.co";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    let supabase: any = null;
    if (supabaseServiceKey) {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    }

    console.log(`[Pi Payment] Action: ${action}, PaymentId: ${paymentId}`);

    switch (action) {
      case "approve": {
        // Step 1: Approve the payment with Pi Network API
        // Reference: https://pi-apps.github.io/community-developer-guide/docs/piPayment/
        console.log(`[Pi Payment] Approving payment: ${paymentId}`);
        
        const approveResponse = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/approve`, {
          method: "POST",
          headers: {
            "Authorization": `Key ${PI_API_KEY}`,
            "Content-Type": "application/json",
          },
        });

        const responseText = await approveResponse.text();
        console.log(`[Pi Payment] Approve response status: ${approveResponse.status}`);
        console.log(`[Pi Payment] Approve response body: ${responseText}`);

        if (!approveResponse.ok) {
          console.error("[Pi Payment] Payment approval failed:", approveResponse.status, responseText);
          return new Response(
            JSON.stringify({ 
              error: "Payment approval failed", 
              status: approveResponse.status,
              details: responseText 
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let approvalData;
        try {
          approvalData = JSON.parse(responseText);
        } catch {
          approvalData = { raw: responseText };
        }
        
        console.log("[Pi Payment] Payment approved successfully:", approvalData);

        // Store payment record in database if supabase is available
        if (supabase && userId) {
          try {
            await supabase.from("ad_payments").upsert({
              payment_id: paymentId,
              user_id: userId,
              amount_pi: amount || 0,
              status: "approved",
              ad_id: metadata?.ad_id || null,
            }, { onConflict: "payment_id" });
          } catch (dbError) {
            console.warn("[Pi Payment] Could not store payment record:", dbError);
          }
        }

        return new Response(
          JSON.stringify({ success: true, payment: approvalData }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "complete": {
        // Step 2: Complete the payment after blockchain transaction
        if (!txid) {
          console.error("[Pi Payment] Missing transaction ID for completion");
          return new Response(
            JSON.stringify({ error: "Missing transaction ID (txid)" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[Pi Payment] Completing payment: ${paymentId} with txid: ${txid}`);

        const completeResponse = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/complete`, {
          method: "POST",
          headers: {
            "Authorization": `Key ${PI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ txid }),
        });

        const completeText = await completeResponse.text();
        console.log(`[Pi Payment] Complete response status: ${completeResponse.status}`);
        console.log(`[Pi Payment] Complete response body: ${completeText}`);

        if (!completeResponse.ok) {
          console.error("[Pi Payment] Payment completion failed:", completeResponse.status, completeText);
          return new Response(
            JSON.stringify({ 
              error: "Payment completion failed", 
              status: completeResponse.status,
              details: completeText 
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let completionData;
        try {
          completionData = JSON.parse(completeText);
        } catch {
          completionData = { raw: completeText };
        }
        
        console.log("[Pi Payment] Payment completed successfully:", completionData);

        // Update payment record in database
        if (supabase) {
          try {
            await supabase.from("ad_payments")
              .update({ 
                status: "completed", 
                txid: txid 
              })
              .eq("payment_id", paymentId);
          } catch (dbError) {
            console.warn("[Pi Payment] Could not update payment record:", dbError);
          }
        }

        return new Response(
          JSON.stringify({ success: true, payment: completionData }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "verify": {
        // Verify payment status by fetching from Pi API
        console.log(`[Pi Payment] Verifying payment: ${paymentId}`);
        
        const verifyResponse = await fetch(`${PI_API_URL}/v2/payments/${paymentId}`, {
          method: "GET",
          headers: {
            "Authorization": `Key ${PI_API_KEY}`,
          },
        });

        const verifyText = await verifyResponse.text();
        console.log(`[Pi Payment] Verify response status: ${verifyResponse.status}`);

        if (!verifyResponse.ok) {
          console.error("[Pi Payment] Payment verification failed:", verifyResponse.status, verifyText);
          return new Response(
            JSON.stringify({ 
              error: "Payment verification failed", 
              status: verifyResponse.status,
              details: verifyText 
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let paymentData;
        try {
          paymentData = JSON.parse(verifyText);
        } catch {
          paymentData = { raw: verifyText };
        }
        
        console.log("[Pi Payment] Payment verified:", paymentData);

        // Check payment status
        const isCompleted = paymentData.status?.developer_completed === true;
        const isApproved = paymentData.status?.developer_approved === true;

        return new Response(
          JSON.stringify({ 
            success: true, 
            status: isCompleted ? "completed" : (isApproved ? "approved" : "pending"),
            verified: isCompleted,
            payment: paymentData 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "cancel": {
        // Cancel an incomplete payment
        console.log(`[Pi Payment] Cancelling payment: ${paymentId}`);
        
        const cancelResponse = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/cancel`, {
          method: "POST",
          headers: {
            "Authorization": `Key ${PI_API_KEY}`,
            "Content-Type": "application/json",
          },
        });

        const cancelText = await cancelResponse.text();
        console.log(`[Pi Payment] Cancel response status: ${cancelResponse.status}`);

        if (!cancelResponse.ok) {
          console.error("[Pi Payment] Payment cancellation failed:", cancelResponse.status, cancelText);
          return new Response(
            JSON.stringify({ 
              error: "Payment cancellation failed", 
              status: cancelResponse.status,
              details: cancelText 
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("[Pi Payment] Payment cancelled successfully");

        // Update payment record in database
        if (supabase) {
          try {
            await supabase.from("ad_payments")
              .update({ status: "cancelled" })
              .eq("payment_id", paymentId);
          } catch (dbError) {
            console.warn("[Pi Payment] Could not update payment record:", dbError);
          }
        }

        return new Response(
          JSON.stringify({ success: true, cancelled: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "incomplete": {
        // Get list of incomplete payments for the app
        console.log("[Pi Payment] Fetching incomplete payments");
        
        const incompleteResponse = await fetch(`${PI_API_URL}/v2/payments/incomplete_server_payments`, {
          method: "GET",
          headers: {
            "Authorization": `Key ${PI_API_KEY}`,
          },
        });

        const incompleteText = await incompleteResponse.text();
        console.log(`[Pi Payment] Incomplete response status: ${incompleteResponse.status}`);

        if (!incompleteResponse.ok) {
          return new Response(
            JSON.stringify({ 
              error: "Failed to fetch incomplete payments", 
              details: incompleteText 
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let incompleteData;
        try {
          incompleteData = JSON.parse(incompleteText);
        } catch {
          incompleteData = { raw: incompleteText };
        }

        return new Response(
          JSON.stringify({ success: true, payments: incompleteData }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        console.error(`[Pi Payment] Invalid action: ${action}`);
        return new Response(
          JSON.stringify({ error: "Invalid action", validActions: ["approve", "complete", "verify", "cancel", "incomplete"] }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("[Pi Payment] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Payment processing failed",
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
