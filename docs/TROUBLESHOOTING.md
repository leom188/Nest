# Troubleshooting Guide: Auth & Loading Issues

## 1. Infinite Loading / Spinner stuck
If the app is stuck on the loading spinner (the otter logo or circle):

### Cause: Auth State Deadlock
This happens when the component responsible for updating the loading state (e.g., `setLoading(false)`) is never rendered because a parent component is waiting for `isLoading` to be false.

### Fix
Ensure `useAuthStore` synchronization logic is placed in a component that is **always rendered**, regardless of the loading state.

**Bad Pattern (Deadlock)**:
```tsx
function App() {
  const { isLoading } = useAuthStore(); // Defaults to true
  if (isLoading) return <Spinner />;    // Blocks rendering
  return <Router><AuthSync /></Router>; // Never runs, so isLoading stays true
}
```

**Good Pattern**:
```tsx
function App() {
  const { isLoading } = useAuthStore();
  // AuthSync logic must run BEFORE the return
  useAuthSync(); 
  
  if (isLoading) return <Spinner />;
  return <Router>...</Router>;
}
```

## 2. Convex Dev Server Hanging
If `npx convex dev` hangs on "Preparing Convex functions...":

### Cause: Circular Dependencies or Schema Conflicts
- **Circular Types**: If File A imports generated types from API that depend on File A.
- **Legacy Schema**: If existing data in the database doesn't match the new schema validation rules.

### Fixes
1. **Check for Circular Dependencies**: Avoid importing `internal` from `_generated/api` inside files that are also exported in the API. Use `internalQuery` / `mutation` or explicit string paths if needed temporarily.
2. **Schema Migration**: 
   - Use `v.optional()` for fields that might be missing in old data.
   - Or delete old test data from the Convex Dashboard.
3. **Restart Clean**:
   ```bash
   pkill -f "convex dev"
   rm -rf node_modules .convex
   npm install
   npx convex dev
   ```

## 3. Environment Variables
- Ensure `VITE_CONVEX_URL` matches your deployment.
- Ensure `CONVEX_SITE_URL` matches your local dev server (e.g., `http://localhost:5173`) for auth callbacks.
- **Legacy Env Vars**: Remove old auth secrets (like `BETTER_AUTH_SECRET`) from the Convex Dashboard if you migrated to Convex Auth.
