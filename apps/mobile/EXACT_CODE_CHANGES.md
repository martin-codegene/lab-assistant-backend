# Exact Code Changes for screens/analyze-screen.tsx

## Change 1: Add Import (After line 59)

**Location**: After the SafeAreaView import

**Add this line:**

```typescript
import { AnalysisToolsModal } from "@/components/analysis";
```

**Full context:**

```typescript
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { AnalysisToolsModal } from "@/components/analysis"; // ← ADD THIS

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
```

---

## Change 2: Add State (After line 700)

**Location**: In the AnalyzeScreen function, with other useState declarations

**Add this line:**

```typescript
const [showAnalysisModal, setShowAnalysisModal] = useState(false);
```

**Full context:**

```typescript
export default function AnalyzeScreen() {
  const insets = useSafeAreaInsets();
  const [chats, setChats] = useState<Chat[]>(SEED_CHATS);
  const [activeChatId, setActiveChatId] = useState<string>("new");
  const [message, setMessage] = useState("");
  const [inputHeight, setInputHeight] = useState(46);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);  // ← ADD THIS
```

---

## Change 3: Update Analyze Button (Around line 1200)

**Location**: In the toolbar section, find the ToolChip with label="Analyze"

**Find this:**

```typescript
<ToolChip icon={MicroscopeIcon as any} label="Analyze" />
```

**Replace with:**

```typescript
<ToolChip
  icon={MicroscopeIcon as any}
  label="Analyze"
  onPress={() => setShowAnalysisModal(true)}
/>
```

**Full context:**

```typescript
<View style={styles.toolsRow}>
  <ToolChip
    icon={Attachment01Icon as any}
    label="Attach"
    onPress={handleAttach}
  />
  <ToolChip
    icon={MicroscopeIcon as any}
    label="Analyze"
    onPress={() => setShowAnalysisModal(true)}  // ← ADD THIS
  />
  <ToolChip icon={Beaker as any} label="Protocol" />
</View>
```

---

## Change 4: Add Modal Component (Before final closing tag, around line 1400)

**Location**: Right before the last `</View>` in the return statement, after the Voice Mode Bottom Sheet

**Add this block:**

```typescript
      {/* Analysis Tools Modal */}
      <AnalysisToolsModal
        visible={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        experimentId={activeChatId !== "new" ? activeChatId : undefined}
      />
```

**Full context:**

```typescript
      {/* ── Voice Mode Bottom Sheet ── */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
      >
        {/* ... bottom sheet content ... */}
      </BottomSheetModal>

      {/* Analysis Tools Modal */}
      <AnalysisToolsModal
        visible={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        experimentId={activeChatId !== "new" ? activeChatId : undefined}
      />
    </View>  // ← This is the final closing View tag
  );
}
```

---

## Summary

**4 changes total:**

1. ✅ Import the component
2. ✅ Add state variable
3. ✅ Add onPress handler to button
4. ✅ Render the modal

**Lines affected:**

- ~60: Import
- ~700: State
- ~1200: Button
- ~1400: Modal

**Total lines added:** ~15 lines

---

## Verification

After making these changes, you should be able to:

1. See the "Analyze" button in the toolbar (it was already there)
2. Tap it to open the Analysis Tools modal
3. See three analysis options
4. Select and use any analysis tool
5. Navigate back and close the modal

If the modal doesn't appear, check:

- Import path is correct
- State is declared in the component
- Modal is inside the return statement
- No syntax errors in the added code
