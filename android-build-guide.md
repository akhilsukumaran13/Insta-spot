# How to Build Android APK Locally

Since this is a web environment, we cannot generate an APK file directly for you to download. However, we have configured the project to support building an Android app using **Capacitor**.

**Update:** The app is now configured to run in **Standalone Mode**. This means it uses local storage on the device and does **not** require a backend server to be running on your computer. You can install the APK and use it anywhere!

## Prerequisites

1.  **Node.js** installed on your computer.
2.  **Android Studio** installed (for building the APK).

## Steps

1.  **Download the Code:**
    *   Download the project files to your local machine.

2.  **Install Dependencies:**
    *   Open a terminal in the project folder and run:
        ```bash
        npm install
        ```

3.  **Build the Web App:**
    *   Run the build command to generate the `dist` folder:
        ```bash
        npm run build
        ```

4.  **Initialize Android Platform:**
    *   Add the Android platform to your project:
        ```bash
        npx cap add android
        ```

5.  **Sync Capacitor:**
    *   Sync the web build with the Android project:
        ```bash
        npx cap sync
        ```

6.  **Open in Android Studio:**
    *   Open the Android project in Android Studio:
        ```bash
        npx cap open android
        ```

7.  **Build APK:**
    *   In Android Studio, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
    *   Once the build is complete, you can locate the APK file and transfer it to your mobile device.

## Alternative: Install as PWA

You can also install the app directly from the browser without building an APK:

1.  Deploy the app to a hosting service (like Vercel, Netlify, or Firebase).
2.  Open the deployed URL in Chrome on your Android device.
3.  Tap the **three dots** menu -> **Add to Home Screen** (or **Install App**).
4.  The app will be installed on your device and work like a native app.
