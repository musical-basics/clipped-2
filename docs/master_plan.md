SYSTEM INSTRUCTIONS FOR AI AGENT:
You are an expert React Native, Expo, and Full-Stack TypeScript engineer. Execute the following 60-step implementation plan to build "TriageNotes". Complete them sequentially. Do not skip steps. Use strict TypeScript, react-native-reanimated for all animations, and Supabase for the backend.

Phase 1: Environment & Tooling Setup
Initialize a new Expo project using the blank TypeScript template: npx create-expo-app@latest -t expo-template-blank-typescript.

Install Expo Router dependencies: npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar.

Configure app.json to use Expo Router as the entry point ("main": "expo-router/entry") and define a custom "scheme".

Install gesture and animation libraries: npx expo install react-native-reanimated react-native-gesture-handler @gorhom/bottom-sheet.

Update babel.config.js to include the react-native-reanimated/plugin. Crucial: Ensure this is explicitly the last plugin in the array.

Install styling dependencies: npm install nativewind tailwindcss and run npx tailwindcss init. Configure tailwind.config.js to scan the app, components, and hooks directories.

Create a .env file at the root to locally store EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, and EXPO_PUBLIC_OPENAI_API_KEY.

Phase 2: Database Schema & Supabase Configuration
Install the Supabase client and storage: npm install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill.

Create src/lib/supabase.ts to initialize the Supabase client using environment variables and AsyncStorage for session persistence. Import react-native-url-polyfill/auto at the top of the file.

In the Supabase SQL Editor, execute CREATE EXTENSION IF NOT EXISTS vector; to enable pgvector for semantic search.

Execute SQL to create the notes table with columns: id (uuid, pk), user_id (uuid, fk), content (text), embedding (vector(1536)), status (text, default 'inbox'), created_at (timestamptz), and updated_at (timestamptz).

Execute SQL to create the merge_events table with columns: id (uuid, pk), parent_note_id (uuid), child_note_id (uuid), and merged_at (timestamptz, default now()).

Enable Row Level Security (RLS) on both tables and write policies allowing users to SELECT, INSERT, UPDATE, and DELETE strictly where auth.uid() = user_id.

Create the Postgres RPC function match_notes(query_embedding vector(1536), match_threshold float, match_count int, current_user_id uuid).

In the match_notes RPC, use the cosine distance operator (<=>) to return the top match_count rows from notes where status = 'stored' and user_id = current_user_id.

Phase 3: State Management & Data Structures
Create src/types/index.ts and define strict TypeScript interfaces for User, Note, and MergeEvent that match the PRD schema.

Install Zustand for global state management: npm install zustand.

Initialize a Zustand store in src/store/useNoteStore.ts to manage inboxNotes (array) and storedNotes (array) for optimistic UI updates.

Add actions to the Zustand store: setInboxNotes, removeInboxNote, addStoredNote, and updateNoteStatus.

Create src/hooks/useAuth.ts to implement Supabase anonymous authentication. Call signInAnonymously() on app load to ensure a valid user_id is automatically assigned before capture.

Phase 4: AI Integration Setup
Install the OpenAI SDK: npm install openai.

Create src/services/ai.ts and initialize the OpenAI client using EXPO_PUBLIC_OPENAI_API_KEY.

Export a generateEmbedding(text: string) function calling the text-embedding-3-small model to return a 1536-dimensional number array.

Export a cleanupNoteContent(text: string) function calling the gpt-4o-mini model.

Supply a strict System Prompt to cleanupNoteContent: "Format the following messy text into a clean, logical, bulleted outline. Output only the formatted text, no conversational filler."

Phase 5: Navigation Shell Setup
Create app/_layout.tsx. Wrap the entire app inside <GestureHandlerRootView style={{ flex: 1 }}> and <BottomSheetModalProvider>.

Inside app/_layout.tsx, define an Expo Router <Stack> to manage global navigation.

Create app/(tabs)/_layout.tsx to set up a Bottom Tab Navigator with three tabs: Capture (index), Review (review), and Vault (vault). Set headerShown: false.

Create the three placeholder tab screens: app/(tabs)/index.tsx, app/(tabs)/review.tsx, and app/(tabs)/vault.tsx.

