import 'dotenv/config';

const GOOGLE_IOS_REVERSED_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_REVERSED_CLIENT_ID || 'com.googleusercontent.apps.791966352436-ds9guvagr07rk1fhr5dua5feob3i16vc';

export default ({ config }) => ({
  ...config,
  expo: {
    ...config.expo,
    name: "Solace",
    slug: "solace",
    version: "1.0.0",
    scheme: "solaceapp",
    orientation: "portrait",
    icon: "./assets/icon.png", // Make sure this asset exists
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png", // Make sure this asset exists
      resizeMode: "contain",
      backgroundColor: "#FDF8F6"
    },
    ios: {
      ...config.expo?.ios,
      supportsTablet: true,
      bundleIdentifier: "com.dorghaamhaidar.solace.iphone",
      buildNumber: "1",
      googleServicesFile: "./ios/GoogleService-Info.plist", // Correct path
      storeKitConfigurationPath: "./Product_StoreKit_Config.storekit",
      entitlements: {
        "com.apple.security.application-groups": [
          "group.com.dorghaamhaidar.solace.iphone.widget" // Shared group ID for widget data sharing
        ],
        "com.apple.developer.applesignin": ["Default"]
      },
    },
    android: {
      ...config.expo?.android,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.dorghaamhaidar.solace"
    },
    plugins: [
      "expo-dev-client",
      "expo-router",
      "expo-font",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
            buildSettings: {
              "Debug": {
                 "STOREKIT_CONFIGURATION_FILE_PATH": "$(SRCROOT)/Product_StoreKit_Config.storekit"
              }
            }
          }
        }
      ],
      [
        "@react-native-google-signin/google-signin",
        {
           "iosUrlScheme": GOOGLE_IOS_REVERSED_CLIENT_ID
        }
      ],
      "expo-apple-authentication"
    ],
    extra: {
      ...config.expo?.extra,
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "YOUR_EAS_PROJECT_ID_HERE"
      }
    }
  }
}); 