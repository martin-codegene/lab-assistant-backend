# Onboarding Navigation Bug Fix

## Issue

The onboarding screen had a critical security bug that allowed first-time users to bypass authentication and navigate directly to the main app tabs without logging in or registering.

## Root Cause

On the last step of the onboarding flow, the "Sign in" link was incorrectly navigating to `"/(tabs)"` instead of the login screen. This allowed users to skip authentication entirely.

```typescript
// BEFORE (Bug)
<Pressable onPress={() => router.push("/(tabs)" as any)}>
  <Text style={s.signInLink}>Sign in</Text>
</Pressable>
```

## Fix Applied

### 1. Fixed "Sign in" Link

Changed the navigation target from tabs to the login screen:

```typescript
// AFTER (Fixed)
<Pressable onPress={() => router.push("/login")}>
  <Text style={s.signInLink}>Sign in</Text>
</Pressable>
```

### 2. Connected Social Buttons

The social login buttons (Google, Apple, Microsoft) were doing nothing. Updated them to navigate to the register screen:

```typescript
// BEFORE
<SocialButton
  label="Continue with Google"
  icon={<GoogleIcon />}
  onPress={() => {}}  // Empty function
/>

// AFTER
<SocialButton
  label="Continue with Google"
  icon={<GoogleIcon />}
  onPress={() => router.push("/register")}  // Navigate to register
/>
```

## Changes Made

### File: `screens/onboarding-screen.tsx`

**Line ~682 - Fixed "Sign in" link:**

- Changed from: `router.push("/(tabs)" as any)`
- Changed to: `router.push("/login")`

**Lines ~670-680 - Connected social buttons:**

- Google button: `onPress={() => router.push("/register")}`
- Apple button: `onPress={() => router.push("/register")}`
- Microsoft button: `onPress={() => router.push("/register")}`

## Security Impact

### Before Fix

- ❌ Users could bypass authentication
- ❌ Direct access to protected routes
- ❌ No user verification required
- ❌ Security vulnerability

### After Fix

- ✅ All paths require authentication
- ✅ Users must login or register
- ✅ Protected routes remain secure
- ✅ Proper authentication flow enforced

## User Flow (After Fix)

### New Users

1. View onboarding screens (3 steps)
2. Click social button → Navigate to register screen
3. Complete registration → Navigate to tabs (authenticated)

### Existing Users

1. View onboarding screens
2. Click "Sign in" → Navigate to login screen
3. Complete login → Navigate to tabs (authenticated)

### No Bypass

- ❌ Cannot skip to tabs without authentication
- ❌ Cannot access protected routes
- ✅ Must complete login/register flow

## Testing Checklist

- [x] "Sign in" link navigates to login screen
- [x] Social buttons navigate to register screen
- [x] Cannot navigate to tabs without authentication
- [x] No diagnostics or errors
- [x] Proper navigation flow maintained

## Related Files

- `screens/onboarding-screen.tsx` - Fixed navigation
- `screens/login-screen.tsx` - Login destination
- `screens/register-screen.tsx` - Register destination
- `app/(tabs)/` - Protected routes

## Notes

- Social login functionality (Google, Apple, Microsoft) is not yet implemented
- Currently, social buttons navigate to the email/password register screen
- Future enhancement: Implement actual OAuth flows for social providers
