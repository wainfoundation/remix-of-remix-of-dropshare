import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { adId } = await req.json();
    
    if (!adId) {
      return new Response(
        JSON.stringify({ error: "Missing ad ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const PI_API_KEY = Deno.env.get("PI_API_KEY");
    if (!PI_API_KEY) {
      console.error("PI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Verifying rewarded ad:", adId);

    // Verify the rewarded ad status with Pi Platform API
    const verifyResponse = await fetch(`${PI_API_URL}/v2/ads/${adId}`, {
      headers: {
        "Authorization": `Key ${PI_API_KEY}`,
      },
    });

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error("Ad verification failed:", verifyResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Ad verification failed", mediator_ack_status: "denied" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adData = await verifyResponse.json();
    console.log("Ad verification response:", adData);

    // Check if the ad was properly watched and rewarded
    const isGranted = adData.mediator_ack_status === "granted";

    return new Response(
      JSON.stringify({ 
        success: true,
        mediator_ack_status: adData.mediator_ack_status,
        rewarded: isGranted,
        ad: adData
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Ad verification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Ad verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
