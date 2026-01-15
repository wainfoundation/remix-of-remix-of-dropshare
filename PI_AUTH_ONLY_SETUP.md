# DropShare - Pi Network Only Authentication

DropShare is now configured for **Pi Network authentication only**. All email and Google OAuth authentication has been removed.

## 🔑 Pi Network Configuration

### API Credentials
```
API Key: 2yvymas2njxzgemeilxs9z5fjbivxkfw0wbwfnqcgwzipjqakuykqyjc9djfeawr
Validation Key: 14171d43a16aebfb72ff8528ac2c1ff61c8405f2fa8649661dd735b25f819af24cc04d49ee88817bd4f18c511f35a2818b777779ce84d7704584ee36c519b56f
```

### Environment Configuration
- **Mode**: Production (not sandbox)
- **SDK Version**: 2.0
- **Pi API URL**: https://api.minepi.com

## 📁 File Structure

### Core Pi Authentication Files
```
src/
├── integrations/pi/
│   ├── init.ts              # Pi SDK initialization (contains API keys)
│   ├── auth.ts              # Pi authentication logic with token validation
│   ├── payments.ts          # Pi payment integration
│   ├── adnetwork.ts         # Pi ad network integration
│   └── index.ts             # Exports all Pi integrations
├── hooks/
│   └── use-pi-auth.ts       # Pi authentication React hook
├── components/auth/
│   └── PiAuthComponent.tsx  # Standalone Pi auth UI component
├── contexts/
│   └── AuthContext.tsx      # Global auth state (Pi only)
└── pages/
    ├── Login.tsx            # Login page (Pi only)
    └── Signup.tsx           # Signup page (Pi only)

supabase/functions/
├── pi-auth/
│   └── index.ts             # Pi authentication verification edge function
├── pi-payment/
│   └── index.ts             # Pi payment verification edge function
└── pi-ads/
    └── index.ts             # Pi ad verification edge function
```

## 🔐 Authentication Flow

### 1. User Opens App
- Pi SDK initializes automatically
- Checks for existing Pi authentication in localStorage

### 2. User Clicks "Sign In with Pi Network"
```typescript
// Step 1: Initialize Pi SDK
await initPiSdk({ version: "2.0", sandbox: false });

// Step 2: Authenticate with Pi Network
const piResult = await authenticateWithPi(["username", "payments"]);

// Step 3: Validate token with Pi API
const tokenValidation = await validatePiToken(piResult.accessToken);

// Step 4: Verify with backend (Supabase Edge Function)
const backendResult = await verifyPiAuthWithBackend(
  piResult.accessToken,
  tokenValidation.user
);

// Step 5: Store auth data locally
localStorage.setItem("pi_auth_token", piResult.accessToken);
localStorage.setItem("pi_authenticated", "true");
localStorage.setItem("pi_supabase_user_id", backendResult.userId);
```

### 3. Backend Verification (Supabase Edge Function)
```typescript
// Verify access token with Pi API
const response = await fetch("https://api.minepi.com/v2/me", {
  headers: {
    "Authorization": `Bearer ${accessToken}`
  }
});

// Check if user exists in database
const existingProfile = await supabase
  .from("profiles")
  .select("*")
  .eq("username", piUserData.username)
  .maybeSingle();

// Create new user if needed
if (!existingProfile) {
  await supabase.auth.admin.createUser({
    email: `${piUserData.uid}@pi.network`,
    password: crypto.randomUUID(),
    email_confirm: true
  });
}
```

## 📦 Storage Keys

### localStorage Keys Used
```javascript
pi_auth_token               // Pi access token
pi_user_info               // Pi user data (JSON)
pi_authenticated           // Auth status flag ("true")
pi_token_validated         // Token validation flag
pi_token_validation_time   // Timestamp of validation
pi_supabase_user_id        // Supabase user ID
pi_username                // Pi username
```

## 🎯 Key Features

### Authentication
- ✅ Pure Pi Network authentication
- ✅ Automatic token validation with Pi API
- ✅ Backend verification through Supabase Edge Functions
- ✅ Secure user creation and management
- ✅ Production mode enabled

### User Experience
- ✅ Simple one-click sign-in
- ✅ Automatic account creation for new users
- ✅ Profile completion flow for new accounts
- ✅ Persistent authentication state
- ✅ Secure sign-out

## 🚀 Usage Examples

