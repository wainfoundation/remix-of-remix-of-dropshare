# DropShare Edge Functions - External Supabase Setup

## Overview
These are the three edge functions needed for Pi Network integration in DropShare.
Deploy these to your Supabase project at `https://supabase.com/dashboard/project/vjkpkqajjohqisfzkxvp`

---

## 1. Required Secrets

First, add these secrets in your Supabase Dashboard → Settings → Edge Functions → Secrets:

| Secret Name | Description |
|------------|-------------|
| `PI_API_KEY` | Your Pi Network App API Key (from Pi Developer Portal) |
| `SUPABASE_URL` | `https://vjkpkqajjohqisfzkxvp.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |

---

## 2. Edge Function: `pi-auth`

**Purpose:** Authenticates Pi Network users and creates Supabase accounts

**File:** `supabase/functions/pi-auth/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PI_API_URL = "https://api.minepi.com";
// Your DropShare Pi Network API Key
const DROPSHARE_API_KEY = "2yvymas2njxzgemeilxs9z5fjbivxkfw0wbwfnqcgwzipjqakuykqyjc9djfeawr";

interface PiUserData {
  uid: string;
  username: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessToken, piUser } = await req.json();
    
    if (!accessToken) {
      console.error("Missing access token");
      return new Response(
        JSON.stringify({ error: "Missing access token" }),
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

    // Verify the access token with Pi API
    console.log("Verifying Pi access token...");
    const meResponse = await fetch(`${PI_API_URL}/v2/me`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-API-Key": DROPSHARE_API_KEY,
      },
    });

    if (!meResponse.ok) {
      const errorText = await meResponse.text();
      console.error("Pi API verification failed:", meResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Invalid Pi access token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const piUserData: PiUserData = await meResponse.json();
    console.log("Pi user verified:", piUserData.uid, piUserData.username);
    
    if (!piUserData.username) {
      piUserData.username = `Pioneer${piUserData.uid.slice(0, 8)}`;
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already exists
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", piUserData.username?.toLowerCase())
      .maybeSingle();

    if (profileError) {
      console.error("Error checking profile:", profileError);
    }

    let userId: string;
    let isNewUser = false;

    if (existingProfile) {
      console.log("Existing user found:", existingProfile.user_id);
      userId = existingProfile.user_id;
    } else {
      console.log("Creating new user for Pi uid:", piUserData.uid);
      isNewUser = true;

      const randomPassword = crypto.randomUUID() + crypto.randomUUID();
      const email = `${piUserData.uid}@pi.network`;

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          pi_uid: piUserData.uid,
          pi_username: piUserData.username,
        },
      });

      if (authError) {
        // Handle existing user case
        if (authError.code === 'email_exists') {
          const { data: existingUser } = await supabase
            .from("profiles")
            .select("user_id")
            .ilike("username", piUserData.username)
            .maybeSingle();
          
          if (existingUser) {
            userId = existingUser.user_id;
          } else {
            console.error("Error creating auth user:", authError);
            return new Response(
              JSON.stringify({ error: "Failed to create user account" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          console.error("Error creating auth user:", authError);
          return new Response(
            JSON.stringify({ error: "Failed to create user account" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        userId = authData.user.id;

        // Create profile
        const { error: createProfileError } = await supabase.from("profiles").insert({
          user_id: userId,
          username: piUserData.username.toLowerCase(),
          display_name: piUserData.username || `Pioneer ${piUserData.uid.slice(0, 8)}`,
          account_type: "shopper",
          bio: "Pi Network Pioneer",
        });

        if (createProfileError) {
          console.error("Error creating profile:", createProfileError);
        }
      }
    }

    // Generate magic link
    const { data: signInData, error: signInError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: `${piUserData.uid}@pi.network`,
      options: {
        redirectTo: "/",
      },
    });

    console.log("Authentication successful for user:", userId);

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        isNewUser,
        piUser: {
          uid: piUserData.uid,
          username: piUserData.username,
        },
        magicLink: signInData?.properties?.action_link,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Pi auth error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Authentication failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

## 3. Edge Function: `pi-payment`

**Purpose:** Handles Pi Network payment approval, completion, verification, and cancellation

**File:** `supabase/functions/pi-payment/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PI_API_URL = "https://api.minepi.com";

serve(async (req) => {
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing payment action: ${action}, paymentId: ${paymentId}`);

    switch (action) {
      case "approve": {
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
```

---

## 4. Edge Function: `pi-ads`

**Purpose:** Verifies Pi Network rewarded ad completions

**File:** `supabase/functions/pi-ads/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PI_API_URL = "https://api.minepi.com";

serve(async (req) => {
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
```

---

## 5. Deployment Commands

Run these in your terminal from the project root:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref vjkpkqajjohqisfzkxvp

# Deploy all edge functions
supabase functions deploy pi-auth --no-verify-jwt
supabase functions deploy pi-payment --no-verify-jwt
supabase functions deploy pi-ads --no-verify-jwt

# Set secrets
supabase secrets set PI_API_KEY=your_pi_api_key_here
```

---

## 6. Frontend Environment Variables

Update your frontend `.env` or `.env.local`:

```env
VITE_SUPABASE_URL=https://vjkpkqajjohqisfzkxvp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqa3BrcWFqam9ocWlzZnpreHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Mzc5NTgsImV4cCI6MjA4NDAxMzk1OH0.H8tzoj9fzEq9t5XDo1hGwuTY8CMDDE7_tawdGS0XIS0
VITE_SUPABASE_PROJECT_ID=vjkpkqajjohqisfzkxvp
```

---

## 7. Update Supabase Client

Modify `src/integrations/supabase/client.ts` to use your external Supabase:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://vjkpkqajjohqisfzkxvp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqa3BrcWFqam9ocWlzZnpreHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Mzc5NTgsImV4cCI6MjA4NDAxMzk1OH0.H8tzoj9fzEq9t5XDo1hGwuTY8CMDDE7_tawdGS0XIS0";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```

---

## Feature Status Checklist

### ✅ Complete Features
- [x] Pi Network Authentication (Sign in with Pi)
- [x] User Profiles (create, edit, view)
- [x] Posts (create, view, like, comment)
- [x] Reels (create, view, like, comment)
- [x] Stories (create, view, 24hr expiry)
- [x] Direct Messages
- [x] Notifications
- [x] Follow/Unfollow
- [x] Save Posts
- [x] Ad Management Dashboard
- [x] Ad Creation with Pi Payments
- [x] Pi Ad Network Integration
- [x] Analytics Dashboard
- [x] Theme Toggle (Dark/Light)

### 🔄 Enhancement Recommendations
1. **Push Notifications** - Web push for new messages/likes
2. **Image Cropping** - Before upload for posts/profiles
3. **Video Compression** - Optimize reel uploads
4. **Hashtag System** - Trending hashtags & discovery
5. **Search Users/Posts** - Full-text search
6. **Block/Report Users** - Safety features
7. **Live Streaming** - Pi Network powered
8. **Shop Integration** - E-commerce with Pi payments

---

## Security Notes

⚠️ **CRITICAL: Rotate your service_role key immediately!**
You shared it publicly. Go to Supabase Dashboard → Settings → API → Generate new keys.
