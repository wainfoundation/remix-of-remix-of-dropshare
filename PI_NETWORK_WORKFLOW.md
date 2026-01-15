# DropShare Pi Network Authentication Workflow

Complete explanation of the Pi Network authentication system in DropShare.

## 🔐 1. Login Page Flow

```
User Opens App
    ↓
Pi SDK Initializes (production mode)
    ↓
User sees Login Page (white/black DropShare title, sky blue button)
    ↓
User clicks "Sign in with Pi Network"
    ↓
Pi Browser opens authentication dialog
```

## 🔄 2. Authentication Process (5 Steps)

### Step 1: Pi SDK Initialization
```typescript
// In PiAuthComponent.tsx
await initPiSdk({ version: "2.0", sandbox: false });
// - Loads Pi SDK from https://sdk.minepi.com/pi-sdk.js
// - Initializes in production mode (not sandbox)
// - Sets sdkReady = true when complete
```

### Step 2: User Authenticates with Pi Network
```typescript
// When user clicks "Sign in with Pi Network" button
const piResult = await authenticateWithPi(["username", "payments"]);
// Returns:
{
  accessToken: "pi_access_token_xyz...",
  user: {
    uid: "user_unique_id",
    username: "pioneer_username"
  }
}
```

### Step 3: Validate Token with Pi API
```typescript
// Verify the access token is real and valid
const tokenValidation = await validatePiToken(piResult.accessToken);

// Makes request to: https://api.minepi.com/v2/me
// With header: Authorization: Bearer {accessToken}
// Returns verified user data from Pi Network
```

### Step 4: Backend Verification (Supabase Edge Function)
```typescript
// Send to backend for secure verification
const backendResult = await verifyPiAuthWithBackend(
  piResult.accessToken,
  tokenValidation.user
);

// Calls: /functions/v1/pi-auth (Supabase Edge Function)
// Backend does:
// 1. Verifies token again with Pi API
// 2. Checks if user exists in database
// 3. Creates new user if needed
// 4. Returns userId and isNewUser flag
```

### Step 5: Store Auth Data Locally
```typescript
// Save authentication state to localStorage
localStorage.setItem("pi_auth_token", piResult.accessToken);
localStorage.setItem("pi_user_info", JSON.stringify(piResult.user));
localStorage.setItem("pi_authenticated", "true");
localStorage.setItem("pi_token_validated", "true");
localStorage.setItem("pi_token_validation_time", Date.now().toString());
localStorage.setItem("pi_supabase_user_id", backendResult.userId);
localStorage.setItem("pi_username", piResult.user.username);
```

## 🧭 3. User Routing After Authentication

```
Authentication Success
    ↓
Check if isNewUser = true?
    ↓
    YES → Redirect to /signup (Profile Setup)
    ↓
    NO → Redirect to / (Home Page)
```

## 📝 4. Signup/Profile Setup Flow (New Users)

```
User redirected to /signup page
    ↓
User sees account type selection:
├─ Business (Share products with prices & links)
├─ Creator (Share content & grow audience)
└─ Shopper (Discover products & follow creators)
    ↓
User selects account type (e.g., Shopper - highlighted in blue)
    ↓
User clicks "Continue"
    ↓
User fills in profile details:
├─ Username (generated from Pi username)
├─ Display Name
├─ Website URL (optional)
└─ Store Category (for business)
    ↓
User clicks "Complete Profile"
    ↓
signUpWithPi() called:
├─ Updates profile in Supabase with details
├─ Sets account_type
├─ Stores in localStorage
└─ Updates AuthContext
    ↓
Redirect to / (Home Page)
```

## 🏗️ 5. Component Architecture