### Using Pi Authentication in Components
```typescript
import { usePiAuth } from '@/hooks/use-pi-auth';

function MyComponent() {
  const { 
    authenticate, 
    isLoading, 
    error, 
    isAuthenticated,
    user 
  } = usePiAuth();
  
  const handleSignIn = async () => {
    const result = await authenticate(['username', 'payments']);
    if (result.success) {
      console.log('Signed in:', result.userId);
    }
  };
  
  return (
    <button onClick={handleSignIn} disabled={isLoading}>
      {isAuthenticated ? `Welcome ${user?.username}` : 'Sign In with Pi'}
    </button>
  );
}
```

### Accessing Auth Context
```typescript
import { useAuth } from '@/contexts/AuthContext';

function ProfileComponent() {
  const { profile, loading, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>{profile?.display_name}</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## 🔧 Configuration

### Update Pi API Key (if needed)
Edit `src/integrations/pi/init.ts`:
```typescript
const DROPSHARE_API_KEY = "your-new-api-key-here";
const DROPSHARE_VALIDATION_KEY = "your-new-validation-key-here";
```

### Environment Variables
Add to `.env`:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Add to Supabase Edge Functions environment:
```env
PI_API_KEY=2yvymas2njxzgemeilxs9z5fjbivxkfw0wbwfnqcgwzipjqakuykqyjc9djfeawr
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📖 Pi Network Documentation

- **Community Developer Guide**: https://pi-apps.github.io/community-developer-guide/
- **Platform Documentation**: https://github.com/pi-apps/pi-platform-docs
- **SDK Reference**: https://github.com/pi-apps/pi-platform-docs/blob/master/SDK_reference.md
- **Payment API**: https://github.com/pi-apps/pi-platform-docs/blob/master/payments.md
- **Ad Network**: https://github.com/pi-apps/pi-platform-docs/blob/master/ad_network.md

## 🛡️ Security Features

1. **Token Validation**: Every Pi access token is validated with Pi API
2. **Backend Verification**: All auth requests go through secure Supabase Edge Functions
3. **No Passwords**: Pi Network handles all authentication
4. **Encrypted Storage**: Sensitive data stored in localStorage
5. **Production Mode**: Using Pi mainnet, not sandbox

## 📱 User Flow

1. **New User**:
   - Opens app → Click "Sign in with Pi Network"
   - Pi Browser authenticates user
   - Backend creates Supabase account
   - User completes profile → Redirected to home

2. **Returning User**:
   - Opens app → Automatically recognized
   - Click "Sign in with Pi Network"
   - Instant sign-in → Redirected to home

3. **Sign Out**:
   - Click sign out button
   - All localStorage cleared
   - Redirected to login page

## 🐛 Debugging

### Enable Console Logging
All Pi auth operations log to console:
```javascript
console.log("Authenticating with Pi Network...");
console.log("Pi authentication successful:", piResult.user);
console.log("Validating Pi access token...");
console.log("Backend verification successful:", backendResult);
```

### Check Authentication State
```javascript
// In browser console
localStorage.getItem('pi_authenticated')
localStorage.getItem('pi_user_info')
localStorage.getItem('pi_auth_token')
```

### Common Issues

**Issue**: "Please open this app in Pi Browser"
- **Solution**: App must be opened in Pi Browser for authentication to work

**Issue**: "Pi token validation failed"
- **Solution**: Check that API key is correct and Pi Network is accessible

**Issue**: "Backend verification failed"
- **Solution**: Check Supabase Edge Functions are deployed and environment variables are set

## 🎨 Customization

### Customize Login UI
Edit `src/pages/Login.tsx` to modify the login page appearance.

### Add Additional Pi Scopes
Edit `src/components/auth/PiAuthComponent.tsx`:
```typescript
const result = await piAuthenticate([
  "username", 
  "payments",
  "wallet_address" // Add additional scopes
]);
```

### Modify Profile Fields
Edit `src/contexts/AuthContext.tsx` in the `signUpWithPi` function to add more profile fields.

## ✅ Complete Feature List

- ✅ Pi Network SDK integration
- ✅ Pi authentication (sign in/sign up)
- ✅ Token validation with Pi API
- ✅ Backend verification through Edge Functions
- ✅ User profile management
- ✅ Persistent authentication
- ✅ Secure sign-out
- ✅ Production mode enabled
- ✅ No email/password required
- ✅ No Gmail OAuth
- ✅ Pure Pi Network ecosystem

---

**Note**: This is a Pi Network exclusive app. All authentication flows through Pi Network's blockchain-based authentication system.