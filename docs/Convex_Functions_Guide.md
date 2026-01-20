# Convex Function Types & Best Practices

This document outlines the proper usage of Convex function types and common pitfalls encountered during development.

## Function Types Overview

### Query
- **Purpose**: Read-only database access with automatic caching and real-time updates
- **Use When**:
  - Fetching data from database (e.g., get user profile, list items)
  - Real-time subscriptions needed
  - Pure functions with no side effects
- **Characteristics**:
  - Cached and optimized for performance
  - Automatic real-time updates via subscriptions
  - Must be pure (no writes, no external calls)
- **Context Access**: `ctx.db` for database reads

### Mutation
- **Purpose**: Transactional database writes (insert, update, delete)
- **Use When**:
  - Changing data in database
  - Multiple operations that must succeed/fail together
  - Atomic operations needed
- **Characteristics**:
  - Runs inside database transaction
  - Strong consistency guarantees
  - Can schedule other functions/workflows
- **Context Access**: `ctx.db` for database operations

### Action
- **Purpose**: External API calls, side effects, or complex workflows
- **Use When**:
  - Calling external services (Stripe, OpenAI, emails)
  - HTTP webhooks or scheduled jobs
  - Non-deterministic operations
  - File uploads/downloads
- **Characteristics**:
  - Runs outside database transaction
  - Can have side effects
  - May be slower due to external dependencies
  - Can be scheduled or triggered via HTTP
- **Context Access**: `ctx.runQuery()`, `ctx.runMutation()` to call other functions

## Internal vs Public Functions

### Internal Functions
- **Naming**: `internalQuery`, `internalMutation`, `internalAction`
- **Purpose**: Private logic not exposed to clients
- **Benefits**:
  - Reduces public attack surface
  - Internal implementation details
  - Called only by other Convex functions
- **Example**: `internal.auth.checkUserExists`

### Public Functions
- **Naming**: `query`, `mutation`, `action`
- **Purpose**: Exposed to client applications
- **Requirements**:
  - Proper authentication/authorization
  - Input validation
  - Error handling
- **Example**: `workspaces.createWorkspace`

## Common Pitfalls & Solutions

### ❌ Pitfall: Using `ctx.db` in Actions
**Problem**: Actions don't have direct database access via `ctx.db`
```typescript
// ❌ WRONG - This won't work in an action
export const someAction = action({
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").first(); // Error!
    return user;
  }
});
```

**Solution**: Use `ctx.runQuery()` to call query functions
```typescript
// ✅ CORRECT - Use runQuery in actions
export const someAction = action({
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.auth.checkUserExists, {
      authUserId: args.userId
    });
    return user;
  }
});
```

### ❌ Pitfall: Converting Actions to Mutations Incorrectly
**Problem**: Some functions were defined as actions but needed database access
**Solution**: Convert to mutations when database operations are needed
```typescript
// Before (Action - can't use ctx.db)
export const createInvitation = action({ ... });

// After (Mutation - can use ctx.db)
export const createInvitation = mutation({ ... });
```

### ❌ Pitfall: Frontend Using Wrong Hook
**Problem**: Frontend using `useAction` for functions that became mutations
```typescript
// ❌ Frontend using wrong hook
const createWorkspace = useAction(api.workspaces.createWorkspace);

// ✅ Correct hook usage
const createWorkspace = useMutation(api.workspaces.createWorkspace);
```

## Best Practices for This Codebase

### 1. Function Type Selection
- Use `query` for all read operations
- Use `mutation` for database writes and transactional operations
- Use `action` only for external API calls or complex workflows
- Reserve `internal*` functions for private logic

### 2. Error Handling
- Always check for user existence before operations
- Validate permissions and ownership
- Provide clear error messages for limits/constraints

### 3. Type Safety
- Avoid `any` types - use proper TypeScript interfaces
- Define clear input/output types for all functions
- Use Convex's generated types when possible

### 4. Subscription Logic
- Check subscription tier before allowing operations
- Enforce limits at the database/API level
- Provide clear upgrade messaging

### 5. Database Operations
- Use transactions for related operations
- Implement proper indexing for query performance
- Clean up related data when deleting entities

## Examples from Our Codebase

### ✅ Correct Query Usage
```typescript
export const getWorkspacesForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Direct database access in queries
    const memberships = await ctx.db.query("members")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return memberships;
  }
});
```

### ✅ Correct Mutation Usage
```typescript
export const createWorkspace = mutation({
  args: { name: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    // Check subscription limits
    const user = await ctx.db.get(args.userId);
    if (user.workspacesCreated >= (user.subscriptionTier === "premium" ? 10 : 2)) {
      throw new Error("Workspace limit reached");
    }

    // Database writes in mutations
    const workspaceId = await ctx.db.insert("workspaces", { ... });
    await ctx.db.insert("members", { ... });
    await ctx.db.patch(user._id, { workspacesCreated: user.workspacesCreated + 1 });

    return workspaceId;
  }
});
```

### ✅ Correct Action Usage
```typescript
export const sendInvitationEmail = action({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, args) => {
    // Get data via runQuery (not ctx.db)
    const invitation = await ctx.runQuery(internal.invitations.getInvitation, {
      invitationId: args.invitationId
    });

    // External API call
    await fetch('/api/send-email', {
      method: 'POST',
      body: JSON.stringify({ to: invitation.email, ... })
    });
  }
});
```

## Migration Notes

During development, we encountered and resolved these issues:

1. **Invitation functions**: Converted from actions to mutations to enable database access
2. **Auth functions**: Updated to use proper internal queries for user lookups
3. **Frontend hooks**: Changed `useAction` to `useMutation` where appropriate
4. **Type annotations**: Added explicit types to eliminate `any` usage

## Key Takeaways

- **Queries**: Fast, cached reads with real-time updates
- **Mutations**: Transactional writes with consistency guarantees
- **Actions**: External operations and side effects
- **Context Access**: `ctx.db` in queries/mutations, `ctx.runQuery()`/`ctx.runMutation()` in actions
- **Internal Functions**: Keep implementation details private
- **Type Safety**: Always prefer explicit types over `any`

This documentation should prevent similar issues in future development and serve as a reference for proper Convex usage patterns.</content>
<parameter name="filePath">CONVEX_GUIDE.md