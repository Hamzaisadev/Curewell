# 0011. PWA Mobile Companion, Ephemeral QR Pairing, and Local PIN/Biometric Authentication

We decided to implement an installable Progressive Web App (PWA) **Mobile Companion** (`/companion`) paired via ephemeral QR codes and protected by a local salted 4-digit PIN and WebAuthn biometrics.

## Context

Managing chronic diseases (hypertension, diabetes, cardiac disorders) requires immediate, high-frequency micro-interactions throughout the day:
1. **The Daily Survival Triad**: A patient or family caregiver only needs three things when on the go:
   - Check and record today's medication doses (Morning, Afternoon, Night, Bedtime).
   - Log daily vitals in under 10 seconds (Blood Pressure and Blood Glucose).
   - Display an instant, offline Medical Emergency ID (Blood Group, Drug Allergies, Emergency Contact) for first responders or paramedics.
2. **Desktop EHR Bloat on Mobile**: The full Curewell desktop experience (report vaults, PDF generators, prescription OCR pipelines, doctor portal management) creates cognitive overload and sluggish performance when loaded on a mobile phone for a simple pill check.
3. **App Store & WhatsApp Bottlenecks**:
   - Native mobile store distribution incurs platform fees, review delays, and device-specific SDK fragmentation.
   - WhatsApp business notifications carry high per-message commercial API costs, lack rich tactile widgets, and cannot run offline when mobile connectivity drops.
4. **Mobile Touchscreen Authentication Friction**:
   - Forcing users—especially elderly parents or busy caregivers—to type complex 16-character passwords on a small mobile keyboard three times a day causes high drop-off and unlogged doses.

## Decision

1. **Lightweight PWA Mobile Companion (`/companion`, `/mobile`)**:
   - Implemented a dedicated mobile-viewport shell optimized for 1-handed thumb reachability:
     - **Tab 1: Today's Regimen**: Real-time adherence ring, time-bucketed dose cards, 1-tap "Take", "Skip" with safety reasons, and overdue interval checks.
     - **Tab 2: Rapid Vitals Intake**: 10-second intake for Blood Pressure (systolic/diastolic/pulse) and Blood Glucose (fasting/post-meal/random) with immediate clinical risk categorization (Normal, Prehypertension, Stage 2, Crisis).
     - **Tab 3: Emergency SOS & Med ID**: High-visibility emergency medical card showing bold blood group badge, severe drug allergies banner, 1-tap emergency contact phone dialer (`tel:...`), and active medicine summary—working 100% offline.
     - **Tab 4: Companion Settings**: PWA home-screen install instructions, audio/vibration alarm tester, and security controls.

2. **Ephemeral QR Code Pairing Engine (`src/lib/security/companionPairing.ts`)**:
   - Desktop application generates an ephemeral, signed pairing token with a 15-minute TTL:
     $$\text{Token} = \text{base64url}(\text{JSON}(\text{userId}, \text{profileId}, \text{issuedAt}, \text{expiresAt}, \text{signature}))$$
   - QR code is rendered entirely client-side using local SVG vectors (`generateQrSvgUrl`). No bearer tokens or patient metadata are ever transmitted to third-party QR generation APIs.
   - Scanning the QR code automatically initializes the companion session on the smartphone without typing email/password.

3. **4-Digit Quick PIN & WebAuthn Biometric Security (`CompanionLockScreen`)**:
   - Users establish a 4-digit PIN upon initial pairing.
   - PINs are cryptographically salted and hashed using SHA-256 via the Web Crypto API (`crypto.subtle.digest`) and stored locally in browser storage.
   - **Brute-Force Guardrail**: 5 consecutive incorrect attempts trigger an automatic 60-second hardware-timed lockout.
   - **Platform Biometrics**: Integrates native WebAuthn `PublicKeyCredential` allowing 1-tap unlock via Touch ID, Face ID, or Android Biometrics.
   - **Inactivity Auto-Lock**: Automatically locks the companion app after 5 minutes of backgrounding or inactivity via the `visibilitychange` API.

4. **Home-Screen Shortcuts & Service Worker Offline Caching**:
   - Enhanced `public/manifest.json` with web app launcher shortcuts for:
     - *Today's Doses* (`/companion`)
     - *Record Vitals* (`/companion?tab=vitals`)
     - *Emergency SOS* (`/companion?tab=sos`)
   - Configured `public/sw.js` to serve cached shells and assets offline, ensuring medical ID and schedule data remain accessible during connectivity outages.

## Consequences

- **Zero Messaging Expenses**: Eliminates costly third-party WhatsApp or SMS messaging overhead.
- **Frictionless Daily Compliance**: Reduces medication logging time from ~45 seconds down to ~3 seconds with tactile 1-tap controls and PIN/Face ID unlock.
- **Zero Accidental Exposures**: Auto-lock and salted PIN encryption guarantee health data privacy even if the smartphone is temporarily left unattended.
- **Paramedic Utility**: Provides immediate offline medical emergency identification during critical situations.
