/// <reference path="../types.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-dropshare-key, x-validation-key",
};

// DropShare API credentials (from environment)
const DROPSHARE_API_KEY = Deno.env.get("DROPSHARE_API_KEY") || "2yvymas2njxzgemeilxs9z5fjbivxkfw0wbwfnqcgwzipjqakuykqyjc9djfeawr";
const DROPSHARE_VALIDATION_KEY = Deno.env.get("DROPSHARE_VALIDATION_KEY") || "14171d43a16aebfb72ff8528ac2c1ff61c8405f2fa8649661dd735b25f819af24cc04d49ee88817bd4f18c511f35a2818b777779ce84d7704584ee36c519b56f";

// Validate the signature using HMAC-SHA256
async function validateSignature(payload: string, signature: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const keyData = encoder.encode(DROPSHARE_VALIDATION_KEY);
    
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    
    return expectedSignature === signature;
  } catch (error) {
    console.error("Signature validation error:", error);
    return false;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Route handlers
    if (path === "/dropshare-api/verify") {
      // Verify DropShare API Key and validation key
      if (req.method !== "POST") {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { apiKey, validationKey } = await req.json();

      // Validate both keys
      const isValidApiKey = apiKey === DROPSHARE_API_KEY;
      const isValidValidationKey = validationKey === DROPSHARE_VALIDATION_KEY;

      if (!isValidApiKey || !isValidValidationKey) {
        console.warn("Invalid DropShare credentials provided");
        return new Response(
          JSON.stringify({ 
            verified: false,
            error: "Invalid API key or validation key"
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          verified: true,
          message: "DropShare API credentials verified",
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get API status
    if (path === "/dropshare-api/status") {
      if (req.method !== "GET") {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if API key is configured
      const apiKeyConfigured = !!Deno.env.get("DROPSHARE_API_KEY");
      const validationKeyConfigured = !!Deno.env.get("DROPSHARE_VALIDATION_KEY");

      return new Response(
        JSON.stringify({
          status: "active",
          apiKeyConfigured,
          validationKeyConfigured,
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sign payload with validation key
    if (path === "/dropshare-api/sign") {
      if (req.method !== "POST") {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { payload } = await req.json();
      if (!payload) {
        return new Response(
          JSON.stringify({ error: "Missing payload" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Sign the payload
      const encoder = new TextEncoder();
      const data = encoder.encode(payload);
      const keyData = encoder.encode(DROPSHARE_VALIDATION_KEY);
      
      const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      
      const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);
      const signature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

      return new Response(
        JSON.stringify({
          payload,
          signature,
          algorithm: "HMAC-SHA256"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log DropShare transaction
    if (path === "/dropshare-api/log-transaction") {
      if (req.method !== "POST") {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { userId, amount, description, metadata, signature } = await req.json();

      // Validate signature if provided
      if (signature) {
        const payload = JSON.stringify({ userId, amount, description, metadata });
        const isValid = await validateSignature(payload, signature);
        
        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Invalid signature" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Log transaction to database
      try {
        const { data, error } = await supabase
          .from("dropshare_transactions")
          .insert({
            user_id: userId,
            amount: amount || 0,
            description: description || "DropShare transaction",
            metadata: metadata || {},
            verified: !!signature,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error("Error logging transaction:", error);
          return new Response(
            JSON.stringify({ error: "Failed to log transaction" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            transactionId: data?.[0]?.id,
            message: "Transaction logged successfully"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Transaction logging error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to log transaction" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get DropShare API info
    if (path === "/dropshare-api/info") {
      return new Response(
        JSON.stringify({
          name: "DropShare API Integration",
          version: "1.0.0",
          description: "Manages DropShare API key and validation",
          endpoints: {
            "/dropshare-api/verify": "POST - Verify API credentials",
            "/dropshare-api/status": "GET - Check API status",
            "/dropshare-api/sign": "POST - Sign payload with validation key",
            "/dropshare-api/log-transaction": "POST - Log transaction"
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 404 - Not found
    return new Response(
      JSON.stringify({ error: "Endpoint not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("DropShare API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
