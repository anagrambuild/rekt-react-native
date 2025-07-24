// Default (development) settings
let name = 'rekt-react-native';
let slug = 'rekt-react-native';
let owner = 'anagram-xyz';
let version = '0.0.1';
let easProjectId = 'f2f64b1c-eebc-4198-a0f9-644866b3100e';
let icon = './assets/images/icon.png';
let androidIcon = './assets/images/adaptive-icon.png';
let packageName = 'com.anagramxyz.rektreactnative';
let bundleIdentifier = 'com.anagramxyz.rektreactnative';
let scheme = 'rektreactnative';
let env = 'development';
let solanaNetwork = 'solana:devnet';

// Preview settings
if (process.env.DEPLOY_ENVIRONMENT === 'preview') {
  name = 'Rekt Preview';
  slug = 'rekt-react-native';
  version = '0.0.1';
  //   easProjectId = 'PREVIEW_PROJECT_ID'; // Optional: Only if you want a separate project in Expo dashboard
  icon = './assets/images/mock-pngs/liam.png';
  androidIcon = './assets/images/mock-pngs/liam.png';
  packageName = 'com.anagramxyz.rektreactnativepreview';
  bundleIdentifier = 'com.anagramxyz.rektreactnativepreview';
  scheme = 'rektreactnativepreview';
  env = 'preview';
  solanaNetwork = 'solana:devnet';
}

// Example: override for production
if (process.env.DEPLOY_ENVIRONMENT === 'production') {
  // name = 'rekt-prod';
  // slug = 'rekt-prod';
  // owner = 'anagram-xyz';
  // version = '1.0.0';
  // easProjectId = '...';
  // icon = './assets/images/prod-icon.png';
  // androidIcon = './assets/images/prod-adaptive-icon.png';
  // packageName = 'com.anagramxyz.rektreactnativeprod';
  // bundleIdentifier = 'com.anagramxyz.rektreactnativeprod';
  // scheme = 'rektreactnativeprod';
  env = 'production';
  solanaNetwork = 'solana:mainnet-beta';
}

module.exports = {
  expo: {
    name,
    slug,
    owner,
    version,
    orientation: 'portrait',
    icon,
    scheme,
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    // Add EAS Updates configuration
    updates: {
      url: `https://u.expo.dev/${easProjectId}`,
    },
    runtimeVersion: {
      policy: 'sdkVersion',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        LSApplicationQueriesSchemes: [
          'phantom',
          'solflare',
          'backpack',
          'exodus',
          'trust',
          'coinbase',
          'metamask',
        ],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: androidIcon,
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      package: packageName,
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-localization',
      'expo-video',
      [
        'expo-image-picker',
        {
          photosPermission:
            'This app needs access to your photo library to let you select and share profile pictures.',
          cameraPermission:
            'This app needs access to your camera to let you take profile pictures.',
          microphonePermission:
            'This app needs access to your microphone for video recording features.',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera',
          microphonePermission:
            'Allow $(PRODUCT_NAME) to access your microphone',
          recordAudioAndroid: true,
        },
      ],
      [
        'expo-local-authentication',
        {
          faceIDPermission: 'Allow $(PRODUCT_NAME) to use Face ID for secure authentication.',
        },
      ],
    ],
    splash: {
      backgroundColor: '#000000',
    },
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: easProjectId,
      },
      env,
      solanaNetwork,
    },
  },
};
