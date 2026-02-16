
# VoxCal - Voice Calendar & Alarm System

Production ready cross-platform mobile app combining Calendar, Alarm Clock, and Voice Reminders.

## Core Features

- **Clean Minimal Interface**: Daily, Weekly (month view with day list) calendar.
- **Smart Alarms**: System-level notifications that trigger even when app is closed.
- **Voice Reminders**: Spoken Text-to-Speech announcements for events.
- **Escalation Protocol**: Alarms automatically escalate (+5m, +15m) if ignored.
- **Offline First**: All data stored locally on device.
- **Dark Mode**: Fully supported with adaptive UI.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the app:
   ```bash
   npx expo start
   ```

3. Run on device:
   - Scan the QR code with Expo Go (Android/iOS).
   - Or run `npm run android` / `npm run ios`.

## Architecture

- **Framework**: React Native (Expo).
- **Navigation**: Expo Router (File-based routing).
- **State**: React Context + Firestore + AsyncStorage.
- **Services**:
  - `NotificationService`: Handles scheduling and permissions.
  - `VoiceService`: Text-to-Speech engine.
  - `StorageService`: Local persistence.
  - `FirebaseService`: Cloud Database (Events).
- **UI Components**: Custom Calendar Month view, Themed components.

## Configuration

Create a `.env.local` file with your Firebase configuration:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_k
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_d
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_msg_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Permissions

The app requires permissions for:
- Notifications (to schedule alarms).
- Audio (to play sounds/voice).

Built with defined best practices for production reliability.
