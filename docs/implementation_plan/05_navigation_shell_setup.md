# Implementation Plan 05: Navigation Shell Setup

> **Phase**: 5 — Navigation Shell Setup  
> **Priority**: 🟡 High  
> **Estimated Effort**: ~1.5 hours

---

## Objective

Build the app's navigation skeleton using Expo Router: a root stack layout, a bottom tab navigator with three tabs (Capture, Review, Vault), and a dynamic detail route for individual notes.

---

## Steps

### 5.1 — Create Root Layout

**File**: `app/_layout.tsx`

- Wrap the entire app in `<GestureHandlerRootView style={{ flex: 1 }}>`.
- Wrap inside `<BottomSheetModalProvider>` (from `@gorhom/bottom-sheet`).
- Define an Expo Router `<Stack>` for global navigation.
- Call `useAuth()` here to trigger anonymous auth on app load.

```tsx
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import { useAuth } from "../src/hooks/useAuth";

export default function RootLayout() {
  useAuth(); // triggers anonymous sign-in

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="note/[id]" options={{ title: "Note Detail" }} />
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
```

### 5.2 — Create Tab Layout

**File**: `app/(tabs)/_layout.tsx`

- Define a Bottom Tab Navigator with three tabs:
  - **Capture** (`index`) — the default/home tab.
  - **Review** (`review`) — the triage swipe screen.
  - **Vault** (`vault`) — the stored notes library.
- Set `headerShown: false` for all tabs.

```tsx
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Capture" }} />
      <Tabs.Screen name="review" options={{ title: "Review" }} />
      <Tabs.Screen name="vault" options={{ title: "Vault" }} />
    </Tabs>
  );
}
```

### 5.3 — Create Placeholder Tab Screens

Create three minimal placeholder screens to validate routing:

- **`app/(tabs)/index.tsx`** — `<Text>Capture Screen</Text>`
- **`app/(tabs)/review.tsx`** — `<Text>Review Screen</Text>`
- **`app/(tabs)/vault.tsx`** — `<Text>Vault Screen</Text>`

### 5.4 — Create Detail View Route

**File**: `app/note/[id].tsx`

- Use `useLocalSearchParams()` to extract the `id` param.
- Ensure the Stack header renders a back button by default.
- Minimal placeholder: display the note ID.

---

## Verification

- [ ] `npx expo start` launches and displays the bottom tab bar with 3 tabs.
- [ ] Tapping each tab renders the correct placeholder screen.
- [ ] Navigating to `/note/test-id` renders the detail view with the correct ID.
- [ ] No TypeScript errors: `npx tsc --noEmit`.

---

## Dependencies

- **Upstream**: Plan 01 (Expo Router & gesture libraries installed).
- **Downstream**: Plans 06, 07, 08 implement the actual screen content within these routes.
