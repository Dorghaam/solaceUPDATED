import 'dotenv/config';

const GOOGLE_IOS_REVERSED_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_REVERSED_CLIENT_ID || 'com.googleusercontent.apps.791966352436-ugqtn590d44kqa3uphtu4dgrk4vtkv8o';

export default ({ config }) => ({
  ...config,
  expo: {
    ...config.expo,
    name: "Solace",
    slug: "solace",
    version: "2.0.1",
    scheme: "solaceapp",
    orientation: "default",
    icon: "./Copy of Solace(4).png", // Updated to new app icon
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./Copy of Solace(4).png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
          ios: {
        ...config.expo?.ios,
        supportsTablet: false,
        isTabletOnly: false,
        requireFullScreen: true,
        bundleIdentifier: "com.dorghaamhaidar.solace.iphone",
        buildNumber: "18",
        googleServicesFile: "./ios/GoogleService-Info.plist", // Correct path
        storeKitConfigurationPath: "./Product_StoreKit_Config.storekit",
        entitlements: {
          "com.apple.security.application-groups": [
            "group.com.dorghaamhaidar.solace.iphone.widget"
          ],
          "com.apple.developer.applesignin": ["Default"]
        },
        infoPlist: {
          ...(config?.expo?.ios?.infoPlist || {}),
          UIDeviceFamily: [1], // iPhone only
        }
      },
    android: {
      ...config.expo?.android,
      adaptiveIcon: {
        foregroundImage: "./Copy of Solace(4).png",
        backgroundColor: "#ffffff" // Updated to match design
      },
      package: "com.dorghaamhaidar.solace"
    },
    plugins: [
      "expo-dev-client",
      "expo-router",
      "expo-font",
      "expo-notifications",
      "expo-localization",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
            buildSettings: {
              TARGETED_DEVICE_FAMILY: "1",
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
      GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      RC_API_KEY: process.env.EXPO_PUBLIC_RC_API_KEY,
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "3492a16b-5ccf-47a1-bbb5-e1ed0d2d1181"
      }
    }
  }
}); 