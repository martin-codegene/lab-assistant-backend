# How to Use Analysis Tools in the Analyze Screen

## Quick Start

The Analysis Tools are now available through a modal interface. Here's how to integrate them into your analyze screen:

## Option 1: Add as a Toolbar Button (Recommended)

Add the Analysis Tools button to the existing toolbar in `screens/analyze-screen.tsx`:

### Step 1: Import the Modal

```typescript
import { AnalysisToolsModal } from "@/components/analysis";
```

### Step 2: Add State

Add this state near the other useState declarations (around line 700):

```typescript
const [showAnalysisModal, setShowAnalysisModal] = useState(false);
```

### Step 3: Update the "Analyze" ToolChip

Find the line with the "Analyze" ToolChip (around line 1200) and update it:

```typescript
<ToolChip
  icon={MicroscopeIcon as any}
  label="Analyze"
  onPress={() => setShowAnalysisModal(true)}
/>
```

### Step 4: Add the Modal

Add this before the closing `</View>` tag at the end of the component (around line 1400):

```typescript
{/* Analysis Tools Modal */}
<AnalysisToolsModal
  visible={showAnalysisModal}
  onClose={() => setShowAnalysisModal(false)}
  experimentId={activeChatId !== "new" ? activeChatId : undefined}
  protocol={activeChat?.protocol}
/>
```

## Option 2: Add as a Suggestion Pill

Update the SUGGESTIONS array (around line 150):

```typescript
const SUGGESTIONS = [
  "Analyze gel image",
  "Troubleshoot PCR",
  "Optimize protocol",
  "Calculate molarity",
  "Generate lab report",
];
```

Then handle the suggestion click to open the modal:

```typescript
const handleSuggestionClick = (suggestion: string) => {
  if (
    suggestion === "Analyze gel image" ||
    suggestion === "Troubleshoot PCR" ||
    suggestion === "Optimize protocol"
  ) {
    setShowAnalysisModal(true);
  } else {
    handleSend(suggestion);
  }
};
```

## Option 3: Standalone Screen

Create a dedicated analysis screen:

```typescript
// app/(tabs)/analysis.tsx
import { AnalysisToolsModal } from "@/components/analysis";
import { useState } from "react";
import { View } from "react-native";

export default function AnalysisTab() {
  return (
    <AnalysisToolsModal
      visible={true}
      onClose={() => {}}
      experimentId="your-experiment-id"
    />
  );
}
```

## Complete Integration Example

Here's a minimal example showing the key changes to `screens/analyze-screen.tsx`:

```typescript
// Add import at the top
import { AnalysisToolsModal } from "@/components/analysis";

export default function AnalyzeScreen() {
  // ... existing state ...
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // ... rest of component ...

  return (
    <View style={styles.root}>
      {/* ... existing UI ... */}

      {/* In the toolbar section, update the Analyze chip: */}
      <ToolChip
        icon={MicroscopeIcon as any}
        label="Analyze"
        onPress={() => setShowAnalysisModal(true)}
      />

      {/* Add modal before closing View */}
      <AnalysisToolsModal
        visible={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        experimentId={activeChatId !== "new" ? activeChatId : undefined}
      />
    </View>
  );
}
```

## What You'll See

When you tap the "Analyze" button, a modal will slide up showing three options:

1. **Gel Image Analysis** 🔬
   - Upload gel image URL
   - Specify lanes, marker, expected size
   - Get AI-powered band detection and quality assessment

2. **Troubleshooting Assistant** ⚠️
   - Describe your experimental problem
   - Provide protocol context
   - Get root cause analysis and solutions

3. **Protocol Optimization** 🧪
   - Analyze your current protocol
   - Get efficiency and cost optimization suggestions
   - Receive implementation guidance

## Features

- **Modal Interface**: Clean, full-screen modal that slides up
- **Back Navigation**: Easy navigation between tool selection and individual tools
- **Experiment Context**: Automatically uses the current experiment ID
- **Protocol Support**: Protocol optimizer only available when a protocol is selected
- **Responsive Design**: Works on all screen sizes

## Testing

To test the integration:

1. Open the Analyze screen
2. Tap the "Analyze" button in the toolbar
3. Select one of the three analysis tools
4. Try each tool with sample data
5. Use the back button to return to tool selection
6. Close the modal with the X button

## Troubleshooting

### "Please select an experiment first"

- Make sure you're in an active chat (not "new")
- The experimentId is derived from activeChatId

### Protocol Optimizer is disabled

- This tool requires a protocol to be associated with the experiment
- Select an experiment that has a protocol attached

### Modal doesn't appear

- Check that `showAnalysisModal` state is being set to `true`
- Verify the import path is correct
- Ensure the modal is rendered in the component tree

## Next Steps

Consider these enhancements:

1. **Direct Image Upload**: Add camera/gallery picker instead of URL input
2. **Save Results**: Store analysis results with the experiment
3. **Share Results**: Export analysis as PDF or share via email
4. **History**: Show past analyses in the sidebar
5. **Notifications**: Alert when long-running analyses complete

---

**Need Help?** Check the component source code in `components/analysis/` for implementation details.
