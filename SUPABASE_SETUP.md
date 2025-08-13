# Supabase Web3 Auth Integration Setup

## Overview

This app now uses Supabase Web3 authentication for secure wallet-based login. Users connect their Solana wallet and authenticate through Supabase to get a JWT token for API requests.

## Setup Steps

### 1. Environment Variables

Create a `.env` file in your project root with your Supabase credentials:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Supabase Project Configuration

1. Go to your Supabase project dashboard
2. Enable Web3 authentication in Authentication > Providers
3. Configure Solana as a Web3 provider
4. Set up your authentication policies

### 3. Database Schema

Ensure your database has the necessary tables for user profiles and wallet addresses.

## How It Works

### Authentication Flow

1. User connects wallet (Phantom on iOS, Mobile Wallet Adapter on Android)
2. App attempts Supabase Web3 authentication
3. If successful, user gets JWT token and profile data
4. If biometrics enabled, user must authenticate with biometrics
5. User is logged in and redirected to main app

### API Authentication

All API calls now use the Supabase JWT token in the Authorization header:

```typescript
import { authenticatedApiCall } from '@/utils/supabaseApi';

const response = await authenticatedApiCall('/api/protected-route', {
  method: 'POST',
  body: JSON.stringify(data),
});
```

## Key Changes Made

### WalletContext

- Added Supabase auth state management
- Integrated Web3 authentication with wallet connections
- Removed custom secure storage auth logic
- Added JWT token management

### AppContext

- Simplified auth checking (now handled by WalletContext)
- Removed complex custom auth logic
- Maintains biometric authentication integration

### Index Route

- Updated to work with Supabase auth flow
- Simplified routing logic
- Better error handling for auth failures

## Usage Examples

### Getting the Current User

```typescript
import { useWallet } from '@/contexts';

const { supabaseUser, supabaseSession } = useWallet();
```

### Making Authenticated API Calls

```typescript
import { authenticatedApiCall } from '@/utils/supabaseApi';

// Simple GET request
const response = await authenticatedApiCall('/api/user/profile');

// POST request with data
const response = await authenticatedApiCall('/api/user/update', {
  method: 'POST',
  body: JSON.stringify({ name: 'New Name' }),
});
```

### Checking Authentication Status

```typescript
import { isAuthenticated } from '@/utils/supabaseApi';

const authenticated = await isAuthenticated();
```

## Security Notes

- JWT tokens are automatically refreshed by Supabase
- Tokens are stored securely in AsyncStorage
- All API calls require valid JWT tokens
- Biometric authentication adds an extra security layer

## Troubleshooting

### Common Issues

1. **Missing environment variables**: Check your `.env` file
2. **Supabase connection errors**: Verify your project URL and anon key
3. **Authentication failures**: Ensure Web3 auth is enabled in Supabase
4. **JWT token issues**: Check if the user has proper permissions

### Debug Mode

Enable debug logging by checking the console for Supabase auth state changes and errors.

## Migration Notes

- Existing users will need to re-authenticate through the new Supabase flow
- User profiles are preserved and fetched using the Supabase user ID
- Backward compatibility is maintained for existing data structures
