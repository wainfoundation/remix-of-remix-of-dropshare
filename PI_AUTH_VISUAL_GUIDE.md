# Pi Network Authentication - Visual Guide

## 1. Login Page Flow

```
┌─────────────────────────────────┐
│      Login Page (/login)        │
├─────────────────────────────────┤
│                                 │
│      DropShare Logo             │
│      "Sign in to continue"      │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🟠 Sign in with Pi Network │  │  ← Click here
│  └───────────────────────────┘  │
│                                 │
│  "Sign in automatically         │
│   creates your account"         │
│                                 │
└─────────────────────────────────┘
           │
           │ Pi SDK Auth
           ▼
    User confirms in Pi Browser
```

## 2. New User Flow

```
LOGIN SUCCESSFUL
    │
    ├─ Is new user? YES
    │    │
    │    └─ Show toast: "Welcome to DropShare!"
    │       │
    │       └─ Redirect to /signup
    │
    └─ SIGNUP PAGE
        │
        ├─ Pi Username: "john_doe" [READ-ONLY]
        ├─ Display Name: [_____________] (edit)
        ├─ Account Type: ○ Shopper ◉ Creator ○ Business
        │
        ├─ If Business selected:
        │   ├─ Store Name: [_____________]
        │   └─ Website: [_____________]
        │
        └─ Click "Continue"
           │
           └─ Profile saved
              Show toast: "Welcome to DropShare!"
              Redirect to HOME
```

## 3. Existing User Flow

```
LOGIN SUCCESSFUL
    │
    ├─ Is new user? NO
    │    │
    │    └─ Show toast: "Welcome back!"
    │       │
    │       └─ Redirect to / (HOME)
    │
    └─ PROFILE LOADED
        User browsing app
```

## 4. Backend Data Flow

```
Frontend                Backend                Database
────────────────────────────────────────────────────────

Pi SDK Auth
    │
    ├─ accessToken
    └─ piUser { uid, username }
         │
         └─► POST /pi-auth ────────┐
                                   │
                            ┌──────▼──────────────┐
                            │ Verify with Pi API  │
                            │ (uses API Key)      │
                            └──────┬──────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼ (existing)                  ▼ (new)
            ┌────────────────┐        ┌──────────────────┐
            │ Find profile   │        │ Create user:     │
            │ by username    │        │ - email: uid@... │
            └────────┬───────┘        │ - password: rnd  │
                     │                │ - confirmed: ✓   │
                     │                └────────┬─────────┘
                     │                         │
                     │                ┌────────▼──────────┐
                     │                │ Create profile:   │
                     │                │ - username: pi_un │
                     │                │ - account_type: ? │
                     │                └────────┬──────────┘
                     │                         │
                     └────────────┬────────────┘
                                  │
                          ┌───────▼──────────┐
                          │ Return response: │
                          │ - userId         │
                          │ - isNewUser      │
                          │ - success: true  │
                          └────────┬─────────┘
                                   │
                          Return to Frontend
```

## 5. Data Model

```
┌─────────────────────────────┐
│   Pi Network Account        │
├─────────────────────────────┤
│ uid: "abcd1234..."          │
│ username: "john_doe"        │
│ email: ?                    │
│ verified: true              │
└────────────┬────────────────┘
             │
             │ (verified with API Key)
             │
             ▼
┌─────────────────────────────┐
│   Supabase Auth User        │
├─────────────────────────────┤
│ id: "uuid-xxx-xxx"          │
│ email: "abcd1234@pi.network"│
│ password: "random-secure"   │
│ email_verified: true        │
│ metadata: {                 │
│   pi_uid: "abcd1234..."     │
│   pi_username: "john_doe"   │
│ }                           │
└────────────┬────────────────┘
             │
             │ (user_id)
             │
             ▼
┌─────────────────────────────┐
│   DropShare Profile         │
├─────────────────────────────┤
│ user_id: "uuid-xxx-xxx"     │
│ username: "john_doe"        │ ← Pi username
│ display_name: "John Doe"    │ ← Customizable
│ account_type: "creator"     │ ← Selectable
│ avatar_url: null            │
│ bio: "Pi Network Pioneer"   │
│ website_url: null           │
│ store_category: null        │
│ created_at: 2026-01-15      │
│ updated_at: 2026-01-15      │
└─────────────────────────────┘
```

## 6. State Management

### During Authentication

```
Step 1: Before Pi Auth
┌─────────────────┐
│ sdkReady: false │
│ piLoading: true │
└─────────────────┘

Step 2: After Pi Auth
┌──────────────────────┐
│ isAuthenticated: true │
│ user: {uid, username}│
│ isNewUser: true/false│
└──────────────────────┘

Step 3: LocalStorage
┌─────────────────────────────────┐
│ pi_auth_token: "..."            │
│ pi_user_info: "{...}"           │
│ pi_supabase_user_id: "..."      │
│ pi_username: "john_doe"         │
└─────────────────────────────────┘
```

## 7. Error Scenarios

```
Scenario 1: Invalid Pi Token
┌──────────────────┐
│ Pi API Returns   │
│ 401: Unauthorized│
└────────┬─────────┘
         │
    ┌────▼──────────────────┐
    │ Show toast:           │
    │ "Sign in failed. Try again"
    └───────────────────────┘

Scenario 2: Profile Creation Fails
┌──────────────────┐
│ DB Insert Error  │
└────────┬─────────┘
         │
    ┌────▼──────────────────┐
    │ Log error             │
    │ But allow auth        │
    │ (user can update      │
    │  profile later)       │
    └───────────────────────┘

Scenario 3: Network Error
┌──────────────────┐
│ Fetch fails      │
└────────┬─────────┘
         │
    ┌────▼──────────────────┐
    │ Show toast:           │
    │ "Network error.       │
    │  Please try again"    │
    └───────────────────────┘
```

## 8. Key Configuration

### API Key Usage

```
When: During Pi API verification
Where: supabase/functions/pi-auth/index.ts
Header: "X-API-Key": "2yvymas2njxzgemeilxs9z5fjbivxkfw0bwfnqcgwzipjqakuykqyjc9djfeawr"
Endpoint: https://api.minepi.com/v2/me
```

### Validation Key Usage

```
When: Payment verification (future)
Where: Payment processing functions
Purpose: Verify Pi Network payments
Key: 14171d43a16aebfb72ff8528ac2c1ff61c8405f2fa8649661dd735b25f819af24cc04d49ee88817bd4f18c511f35a2818b777779ce84d7704584ee36c519b56f
```

## 9. File Structure

```
src/
├── contexts/
│   └── AuthContext.tsx ...................... ✅ Updated (Pi methods)
│
├── hooks/
│   └── use-pi-auth.ts ....................... ✅ Updated (token handling)
│
├── integrations/
│   └── pi/
│       ├── init.ts .......................... ✅ Updated (API Key config)
│       ├── auth.ts .......................... ✅ Verified working
│       ├── payments.ts
│       └── adnetwork.ts
│
└── pages/
    ├── Login.tsx ............................ ✅ Updated (complete flow)
    └── Signup.tsx ........................... ✅ Updated (profile customization)

supabase/
└── functions/
    └── pi-auth/
        └── index.ts ......................... ✅ Updated (API Key integration)
```

---

**Color Code**:
- ✅ = Implemented and working
- 🟠 = Orange (Pi Network branding)
- 🔄 = Processing/Loading

---

Last Updated: January 15, 2026
