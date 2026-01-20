# Swipe Logic Implementation Plan

## Objective
Replace the current brittle and non-standard swipe implementation with a robust, native-feeling, and accessible solution using `framer-motion` and modern UI patterns.

## 1. UX Standards & Patterns
The current implementation (Swipe Left to Delete, Swipe Right to Edit) conflicts with common mobile gestures (like "Swipe to Go Back" on iOS). We will adopt industry-standard patterns:

- **Primary Action (Edit/View)**: **Tap** on the card. This is the most intuitive interaction for opening details or editing.
- **Secondary Action (Delete)**: **Swipe Left**. This is the standard "destructive" direction.
- **Feedback**: Immediate visual removal with "Undo" toast.

## 2. Architecture

### Components
We will refactor `SwipeableExpenseCard` into smaller, composable pieces:

1.  **`SwipeableRow`**: A generic, reusable wrapper handling the drag logic, thresholds, and revealing background actions.
2.  **`ExpenseCardContent`**: The visual display of the expense (stateless).
3.  **`ExpenseList`**: Manages the list state and orchestrates animations (like `AnimatePresence` for removing items).

### Proposed File Structure
```
src/components/
  ui/
    swipeable/
      SwipeableRow.tsx  <-- The core logic
      SwipeAction.tsx   <-- The delete button/background
  expenses/
    ExpenseCard.tsx     <-- The content
    ExpenseList.tsx     <-- usage
```

## 3. Detailed Implementation Specs

### 3.1. SwipeableRow Logic (Framer Motion)
Instead of manually interpolating background colors on the main card, we will use a "layer" approach:
- **Background Layer**: Contains the "Delete" icon/red background. It sits *statick* behind the foreground.
- **Foreground Layer**: The specific content (Expense Card). It is the generic `motion.div` that drags.

**Key Physics:**
- Use `drag="x"` with `dragConstraints={{ right: 0 }}` (prevent swiping right if we only want swipe-left-to-delete).
- Use `dragElastic={0.1}` for a rubber-band feel.
- **Thresholds**: 
    - If dragged < -100px: Trigger Delete.
    - Animation: `type: "spring", stiffness: 400, damping: 40` for snappy return.

### 3.2. Global Undo System
**Problem**: Currently, the Undo toast is inside the card. When the card is deleted, it unmounts, risking the toast disappearing or logic breaking.
**Solution**: Move Undo state to a persistent store (Zustand).

```typescript
// store/uiStore.ts
interface UiStore {
  toast: { message: string; action?: () => void } | null;
  showToast: (message: string, action?: () => void) => void;
  hideToast: () => void;
}
```

The `Dashboard` or a global structure will render the `Toast` component based on this store.

### 3.3. Haptics
Create a standard hook `useHaptic` that gracefully degrades on non-supporting devices.
```typescript
const useHaptic = () => {
  const trigger = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };
  return { success: () => trigger(50), error: () => trigger([50, 100, 50]), impact: () => trigger(20) };
};
```

### 3.4. Accessibility (A11y)
Swipe gestures are inaccessible to many users.
- **Requirement**: The SwipeableRow must expose its actions via a context menu or visible button when focused.
- **Fallback**: Add a small "More" (three dots) button on the card content that opens a dropdown with "Edit" and "Delete".

## 4. Migration Steps

1.  **Create generic `SwipeableRow`**: Build the specialized motion component.
2.  **Refactor `ExpenseCard`**: Strip it of drag logic; make it just a display component.
3.  **Update `Dashboard`**:
    - Implement the standard "Tap to Edit" behavior.
    - Implement the "Swipe Left to Delete" using `SwipeableRow`.
    - Lift the "Undo" state to a higher level (or `Dashboard` local state for now).
4.  **Polish**: Tune spring physics and haptics.

## 5. Dependencies
- `framer-motion`: Main animation library.
- `lucide-react`: Icons.
- Standard React Hooks.
