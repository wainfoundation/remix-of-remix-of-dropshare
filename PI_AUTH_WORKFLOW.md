# Pi Network Authentication Flow Diagram

## Complete Sign In/Sign Up Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOGIN PAGE (/login)                                  │
│                     User clicks: "Sign in with Pi Network"                    │
└──────────────────────────────────────────────┬──────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PI SDK INITIALIZATION                                │
│                                                                               │
│  - Load Pi SDK script (sdk.minepi.com/pi-sdk.js)                             │
│  - Initialize with sandbox mode                                              │
│  - Register DropShare API Key                                                │
└──────────────────────────────────────────────┬──────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      WINDOW.PI.AUTHENTICATE()                                │
│                                                                               │
│  - Request scopes: ["username", "payments"]                                  │
│  - Return: { accessToken, user: { uid, username } }                          │
└──────────────────────────────────────────────┬──────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              BACKEND: /functions/v1/pi-auth (Edge Function)                  │
│                                                                               │
│  POST /functions/v1/pi-auth                                                  │
│  {                                                                            │
│    "accessToken": "...",                                                     │
│    "piUser": { "uid": "...", "username": "..." }                             │
│  }                                                                            │
└──────────────────────────────────────────────┬──────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     VERIFY WITH PI API (/v2/me)                              │
│                                                                               │
│  fetch(`https://api.minepi.com/v2/me`, {                                     │
│    headers: {                                                                │
│      "Authorization": "Bearer {accessToken}",                                │
│      "X-API-Key": "2yvymas2njxzgemeilxs9z5fjbivxkfw0bwfnqcgwzipjqakuykqyjc9dj...│
│    }                                                                          │
│  })                                                                           │
│                                                                               │
│  ✓ Token valid → Continue                                                    │
│  ✗ Token invalid → Return error                                              │
└──────────────────────────────────────────────┬──────────────────────────────┘
                                                │
                              ┌─────────────────┴──────────────┐
                              │                                │
                              ▼                                ▼
                        ┌──────────┐                    ┌────────────┐
                        │ EXISTING │                    │  NEW USER  │
                        │  USER    │                    │            │
                        └─────┬────┘                    └──────┬─────┘
                              │                               │
                              ▼                               ▼
                    ┌──────────────────┐          ┌─────────────────────┐
                    │ Sign In & Store  │          │ Create Supabase     │
                    │ Auth Data in     │          │ User & Profile      │
                    │ Supabase Auth    │          │                     │
                    │                  │          │ Email: uid@pi.net   │
                    │ localStorage:    │          │ Password: Random    │
                    │ - pi_auth_token  │          │ Email confirmed: ✓  │
                    │ - pi_user_info   │          │                     │
                    │ - pi_supabase_id │          │ Profile created:    │
                    └────────┬─────────┘          │ - username: Pi name │
                             │                    │ - display_name: Pi  │
                             │                    │ - account_type: ??  │
                             │                    │ - bio: Pi Network.. │
                             │                    └──────────┬──────────┘
                             │                              │
                             └──────────────┬───────────────┘
                                            │
                                            ▼
                        ┌───────────────────────────────────┐
                        │   FRONTEND: usePiAuth Hook        │
                        │                                   │
                        │  - Store tokens locally           │
                        │  - Set isAuthenticated: true      │
                        │  - Set isNewUser: true/false      │
                        │  - Return { success, isNewUser }  │
                        └───────────────┬───────────────────┘
                                        │
                              ┌─────────┴──────────┐
                              │                    │
                        ┌─────▼──────┐      ┌────▼──────────┐
                        │  EXISTING   │      │   NEW USER    │
                        │  isNewUser  │      │   isNewUser   │
                        │  = false    │      │   = true      │
                        └─────┬───────┘      └────┬──────────┘
                              │                   │
                              ▼                   ▼
                    ┌──────────────────┐  ┌────────────────────┐
                    │  Login Page:     │  │  Login Page:       │
                    │  signInWithPi()  │  │  Toast: Welcome!   │
                    │  called          │  │  navigate('/signup')
                    │                  │  │                    │
                    │  navigate('/')   │  └────────┬───────────┘
                    │  Home Page       │           │
                    └──────────────────┘           ▼
                                         ┌──────────────────────────┐
                                         │  SIGNUP PAGE (/signup)   │
                                         │                          │
                                         │  Display:                │
                                         │  - Pi Username (R/O)     │
                                         │  - Display Name (Edit)   │
                                         │  - Account Type Select   │
                                         │  - Extra Fields (Biz)    │
                                         │                          │
                                         │  User customizes:        │
                                         │  - Display name          │
                                         │  - Account type          │
                                         │  - Store name (optional) │
                                         │  - Website (optional)    │
                                         │                          │
                                         │  signUpWithPi() saves    │
                                         └────────┬─────────────────┘
                                                  │
                                                  ▼
                                         ┌──────────────────────────┐
                                         │  Update Profile in DB    │
                                         │                          │
                                         │  - username: Pi username │
                                         │  - display_name: Custom  │
                                         │  - account_type: Selected│
                                         │  - website_url: Optional │
                                         │  - store_category: Biz   │
                                         └────────┬─────────────────┘
                                                  │
                                                  ▼
                                         ┌──────────────────────────┐
                                         │  Profile Complete!       │
                                         │  navigate('/')           │
                                         │  HOME PAGE               │
                                         └──────────────────────────┘
```

## Key Data Structures

### Pi API Response
```typescript
{
  uid: string,           // Unique Pi ID
  username: string,      // Pi Network username
  access_token: string   // Access token for future calls
}
```

### Supabase User Created
```typescript
{
  email: "{uid}@pi.network",
  user_metadata: {
    pi_uid: string,
    pi_username: string
  }
}
```

### Profile Created/Updated
```typescript
{
  user_id: string,                    // Supabase user ID
  username: string,                   // = pi_username (lowercase)
  display_name: string,               // User's custom display name
  account_type: 'business' | 'creator' | 'shopper',
  bio: string | null,                 // "Pi Network Pioneer"
  avatar_url: string | null,
  website_url: string | null,         // Business URL
  store_category: string | null,      // Business category
  created_at: timestamp,
  updated_at: timestamp
}
```

## Local Storage State Management

```
After Pi Authentication:
├─ pi_auth_token: "{accessToken}"
├─ pi_user_info: "{uid, username, ...}"
├─ pi_supabase_user_id: "{userId}"
└─ pi_username: "{username}"

After Sign Out:
└─ All keys cleared
```

## Error Handling Flow

```
Any Step Fails:
    │
    ├─ Backend verification fails
    │   └─ Return error from /v2/me
    │       └─ Show toast: "Sign in failed. Please try again."
    │
    ├─ Profile creation fails
    │   └─ Log error but continue (user created successfully)
    │
    ├─ Profile update fails
    │   └─ User manually needs to update profile
    │
    └─ Network error
        └─ Show toast: "Network error. Please try again."
```

---

## Quick Reference: Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/functions/v1/pi-auth` | POST | Verify Pi token & create/sign in user |
| `https://api.minepi.com/v2/me` | GET | Verify Pi access token |
| `/auth/v1/signup` | POST | Create Supabase user |
| `/auth/v1/verify` | GET | Verify OTP token |
| `/rest/v1/profiles` | GET/INSERT/UPDATE | Manage user profiles |

---

Implementation: January 15, 2026
Status: ✅ Ready for Testing
