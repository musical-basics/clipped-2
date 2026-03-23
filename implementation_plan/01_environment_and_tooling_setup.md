# Implementation Plan 01: Environment & Tooling Setup

> **Phase**: 1 — Environment & Tooling Setup  
> **Priority**: 🔴 Critical (Foundation)  
> **Estimated Effort**: ~2 hours

---

## Objective

Bootstrap the Expo/React Native project with all required dependencies, configure the build pipeline (Babel, NativeWind/Tailwind), and establish environment variables for Supabase and OpenAI.

---

## Steps

### 1.1 — Initialize Expo Project
```bash
npx create-expo-app@latest -t expo-template-blank-typescript ./
```
- Generates a clean TypeScript Expo project in the repo root.

### 1.2 — Install Expo Router & Core Dependencies
```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
```

### 1.3 — Configure `app.json`
- Set `"main": "expo-router/entry"` so Expo Router controls the entry point.
- Add a custom `"scheme"`: `"triagenotes"` for deep linking.

### 1.4 — Install Gesture & Animation Libraries
```bash
npx expo install react-native-reanimated react-native-gesture-handler @gorhom/bottom-sheet
```

### 1.5 — Configure Babel
- Edit `babel.config.js` to include `react-native-reanimated/plugin` as the **last** plugin in the array. This ordering is mandatory.

### 1.6 — Install & Configure NativeWind (Tailwind CSS)
```bash
npm install nativewind tailwindcss
npx tailwindcss init
```
- Update `tailwind.config.js`:
  ```js
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
  ]
  ```

### 1.7 — Create `.env` File
Create `.env` at the repo root with the following placeholder keys:
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_OPENAI_API_KEY=
```

> [!IMPORTANT]
> Do **not** commit real API keys. Add `.env` to `.gitignore`.

---

## Verification

- [ ] `npx expo start` launches the Metro bundler without errors.
- [ ] Babel config includes `react-native-reanimated/plugin` as the last plugin.
- [ ] `tailwind.config.js` exists and scans the correct directories.
- [ ] `.env` file exists with all three placeholder keys.

---

## Dependencies

- **Upstream**: None (this is the first plan).
- **Downstream**: Every subsequent plan depends on this environment being set up.
