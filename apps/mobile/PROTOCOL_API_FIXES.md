# Protocol API Integration Fixes

## Summary

Fixed compatibility issues between the screens and the updated `lib/api.ts` that changed from `ProtocolCategory` to `AssayType`.

## Changes Made

### 1. Updated `screens/protocols-screen.tsx`

#### Import Changes

```typescript
// Before
import { api, Protocol as ApiProtocol, AssayType } from "@/lib/api";

// After
import {
  api,
  Protocol as ApiProtocol,
  AssayType as ApiAssayType,
} from "@/lib/api";
```

#### Type Definitions

- Renamed local `AssayType` to `UiAssayType` to avoid conflicts with API's `AssayType`
- Updated all references from `AssayType` to `UiAssayType` throughout the file

```typescript
// UI types (simplified for display)
type UiAssayType = "PCR" | "Gel" | "Western" | "ELISA" | "qPCR" | "Flow";

// API types (from lib/api.ts)
type ApiAssayType =
  | "PCR"
  | "ELISA"
  | "WESTERN_BLOT"
  | "MICROSCOPY"
  | "FLOW_CYTOMETRY"
  | "CELL_CULTURE"
  | "PROTEIN_EXPRESSION"
  | "DNA_SEQUENCING"
  | "GEL"
  | "OTHER";
```

#### Mapping Function

Updated the mapping function to convert API types to UI types:

```typescript
// Before
function mapCategoryToType(category: ProtocolCategory): AssayType {
  const mapping: Record<ProtocolCategory, AssayType> = {
    MOLECULAR_BIOLOGY: "PCR",
    CELL_CULTURE: "Flow",
    BIOCHEMISTRY: "Western",
    IMMUNOLOGY: "ELISA",
    OTHER: "Gel",
  };
  return mapping[category] || "PCR";
}

// After
function mapApiTypeToUiType(apiType: ApiAssayType): UiAssayType {
  const mapping: Record<ApiAssayType, UiAssayType> = {
    PCR: "PCR",
    ELISA: "ELISA",
    WESTERN_BLOT: "Western",
    MICROSCOPY: "PCR",
    FLOW_CYTOMETRY: "Flow",
    CELL_CULTURE: "Flow",
    PROTEIN_EXPRESSION: "Western",
    DNA_SEQUENCING: "PCR",
    GEL: "Gel",
    OTHER: "Gel",
  };
  return mapping[apiType] || "PCR";
}
```

### 2. Updated `screens/create-protocol-screen.tsx`

#### Import Changes

```typescript
// Added AssayType and AssayTypeArr imports
import {
  api,
  ProtocolConditions as ApiProtocolConditions,
  ProtocolMaterial as ApiProtocolMaterial,
  ProtocolStep as ApiProtocolStep,
  AssayType,
  AssayTypeArr,
} from "@/lib/api";
```

#### Type Selection

Updated to use `AssayTypeArr` from the API for consistent type selection:

```typescript
// Before
const ASSAY_TYPES = ["PCR", "Gel", "Western", "ELISA", "qPCR", "Flow"];

// After
// Uses AssayTypeArr from API which includes label and value pairs
{AssayTypeArr.map((type) => (
  <TypeOption
    key={type.label}
    type={type.value as AssayType}
    selected={formData.type === type.value}
    onSelect={() => updateField("type", type.value as AssayType)}
  />
))}
```

#### Form Submission

Updated to use API's `AssayType` directly:

```typescript
const apiData = {
  name: formData.name,
  description: formData.description || undefined,
  category: formData.type as AssayType, // Direct use of API type
  version: "1.0.0",
  // ... rest of the data
};
```

### 3. Updated Documentation

#### Files Updated

- `PROTOCOL_API_QUICK_REFERENCE.md`
- `PROTOCOL_INTEGRATION_SUMMARY.md`

#### Changes

- Replaced all references to `ProtocolCategory` with `AssayType`
- Updated code examples to use new type names
- Added `AssayTypeArr` helper array documentation
- Updated mapping function examples

## API Type System

### AssayType (from lib/api.ts)

```typescript
export type AssayType =
  | "PCR"
  | "ELISA"
  | "WESTERN_BLOT"
  | "MICROSCOPY"
  | "FLOW_CYTOMETRY"
  | "CELL_CULTURE"
  | "PROTEIN_EXPRESSION"
  | "DNA_SEQUENCING"
  | "GEL"
  | "OTHER";
```

### AssayTypeArr Helper

```typescript
export const AssayTypeArr = [
  { label: "PCR", value: "PCR" },
  { label: "ELISA", value: "ELISA" },
  { label: "Western Blot", value: "WESTERN_BLOT" },
  { label: "Microscopy", value: "MICROSCOPY" },
  { label: "Flow Cytometry", value: "FLOW_CYTOMETRY" },
  { label: "Cell Culture", value: "CELL_CULTURE" },
  { label: "Protein Expression", value: "PROTEIN_EXPRESSION" },
  { label: "DNA Sequencing", value: "DNA_SEQUENCING" },
  { label: "Gel", value: "GEL" },
  { label: "Other", value: "OTHER" },
];
```

## Type Mapping Strategy

### Protocols List Screen

- **API → UI**: Maps API's detailed types to simplified UI display types
- Example: `WESTERN_BLOT` → `"Western"`, `FLOW_CYTOMETRY` → `"Flow"`

### Create Protocol Screen

- **UI → API**: Uses API types directly from `AssayTypeArr`
- No mapping needed since form uses API types

## Benefits of Changes

1. **Type Safety**: No more conflicts between local and API types
2. **Consistency**: Both screens now use the same API type system
3. **Maintainability**: Single source of truth for assay types
4. **Flexibility**: Easy to add new types by updating `AssayTypeArr` in API
5. **Better UX**: User-friendly labels with proper API values

## Testing Checklist

- [x] No TypeScript errors in protocols-screen.tsx
- [x] No TypeScript errors in create-protocol-screen.tsx
- [x] Import statements correct
- [x] Type mappings updated
- [x] Documentation updated
- [ ] Test protocol creation with all assay types
- [ ] Test protocol list display with all assay types
- [ ] Test filtering by assay type
- [ ] Verify API calls use correct type values

## Migration Notes

If you have existing protocols in the database with old `ProtocolCategory` values, you may need to:

1. Run a migration script to convert old categories to new AssayType values
2. Update any stored filters or preferences
3. Clear any cached protocol data

### Example Migration Mapping

```typescript
const categoryToAssayType = {
  MOLECULAR_BIOLOGY: "PCR",
  CELL_CULTURE: "CELL_CULTURE",
  BIOCHEMISTRY: "WESTERN_BLOT",
  IMMUNOLOGY: "ELISA",
  OTHER: "OTHER",
};
```

## Future Improvements

1. **Add qPCR Type**: Currently mapped to PCR, could be its own type
2. **Custom Types**: Allow users to define custom assay types
3. **Type Icons**: Add specific icons for each assay type
4. **Type Colors**: Customize colors per assay type
5. **Type Descriptions**: Add tooltips explaining each type

## Conclusion

All compatibility issues have been resolved. The screens now properly use the updated API type system with `AssayType` instead of `ProtocolCategory`. The code is type-safe, consistent, and ready for testing.
