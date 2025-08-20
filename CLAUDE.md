# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native Expo app for a trading/gaming platform called "Rekt" that includes:

- Solana wallet integration (Phantom on iOS, Mobile Wallet Adapter on Android)
- Supabase Web3 authentication
- Trading interface with long/short positions
- Mini-game with prediction mechanics
- User profiles and leaderboards
- Internationalization support (English, Spanish, Chinese, Arabic)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Platform-specific starts
npm run ios      # Start on iOS simulator
npm run android  # Start on Android emulator
npm run web      # Start web version

# Linting
npm run lint

# Build commands (EAS Build)
npm run build:dev:i    # iOS development build
npm run build:dev:a    # Android development build
npm run build:preview  # Preview builds for both platforms
npm run build:prod     # Production builds for both platforms
```

## Architecture

### File Structure

- **app/** - Expo Router file-based routing
  - **(tabs)/** - Tab navigation screens
  - **_layout.tsx** - Root layout with providers
- **components/** - Reusable UI components
  - **common/** - Base components (buttons, inputs, modals)
- **contexts/** - React contexts for state management
  - **AppContext** - Global app state and biometric auth
  - **WalletContext** - Wallet connection and Supabase auth
  - **SolanaContext** - Solana blockchain interactions
- **screens/** - Screen-specific components
- **hooks/** - Custom React hooks
- **utils/** - Utility functions and API helpers
- **constants/** - Theme, colors, and config
- **locales/** - i18n translation files

### Key Technologies

- **Expo SDK 53** with Expo Router for navigation
- **Solana Web3.js** for blockchain interactions
- **Supabase** for authentication and database
- **React Query** for data fetching
- **Styled Components** for styling
- **React Native Reanimated** for animations
- **i18next** for internationalization

### Authentication Flow

1. User connects Solana wallet (Phantom/Mobile Wallet Adapter)
2. Supabase Web3 authentication with wallet signature
3. JWT token stored for API requests
4. Optional biometric authentication layer
5. Session persistence with AsyncStorage

### State Management

- Contexts provide global state
- React Query handles server state
- AsyncStorage for persistence
- No Redux/MobX - uses Context API pattern

### Styling Approach

- Styled Components with theme provider
- Dark theme only (hardcoded in _layout.tsx)
- Custom fonts: Unbounded, Geist, Geist Mono
- Consistent color palette in constants/app-colors.ts

## Important Configuration

### Environment Variables

Required in `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=<supabase_url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase_key>
```

### TypeScript

- Strict mode enabled
- Path alias: `@/*` maps to root directory
- Type definitions in types/ directory

### Build Configuration

- EAS Build configured with development, preview, and production profiles
- Auto-increment version for production builds
- Internal distribution for dev/preview builds

## Platform-Specific Considerations

### iOS

- Phantom wallet integration
- Requires development build for wallet features
- Camera and biometric permissions needed

### Android

- Mobile Wallet Adapter Protocol
- APK builds for development/preview
- Requires crypto polyfills

### Web

- Limited functionality (no wallet integration)
- Primarily for development preview

## API Integration

All authenticated API calls use Supabase JWT:

```typescript
import { authenticatedApiCall } from '@/utils/supabaseApi';
```

Backend API endpoints managed in `utils/backendApi.ts`

## Testing Approach

No test framework currently configured. When implementing tests:

1. Check for existing test setup first
2. Consider Jest + React Native Testing Library
3. Verify with user before adding test dependencies
