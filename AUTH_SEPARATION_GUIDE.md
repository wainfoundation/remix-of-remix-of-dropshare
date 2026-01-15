# Authentication Architecture - Separate Workflows

This document outlines the completely separate authentication workflows for Pi Network and Email authentication in DropShare.

## 🔗 Separate Authentication Systems

### 1. Pi Network Authentication
**File Structure:**
- `src/hooks/use-pi-auth.ts` - Pi Network authentication hook
- `src/components/auth/PiAuthComponent.tsx` - Standalone Pi auth component
- `src/integrations/pi/` - Pi Network SDK integration

**Features:**
- ✅ Independent Pi Network authentication
- ✅ Pi SDK initialization and management
- ✅ Pi user data stored in localStorage (separate from Supabase)
- ✅ Backend verification through Pi auth server
- ✅ No dependency on email authentication

**Storage Keys:**
```
pi_auth_token          - Pi authentication token
pi_user_info          - Pi user information
pi_authenticated      - Pi auth status flag
pi_supabase_user_id   - Reference to Supabase user (for profiles)
pi_username           - Pi username
```

### 2. Email Authentication
**File Structure:**
- `src/hooks/use-email-auth.ts` - Email authentication hook
- `src/components/auth/EmailAuthComponent.tsx` - Standalone email auth component

**Features:**
- ✅ Independent email/password authentication
- ✅ Google OAuth integration
- ✅ Automatic sign-up flow for new users
- ✅ Admin email detection (sibiyagaming@gmail.com)
- ✅ No dependency on Pi authentication

**Methods:**
- `signInWithEmail()` - Email/password sign in
- `signUpWithEmail()` - Email/password sign up
- `signInWithGoogle()` - Google OAuth
- `signOut()` - Email auth sign out

### 3. Central Auth Context
**File:** `src/contexts/AuthContext.tsx`

**Features:**
- ✅ Tracks which authentication method is active (`authMethod`: 'email' | 'pi' | null)
- ✅ Manages user profile data from Supabase
- ✅ Separate method handlers for Pi and email workflows
- ✅ Independent sign-out handling

## 🚀 Usage Examples

### Pi Authentication Only
```tsx
import { usePiAuth } from '@/hooks/use-pi-auth';

function PiLoginComponent() {
  const { authenticate, isLoading, error } = usePiAuth();
  
  const handlePiLogin = async () => {
    const result = await authenticate(['username', 'payments']);
    if (result.success) {
      // Handle successful Pi login
    }
  };
}
```

### Email Authentication Only
```tsx
import { useEmailAuth } from '@/hooks/use-email-auth';

function EmailLoginComponent() {
  const { signInWithEmail, isLoading, error } = useEmailAuth();
  
  const handleEmailLogin = async (email, password) => {
    const result = await signInWithEmail(email, password);
    if (result.success) {
      // Handle successful email login
    }
  };
}
```

### Combined in Login Page
The login page uses tabbed interface with completely separate workflows:
- **Pi Network Tab**: Uses `PiAuthComponent`
- **Admin Tab**: Uses dedicated admin email form
- Each tab operates independently

## 🔧 Easy Removal Guide

### To Remove Pi Authentication:
1. Delete files:
   - `src/hooks/use-pi-auth.ts`
   - `src/components/auth/PiAuthComponent.tsx`
   - `src/integrations/pi/` folder

2. Update `src/contexts/AuthContext.tsx`:
   - Remove `authMethod` tracking
   - Remove `signInWithPi` and `signUpWithPi` methods
   - Remove Pi localStorage cleanup in `signOut`

3. Update `src/pages/Login.tsx`:
   - Remove Pi tab
   - Remove `PiAuthComponent` import

### To Remove Email Authentication:
1. Delete files:
   - `src/hooks/use-email-auth.ts`
   - `src/components/auth/EmailAuthComponent.tsx`

2. Update `src/contexts/AuthContext.tsx`:
   - Remove `authMethod` tracking
   - Remove `signIn` and `signUp` methods
   - Remove Supabase auth state listening

3. Update `src/pages/Login.tsx`:
   - Remove email sections
   - Remove `EmailAuthComponent` import

## 🔐 Authentication Flow States

### Pi Authentication Flow:
1. Initialize Pi SDK
2. Call `authenticate()` with required scopes
3. Verify with Pi backend server
4. Store Pi auth data in localStorage
5. Update AuthContext with `authMethod: 'pi'`

### Email Authentication Flow:
1. Call `signInWithEmail()` or `signInWithGoogle()`
2. Supabase handles authentication
3. AuthContext receives session updates
4. Update AuthContext with `authMethod: 'email'`

### Sign Out Flows:
- **Pi Sign Out**: Clears localStorage, calls `logoutFromPi()`
- **Email Sign Out**: Calls `supabase.auth.signOut()`
- **Global Sign Out**: Detects `authMethod` and calls appropriate cleanup

## 📱 Login Page Structure

```
Login Page
├── Pi Network Tab
│   └── PiAuthComponent (completely independent)
└── Admin Tab
    └── Dedicated admin email form (separate instance)
```

Each authentication method has:
- ✅ Own error handling
- ✅ Own loading states
- ✅ Own success flows
- ✅ Own data storage
- ✅ Easy removal capability

## 🎯 Benefits

1. **Modularity**: Each auth system is self-contained
2. **Maintainability**: Easy to modify one without affecting the other
3. **Removability**: Simple to remove either system completely
4. **Testability**: Each system can be tested independently
5. **Scalability**: Easy to add new authentication methods

## 🔍 Key Differences from Previous Implementation

### Before (Mixed):
- Single authentication hook handled both Pi and email
- Shared error states and loading states
- Difficult to separate concerns
- Removal required extensive refactoring

### After (Separate):
- Dedicated hooks for each authentication method
- Independent error and loading states
- Clear separation of concerns
- Easy removal of either system

This architecture ensures that Pi Network and Email authentication are completely independent, making it easy to maintain, modify, or remove either system as needed.