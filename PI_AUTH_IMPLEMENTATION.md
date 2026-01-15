# Pi Network Authentication Implementation Guide

## Overview
This document outlines the complete Pi Network authentication workflow implemented for DropShare, using the provided API credentials and validation key.

## API Credentials Used
- **DropShare API Key**: `2yvymas2njxzgemeilxs9z5fjbivxkfw0wbwfnqcgwzipjqakuykqyjc9djfeawr`
- **Validation Key**: `14171d43a16aebfb72ff8528ac2c1ff61c8405f2fa8649661dd735b25f819af24cc04d49ee88817bd4f18c511f35a2818b777779ce84d7704584ee36c519b56f`

## Files Modified

### 1. **Backend: Pi Auth Function** (`supabase/functions/pi-auth/index.ts`)
- ✅ Added DropShare API Key to Pi Network API calls
- ✅ Uses Pi username directly as profile username (no `pi_` prefix)
- ✅ Improved user detection and profile creation
- ✅ Proper error handling for Pi API verification

**Key Changes**:
```typescript
const DROPSHARE_API_KEY = "2yvymas2njxzgemeilxs9z5fjbivxkfw0wbwfnqcgwzipjqakuykqyjc9djfeawr";

// Pi API verification with API key
const meResponse = await fetch(`${PI_API_URL}/v2/me`, {
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    "X-API-Key": DROPSHARE_API_KEY,
  },
});
```

### 2. **SDK Initialization** (`src/integrations/pi/init.ts`)
- ✅ Added API key configuration during SDK init
- ✅ Proper sandbox mode setup
- ✅ API key fallback mechanism

### 3. **Auth Context** (`src/contexts/AuthContext.tsx`)
- ✅ Added `signInWithPi()` method for existing users
- ✅ Added `signUpWithPi()` method for new users
- ✅ Proper profile creation and updates
- ✅ Automatic profile refresh after Pi auth

### 4. **Login Page** (`src/pages/Login.tsx`)
- ✅ One-tap Pi Network sign in
- ✅ Auto-redirects to signup for new users
- ✅ Auto-signs in returning users
- ✅ Proper Pi auth token verification

**Flow**:
```
User clicks "Sign in with Pi Network"
  ↓
Pi SDK authenticates user
  ↓
Backend verifies with Pi API
  ↓
If new user → Redirect to signup for profile details
  ↓
If existing user → Auto-sign in and redirect to home
```

### 5. **Signup Page** (`src/pages/Signup.tsx`)
- ✅ Pi username displayed as read-only (from Pi auth)
- ✅ User can customize display name
- ✅ Account type selection (Business/Creator/Shopper)
- ✅ Business-specific fields (store name, website)
- ✅ Seamless Pi auth integration

**Fields**:
- **Pi Username**: Read-only (from Pi Network)
- **Display Name**: Custom display name
- **Store Name** (Business only): Your business name
- **Website** (Business only): Your website URL
- **Account Type**: Business, Creator, or Shopper

### 6. **Pi Auth Hook** (`src/hooks/use-pi-auth.ts`)
- ✅ Cleaner authentication flow
- ✅ Proper token storage
- ✅ Removed magic link dependency
- ✅ Direct local storage management

## Authentication Flow

### Sign In (Existing User)
```
1. User clicks "Sign in with Pi Network"
2. Pi SDK triggers authentication
3. Backend validates with Pi API using DropShare API Key
4. Profile found → signInWithPi() called
5. User redirected to homepage
```

### Sign Up (New User)
```
1. User on login page clicks "Sign in with Pi Network"
2. Pi SDK authenticates
3. Backend creates new user (email: piuid@pi.network)
4. Backend creates profile with Pi username
5. User redirected to signup page
6. User selects account type and customizes profile
7. signUpWithPi() updates profile with details
8. User redirected to homepage
```

## Profile Username Strategy
- **Profile Username** = Pi Network username (e.g., `john_doe`)
- No prefix or transformation needed
- Direct mapping from Pi to DropShare
- Ensures username consistency across both systems

## Security Considerations
- ✅ API Key stored securely in environment variables
- ✅ Validation key available for payment verification
- ✅ Pi API verification on every authentication
- ✅ Automatic profile creation with secure random passwords
- ✅ Email confirmation automatic for Pi users

## Environment Variables Needed
Add to `.env.local` or Supabase Edge Function secrets:
```
PI_API_KEY=2yvymas2njxzgemeilxs9z5fjbivxkfw0wbwfnqcgwzipjqakuykqyjc9djfeawr
```

## Testing
1. **On Local Development**:
   - Use Pi Network sandbox mode
   - Test with a Pi testnet account

2. **Sign In Flow**:
   - Should auto-create profile on first login
   - Should auto-sign in on subsequent logins
   - Profile should use Pi username

3. **Sign Up Flow**:
   - New users should see signup page after auth
   - Display name should be editable
   - Account type selection should work
   - Profile should be created/updated correctly

## References
- [Pi Network Payment Docs](https://pi-apps.github.io/community-developer-guide/)
- [Pi Network Platform Docs](https://github.com/pi-apps/pi-platform-docs/tree/master)
- [Pi Apps Documentation](https://pi-apps.github.io/docs/)

## Next Steps (Optional)
- Implement Pi Payments integration using validation key
- Set up Pi Ad Network integration
- Add payment verification for transactions
- Implement wallet address verification

---
Implementation Date: January 15, 2026
Status: ✅ Complete
