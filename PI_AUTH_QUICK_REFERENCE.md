# Pi Auth Quick Reference

## Credentials
```
API Key: 2yvymas2njxzgemeilxs9z5fjbivxkfw0wbwfnqcgwzipjqakuykqyjc9djfeawr
Validation Key: 14171d43a16aebfb72ff8528ac2c1ff61c8405f2fa8649661dd735b25f819af24cc04d49ee88817bd4f18c511f35a2818b777779ce84d7704584ee36c519b56f
```

## Key Implementation Points

### 1. Backend Verification (`supabase/functions/pi-auth/index.ts`)
- Uses Pi username directly (no `pi_` prefix)
- Verifies with Pi API using API Key
- Creates profile with Pi username as profile username
- Stores user metadata: `pi_uid` and `pi_username`

### 2. Frontend Flow
- **Login**: Authenticate → Auto sign in existing users / Redirect new users to signup
- **Signup**: Show Pi username (read-only) → Let user customize details → Save profile

### 3. Local Storage Keys
```typescript
localStorage.getItem("pi_auth_token")           // Access token
localStorage.getItem("pi_user_info")            // User data
localStorage.getItem("pi_supabase_user_id")     // Supabase user ID
localStorage.getItem("pi_username")             // Username for reference
```

### 4. AuthContext Methods
```typescript
await signInWithPi(userId)                      // Sign in existing user
await signUpWithPi(userId, username, displayName, accountType, websiteUrl?, storeCategory?)  // Create/update profile
```

## Files Changed Summary

| File | Changes |
|------|---------|
| `supabase/functions/pi-auth/index.ts` | Added API key, fixed username handling |
| `src/integrations/pi/init.ts` | Added API key to SDK config |
| `src/contexts/AuthContext.tsx` | Added Pi auth methods |
| `src/pages/Login.tsx` | Implemented Pi auth login flow |
| `src/pages/Signup.tsx` | Implemented Pi auth signup flow |
| `src/hooks/use-pi-auth.ts` | Cleaned up auth token handling |

## Testing Checklist
- [ ] Login page loads with Pi auth button
- [ ] Pi SDK initializes successfully
- [ ] Sign in creates profile for new users
- [ ] Signup page pre-fills Pi username
- [ ] Can customize display name and account type
- [ ] Profile saves correctly
- [ ] Logout clears all Pi tokens
- [ ] Returning users skip signup

## Common Issues & Solutions

### Pi SDK Not Loading
- Ensure running in Pi Browser or sandbox mode
- Check if `sandbox: true` in initPiSdk

### Profile Not Found After Auth
- Check Pi API Key is correct in backend
- Verify API Key format (should be 50+ chars)
- Check Pi user returned from /v2/me endpoint

### Username Conflicts
- Pi usernames are unique, no conflicts expected
- Profile username = Pi username (lowercase)

### Sign Up Redirect Issues
- Check localStorage for `pi_supabase_user_id`
- Verify backend returns correct userId
- Ensure signup page is accessible

---
Last Updated: January 15, 2026
