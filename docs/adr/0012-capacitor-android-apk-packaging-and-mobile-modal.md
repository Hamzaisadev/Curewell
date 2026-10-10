# 0012. Native Android APK Packaging (Capacitor) & Dual-Mode Mobile Companion UX

We decided to add native Android package (.APK) support via Capacitor alongside our PWA companion, and completely redesign the mobile companion modal with a dual-mode, accessible, and user-friendly UX.

## Context

Patients, doctors, and caregivers managing chronic conditions want to access Curewell on their smartphones.
Previously, clicking the "Phone App" button opened a dense modal with only a QR code pointing to `/companion` and asking users to "Add to Home Screen".
This caused friction:
1. **Expectation of a Real App**: Users expect a native Android installation file (`.apk`) that can be sideloaded and installed onto Android smartphones directly, with full offline dose tracking, local PIN lock, and zero app store delays.
2. **Modal Usability Issues**:
   - Technical jargon ("Include Instant Session Pairing", "Tactile dose tracker").
   - Opening on mobile showed an un-scannable QR code.
   - No distinction between installing a standalone APK vs launching an instant web app on iPhone / Android.
   - Missing direct PWA installation trigger (`beforeinstallprompt`).

## Decision

1. **Native Capacitor Android Project (`android/`)**:
   - Integrated `@capacitor/core`, `@capacitor/cli`, and `@capacitor/android` with `com.curewell.health`.
   - Added automated scripts to `package.json`:
     - `npm run build:apk`: Builds the web bundle, syncs with Capacitor, and outputs a standalone APK.
     - `npm run cap:sync`: Syncs web build assets to `android/app/src/main/assets/public`.
     - `npm run cap:open`: Opens the project directly in Android Studio.
   - Added cross-platform Node script `scripts/build-apk.mjs` to automate syncing and compilation.
   - Configured `.github/workflows/build-apk.yml` for automated cloud APK builds with zero local Android SDK installation required.

2. **Redesigned User-Friendly Mobile Modal (`MobileCompanionModal.tsx`)**:
   - **Tab 1: Android App (.APK)**:
     - Direct **Download Curewell.apk** button with versioning and file size indicator.
     - Clear 3-step installation guide: (1) Download file, (2) Allow unknown sources, (3) Install & open.
     - 1-click copyable build command (`npm run build:apk`) and cloud build explanation.
   - **Tab 2: Instant Web App (PWA)**:
     - Device-aware: Detects mobile devices and offers a 1-tap "Install App" button via native browser prompts instead of a QR code.
     - For desktop: Crisp QR code with a plain-English "Automatic Sign-In" toggle and separate iOS (Safari) vs Android (Chrome) shortcut guides.
     - Accessible backdrop dismissal, Escape key listener, and keyboard navigation.

## Consequences

- **Real Android App**: Users can now install an actual `.apk` on Android phones or use the instant PWA without downloads.
- **Zero Local SDK Hurdle**: Cloud GitHub Actions workflow enables building release APKs without installing 10GB of Android SDK locally.
- **Accessible, Human UX**: Replaced confusing technical jargon with actionable, guided installation steps for both iOS and Android.