Create the dynamic route for the detail view: app/note/[id].tsx, ensuring the stack header properly handles a back button.

Phase 6: Screen 1 - Frictionless Capture
In app/(tabs)/index.tsx, implement a full-screen, borderless TextInput configured with multiline={true}.

Set autoFocus={true} on the TextInput to ensure the software OS keyboard opens instantly upon tab focus.

Wrap the view in a KeyboardAvoidingView (behavior="padding") and position a large, floating "Save" button directly above the keyboard.

Implement handleSave: On press, immediately capture the state text and clear the TextInput state to zero out user friction. Keep the keyboard open.

In the background of handleSave, pass the text to generateEmbedding(). Wait for the 1536-dimensional vector response.

Insert the new note into the Supabase notes table with status: 'inbox' and the generated embedding vector attached.

Phase 7: Screen 2 - Review Mode & Swipe Physics Setup
In app/(tabs)/review.tsx, implement a useFocusEffect to fetch notes from Supabase where status = 'inbox', ordered by created_at ASC. Load them into Zustand.

Create a generic src/components/SwipeableCard.tsx component that accepts a single Note object as a prop.

In review.tsx, map and render the top 3 cards from the Zustand inboxNotes array using absolute positioning so they stack naturally like a physical deck.

In SwipeableCard.tsx, import react-native-reanimated and initialize translateX and translateY tracking using useSharedValue(0).

Attach a <GestureDetector> utilizing Gesture.Pan() from react-native-gesture-handler. Bind horizontal/vertical finger movement to translateX and translateY in the .onUpdate callback.

Use useAnimatedStyle to dynamically map translateX.value to card rotation (e.g., rotateZ: ${translateX.value / 15}deg) for Tinder-style tilting.

Add absolute-positioned text overlays to the card: "TRASH" (opacity maps to negative X), "KEEP" (positive X), and "MERGE" (negative Y).

Phase 8: Swipe Actions & Vector Merging Mechanism
Implement swipe release logic in SwipeableCard inside the Pan Gesture .onEnd callback: Check if swipe thresholds (e.g., +/- 120px) are crossed. If not, snap back to center using withSpring(0).

Swipe Left callback: If threshold met, animate card off-screen left. Optimistically pop from Zustand, and update Supabase status to archived.

Swipe Right callback: If threshold met, animate card off-screen right. Optimistically pop from Zustand, and update Supabase status to stored.

Swipe Up callback: If threshold met, animate card slightly up, suspend it in place, and open the <BottomSheetModal>.

In the Bottom Sheet, trigger the match_notes Supabase RPC using the suspended card's embedding, match_threshold: 0.7, and match_count: 3. Render an Activity Indicator while fetching.

Render the top 3 semantic matches as a selectable list inside the Bottom Sheet, displaying truncated text snippets.

Implement handleMerge(storedNoteId): On press, fetch the selected stored note.

Concatenate the inbox note's text onto the end of the stored note's text (separated by \n\n).

Update the stored note in Supabase with the combined text and a newly generated embedding.

Update the inbox note's status to archived in Supabase. Insert a record mapping the two UUIDs into the merge_events table for audit trailing.

Close the Bottom Sheet, animate the suspended inbox card completely off-screen upwards, and render the next inbox card.

Phase 9: Screen 3 - Vault / Library
In app/(tabs)/vault.tsx, implement a React Native FlatList fetching and rendering all notes where status = 'stored', ordered by updated_at DESC.

Style the FlatList items to display a two-line text preview of the content and a formatted date string.

Wrap each Vault list item in an Expo Router <Link href={"/note/" + note.id}> (or router.push) to route the user to the Detail View upon tap.

Phase 10: Screen 4 - Detail View & AI Magic Wand
In app/note/[id].tsx, extract the ID using useLocalSearchParams(). Fetch the full note content and render it inside a full-screen, editable TextInput for manual overrides.

Add a highly visible floating "Clean Up" (Magic Wand) button inside the Detail View, positioned above the keyboard.

Implement the Clean Up action: On press, disable the text input, show a loading indicator, pass the raw text to cleanupNoteContent(), instantly replace the TextInput state with the LLM's formatted outline, update the text payload in Supabase, and regenerate the note's embedding vector. Ensure zero TypeScript errors by running npx tsc --noEmit.