```
Login.tsx (Main Page)
│
├─ AppLogo (DropShare Logo)
├─ Title: "DropShare" (white/black text)
├─ Subtitle: "Powered by Pi Network"
│
├─ Card Component
│   ├─ CardHeader: "Welcome"
│   └─ CardContent:
│       └─ PiAuthComponent ← MAIN AUTH COMPONENT
│           │
│           ├─ usePiAuth() hook
│           │   ├─ authenticate() function
│           │   ├─ isLoading state
│           │   ├─ error state
│           │   └─ isAuthenticated state
│           │
│           ├─ Sky Blue Button
│           │   ├─ Text: "Sign in with Pi Network" (no icon)
│           │   └─ Calls handlePiSignIn()
│           │
│           └─ Error/Status messages
│
├─ Info Section
│   ├─ "Why Pi Network?"
│   ├─ Benefits list
│   └─ Link to learn more
│
└─ Footer
    └─ Terms & Privacy links
```

## 🎯 6. Authentication State Management

### useAuth() Context
```typescript
const { 
  user,              // Supabase user (null for Pi auth)
  profile,           // User profile data
  loading,           // Loading state
  authMethod,        // "pi" (only Pi now)
  signInWithPi,      // Function to sign in
  signUpWithPi,      // Function to complete profile
  signOut            // Function to sign out
} = useAuth();
```

### usePiAuth() Hook
```typescript
const {
  isAuthenticated,   // true/false Pi auth status
  user,              // Pi user data
  isLoading,         // Loading during auth
  error,             // Error message
  isNewUser,         // true if new account
  authenticate,      // Authenticate function
  logout,            // Logout function
  clearError         // Clear error message
} = usePiAuth();
```

## 📊 7. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Login Page → Click "Sign in with Pi Network" Button     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Pi Network SDK                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Pi Browser Authentication Dialog                         │  │
│  │  User approves access                                    │  │
│  │  Returns: accessToken + User Data                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Pi API Validation                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  validatePiToken(accessToken)                            │  │
│  │  → https://api.minepi.com/v2/me                          │  │
│  │  ← Verified user data from Pi Network                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│              Backend Verification (Supabase)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  POST /functions/v1/pi-auth                              │  │
│  │  - Verify token with Pi API again                        │  │
│  │  - Check if user exists in profiles table                │  │
│  │  - Create user if new                                    │  │
│  │  - Return userId + isNewUser flag                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Local Storage (Browser)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  pi_auth_token                                           │  │
│  │  pi_user_info                                            │  │
│  │  pi_authenticated = "true"                               │  │
│  │  pi_supabase_user_id                                     │  │
│  │  pi_username                                             │  │
│  │  pi_token_validated = "true"                             │  │
│  │  pi_token_validation_time = timestamp                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                    AuthContext Update                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  authMethod = "pi"                                       │  │
│  │  profile = { user_id, username, display_name, ... }     │  │
│  │  loading = false                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          ↓
                   Check isNewUser?
                    /            \
                   /              \
                YES                NO
                 │                  │
                 ↓                  ↓
            /signup           / (Home Page)
          Complete            User sees
          Profile             Dashboard
```

## 🚪 8. Sign Out Flow

```
User clicks "Sign Out"
    ↓
signOut() function called:
├─ Remove from localStorage:
│  ├─ pi_auth_token
│  ├─ pi_user_info
│  ├─ pi_authenticated
│  ├─ pi_supabase_user_id
│  ├─ pi_username
│  ├─ pi_token_validated
│  └─ pi_token_validation_time
│
├─ Update AuthContext:
│  ├─ user = null
│  ├─ profile = null
│  ├─ authMethod = null
│  └─ session = null
│
└─ Redirect to /login
```

## 🛡️ 9. Security Flow

```
Token Validation (3-Layer Security)
│
├─ Layer 1: Client-side validation
│  └─ validatePiToken() calls Pi API directly
│
├─ Layer 2: Backend verification
│  └─ Edge Function verifies token again with Pi API
│
└─ Layer 3: User existence check
   └─ Verify user is in database before proceeding
