# Quick Integration - Copy & Paste

## 3 Simple Steps to Add Analysis Tools

### Step 1: Add Import (Line ~60)

Add this import with the other imports at the top of `screens/analyze-screen.tsx`:

```typescript
import { AnalysisToolsModal } from "@/components/analysis";
```

### Step 2: Add State (Line ~700)

Add this state variable with the other useState declarations:

```typescript
const [showAnalysisModal, setShowAnalysisModal] = useState(false);
```

### Step 3: Add Two Code Blocks

#### A. Update the Analyze Button (Line ~1200)

Find this line:

```typescript
<ToolChip icon={MicroscopeIcon as any} label="Analyze" />
```

Replace it with:

```typescript
<ToolChip
  icon={MicroscopeIcon as any}
  label="Analyze"
  onPress={() => setShowAnalysisModal(true)}
/>
```

#### B. Add Modal Component (Line ~1400, before the last `</View>`)

Add this right before the final closing `</View>` tag:

```typescript
      {/* Analysis Tools Modal */}
      <AnalysisToolsModal
        visible={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        experimentId={activeChatId !== "new" ? activeChatId : undefined}
      />
```

## That's It! 🎉

Now when you tap the "Analyze" button in the toolbar, you'll see a modal with three AI-powered analysis tools:

- 🔬 Gel Image Analysis
- ⚠️ Troubleshooting Assistant
- 🧪 Protocol Optimization

## Visual Guide

```
screens/analyze-screen.tsx
│
├─ Line ~60: Add import
│   import { AnalysisToolsModal } from "@/components/analysis";
│
├─ Line ~700: Add state
│   const [showAnalysisModal, setShowAnalysisModal] = useState(false);
│
├─ Line ~1200: Update button
│   <ToolChip ... onPress={() => setShowAnalysisModal(true)} />
│
└─ Line ~1400: Add modal
    <AnalysisToolsModal ... />
```

## Test It

1. Save the file
2. Reload the app
3. Go to the Analyze tab
4. Tap the "Analyze" button in the toolbar
5. Choose an analysis tool
6. Try it out!

---

**Pro Tip**: If you want to test without an experiment, temporarily change:

```typescript
experimentId={activeChatId !== "new" ? activeChatId : "test-experiment-123"}
```
