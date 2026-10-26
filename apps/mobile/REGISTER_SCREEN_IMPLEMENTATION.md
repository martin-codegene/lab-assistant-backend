# Register Screen Implementation - Complete

## Summary

Successfully created a complete registration screen that matches the design pattern of the login screen and integrates with the API service.

## Features Implemented

### 1. Two-Step Registration Flow

- **Step 1: User Information**
  - Full name input
  - Email address input
  - Validation for required fields and email format
- **Step 2: Password Creation**
  - Password input with show/hide toggle
  - Confirm password input with show/hide toggle
  - Password strength requirement (minimum 6 characters)
  - Password match validation

### 2. Design Consistency

- Matches login screen design pattern exactly
- Same color scheme and styling
- Smooth cross-fade animations between steps
- Entrance animations on mount
- Consistent icon set using SVG

### 3. API Integration

- Uses `api.register()` from the API service
- Sends registration data:
  - `email` (required)
  - `password` (required)
  - `name` (optional, but collected)
  - `role` (defaults to "RESEARCHER")
  - `plan` (defaults to "FREE")
- Integrates with AuthContext for state management
- Automatic navigation to main app on success

### 4. User Experience

- Back button on all steps
- Keyboard handling with KeyboardAvoidingView
- Auto-focus on next field
- Return key navigation between fields
- Loading states during registration
- Error messages with visual feedback
- Alert dialogs for critical errors
- "Sign in" link for existing users

### 5. Form Validation

- Name required
- Email required and format validation
- Password minimum length (6 characters)
- Password confirmation match
- Clear error messages for each validation

## Files Created/Modified

### Created

- `screens/register-screen.tsx` - Main registration screen component
- `app/(routes)/register.tsx` - Route wrapper for register screen

### Modified

- `screens/login-screen.tsx` - Added navigation to register screen from footer link

## API Integration Details

### Registration Request

```typescript
await api.register({
  email: string, // User's email address
  password: string, // User's password
  name: string, // User's full name
  role: "RESEARCHER", // Default role
  plan: "FREE", // Default plan
});
```

### Response Handling

- Success: User object and token stored in AuthContext
- Automatic navigation to `/(tabs)` on success
- Error: Display error message and alert dialog
- Loading state shown during API call

## User Flow

1. User clicks "Create one" on login screen
2. Navigate to register screen
3. Enter name and email → Click "Next"
4. Enter password and confirm password → Click "Create Account"
5. API call to register endpoint
6. On success: Navigate to main app
7. On error: Show error message and stay on form

## Design Elements

### Colors

- Background: `#fff` (white)
- Primary text: `#111` (near black)
- Secondary text: `#888` (gray)
- Input background: `#fafafa` (light gray)
- Input border: `#e5e5e5` (light gray)
- Button: `#111` (black)
- Error: `#D93535` (red)

### Typography

- Heading: 34px, weight 800
- Subheading: 15px, weight 400
- Input: 16px, weight 500
- Button: 16px, weight 700

### Spacing

- Container padding: 24px horizontal
- Input gap: 14px
- Form sections: 36px margin

## Validation Rules

1. **Name**: Required, cannot be empty
2. **Email**: Required, must contain "@"
3. **Password**: Required, minimum 6 characters
4. **Confirm Password**: Must match password exactly

## Error Messages

- "Enter your name."
- "Enter your email address."
- "Enter a valid email address."
- "Enter a password."
- "Password must be at least 6 characters."
- "Passwords do not match."

## Next Steps (Optional Enhancements)

- Add password strength indicator
- Add terms of service checkbox
- Add email verification flow
- Add social login options (Google, GitHub)
- Add profile picture upload during registration
- Add role selection (Researcher, Lab Manager, Admin)
- Add plan selection (Free, Pro, Enterprise)