```

## ✨ 10. Key Features

| Feature | Details |
|---------|---------|
| ✅ One-Click Sign In | User opens Pi Browser, clicks approve, done |
| ✅ Auto Account Creation | New users get accounts automatically |
| ✅ Profile Completion | New users set up profile on /signup |
| ✅ Token Validation | Triple verification (client + backend + database) |
| ✅ Persistent Login | Auth state stored in localStorage |
| ✅ Clean Sign Out | All data cleared from device |
| ✅ Production Ready | Using Pi mainnet, not sandbox |
| ✅ No Passwords | Pure blockchain authentication |

## 📁 11. File Structure

```
src/
├── integrations/pi/
│   ├── init.ts              # Pi SDK initialization
│   ├── auth.ts              # Pi authentication logic
│   ├── payments.ts          # Pi payment integration
│   ├── adnetwork.ts         # Pi ad network integration
│   └── index.ts             # Exports all Pi integrations
│
├── hooks/
│   └── use-pi-auth.ts       # Pi authentication React hook
│
├── components/auth/
│   └── PiAuthComponent.tsx  # Standalone Pi auth UI component
│
├── contexts/
│   └── AuthContext.tsx      # Global auth state (Pi only)
│
└── pages/
    ├── Login.tsx            # Login page (Pi only)
    └── Signup.tsx           # Signup page (Pi only)

supabase/functions/
├── pi-auth/
│   └── index.ts             # Pi auth verification edge function
├── pi-payment/
│   └── index.ts             # Pi payment verification edge function
└── pi-ads/
    └── index.ts             # Pi ad verification edge function
```

## 🔑 12. API Configuration

```
API Key: 2yvymas2njxzgemeilxs9z5fjbivxkfw0wbwfnqcgwzipjqakuykqyjc9djfeawr
Validation Key: 14171d43a16aebfb72ff8528ac2c1ff61c8405f2fa8649661dd735b25f819af24cc04d49ee88817bd4f18c511f35a2818b777779ce84d7704584ee36c519b56f

Mode: Production (not sandbox)
SDK Version: 2.0
Pi API URL: https://api.minepi.com
```

## 📱 13. UI Elements

### Login Page
- **Logo**: DropShare app logo at top
- **Title**: "DropShare" (white/black text, no gradient)
- **Subtitle**: "Powered by Pi Network" (gray text)
- **Main Button**: Sky blue "Sign in with Pi Network" (no icon)
- **Info Section**: Benefits of Pi Network
- **Footer**: Terms & Privacy links

### Signup Page
- **Account Type Selection**: 3 options (Business, Creator, Shopper)
- **Profile Form**: Username, Display Name, Website URL, Store Category
- **Continue Button**: Sky blue, progresses through steps

## 🔍 14. LocalStorage Keys

| Key | Value | Purpose |
|-----|-------|---------|
| `pi_auth_token` | String | Pi access token for API calls |
| `pi_user_info` | JSON | Pi user data (uid, username) |
| `pi_authenticated` | "true" | Auth status flag |
| `pi_token_validated` | "true" | Token validation flag |
| `pi_token_validation_time` | Timestamp | When token was validated |
| `pi_supabase_user_id` | UUID | Supabase user ID |
| `pi_username` | String | Pi username |

## 🚀 15. Getting Started

### For New Users
1. Open DropShare in Pi Browser
2. Click "Sign in with Pi Network"
3. Approve in Pi authentication dialog
4. Complete profile setup on /signup
5. Start using DropShare

### For Returning Users
1. Open DropShare in Pi Browser
2. Click "Sign in with Pi Network"
3. Automatically signed in
4. Redirected to home page

### For Signing Out
1. Click account menu
2. Click "Sign Out"
3. All auth data cleared
4. Redirected to login page

## 📞 Support

For issues or questions about Pi Network authentication:
- Check browser console for error messages
- Verify Pi Browser is being used
- Ensure API keys are configured correctly
- Check Supabase Edge Functions are deployed

---

**Version**: 1.0  
**Last Updated**: January 15, 2026  
**Status**: Production Ready ✅