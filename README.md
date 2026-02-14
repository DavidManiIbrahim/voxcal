
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
- **State**: React Context + AsyncStorage.
- **Services**:
  - `NotificationService`: Handles scheduling and permissions.
  - `VoiceService`: Text-to-Speech engine.
  - `StorageService`: Local persistence.
- **UI Components**: Custom Calendar Month view, Themed components.

## Permissions

The app requires permissions for:
- Notifications (to schedule alarms).
- Audio (to play sounds/voice).

Built with defined best practices for production reliability.
