export default {
  expo: {
    name: "PickaFilm",
    slug: "pickafilm",
    version: "1.0.0",
    orientation: "portrait",
    // icon: "./assets/icon.png",          // ← comment out or remove
    userInterfaceStyle: "light",
    // splash: {                            // ← comment out or remove
    //   image: "./assets/splash.png",
    //   resizeMode: "contain",
    //   backgroundColor: "#ffffff"
    // },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.kynar.pickafilm"
    },
    android: {
      // adaptiveIcon: {                    // ← comment out or remove
      //   foregroundImage: "./assets/adaptive-icon.png",
      //   backgroundColor: "#ffffff"
      // },
      package: "com.yourcompany.pickafilm"
    },
    web: {
      // favicon: "./assets/favicon.png" // you can also comment this out if you don't have a favicon
    },
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      tmdbApiKey: process.env.TMDB_API_KEY
    }
  }
};