# AGENTS.md

This file provides essential guidance for agentic coding assistants working in the Nest repository.

---

## Build, Lint, and Test Commands

### Development
- **Start dev server:** `bun run dev` (or `npm run dev`)
- **Start Convex dev:** `bun run convex:dev` (or `npm run convex:dev`)
- **Build:** `bun run build` (or `npm run build`)
- **Lint:** `bun run lint` (or `npm run lint`)
- **Lint with auto-fix:** `bun run lint:fix` (or `npm run lint:fix`)

### Testing
- **Run specific test file:** `npx vitest run <test_name>` (e.g., `npx vitest run workspaces`)
- **Run all tests:** `npx vitest run`
- **Watch mode:** `npx vitest`

### E2E Testing
- **Run Playwright tests:** `npx playwright test`
- **Run specific E2E test:** `npx playwright test <test_name>`

### Performance
- **Run Lighthouse CI:** Ensure performance budget compliance (First Contentful Paint < 1.0s)

---

## Technology Stack Requirements

**Strict version adherence required:**
- Runtime: Node.js 20+ / Bun 1.0+ (preferred)
- Frontend: React 19 + Vite 5
- Language: TypeScript 5.4 (Strict Mode)
- Mobile: Capacitor 6
- Backend: Convex (BaaS)
- State: Zustand + Convex React Hooks
- Validation: Zod
- Auth: better-auth 1.4.9 + @convex-dev/better-auth
- UI: shadcn/ui + Tailwind CSS 4.0
- Animation: Framer Motion
- Icons: lucide-react (and Otter icons from `docs/Icons`)

---

## Code Style Guidelines

### Imports
- Import individual lucide-react icons: `import { Wallet } from 'lucide-react'`
- Use proper barrel exports for convex functions
- Group imports: external libraries first, then internal modules, then types

### Types
- **No `any` types allowed** - Use TypeScript strict mode
- Use Convex `Id<T>` types for document references
- Use Zod schemas for runtime validation at API boundaries
- Prefer union types for string literals (e.g., `"split" | "joint"`)

### Naming Conventions
- Components: PascalCase (e.g., `WorkspaceSwitcher`)
- Functions: camelCase (e.g., `createWorkspace`)
- Constants: UPPER_SNAKE_CASE
- Interfaces/Types: PascalCase (e.g., `Workspace`, `Member`)

### Error Handling
- Use Convex patterns: `ctx.auth.getUserIdentity()` for security checks
- Implement proper RBAC validation in mutations/queries
- Return explicit error types, not throw in Convex functions

---

## Architecture Patterns

### Convex Functions
- Queries: Read-only operations
- Mutations: Write operations, must validate auth
- Actions: External API calls, heavy computation

### Data Model
- Use Dual-Table Pattern for relationships
- All tables must have `_id`, `_creationTime` fields
- Use optional chaining for optional fields: `field?: string`

### State Management
- Client state: Zustand stores (global, ephemeral)
- Server state: Convex React Hooks (persistent, real-time)
- Sync auth_users ↔ users table on login

---

## UI/UX Guidelines

### Styling
- Use OtterLife palette: Royal Otter Blue (#6C5CE7), Fresh Water (#74B9FF), etc.
- Card-based layouts: `rounded-[20px] shadow-soft p-6 bg-white`
- Interactive elements: `hover:opacity-90 active:scale-95 transition-all`
- Accessibility: Minimum touch targets 44x44pt, contrast ratio > 4.5:1

### Animation
- Focus on "Delightful" motion (bubbles for water tracker, confetti for completion)
- Use Framer Motion with `layoutId` for smooth transitions
- Respect `prefersReducedMotion`

### Visual Language
- Rounded, friendly aesthetics (Quicksand & Nunito fonts)
- Soft shadows and pastel gradients

---

## Development Workflow

### Testing First
- **CRITICAL:** Do not mark Phase complete until CHECKPOINT tests pass
- Write convex-test unit tests for backend logic (e.g., split math)
- Write Vitest tests for in-memory verification
- Write Playwright tests for critical user flows (Login → Create Workspace → Add Expense)

### Sustainability
- Lazy load all heavy routes
- Minimize bundle size through tree-shaking
- Optimize for dark mode (OLED energy savings)
- Enforce performance budgets with Lighthouse CI

### Phase Checkpoints
- ✅ Phase 1: Auth flow verified in Convex Dashboard
- ✅ Phase 2: Workspace creation + member count test passes + logout functionality
- Phase 3: Split debt calculation test passes
- Phase 4: Full E2E Playwright suite passes

---

## Security Best Practices

- Always validate auth identity with `ctx.auth.getUserIdentity()`
- Implement RBAC checks based on Member roles (owner/admin/member)
- Never expose secrets in client-side code
- Use environment variables for configuration (.env.example provided)

## Authentication Patterns

**CRITICAL:** Read `docs/SPEC.md` Section 7 "Authentication Implementation Notes" before implementing auth. It contains the correct Convex patterns and common pitfalls to avoid.

---

## File Organization

Expected structure:
```
convex/
  schema.ts
  app.ts
  *.test.ts (in-memory backend tests)
src/
  components/ (React components)
  stores/ (Zustand state)
  lib/ (utilities)
  main.tsx
```

## Package Manager

- **Preferred:** Bun 1.0+ (use `bun add` and `bun install`)
- **Alternative:** Node.js 20+ with npm/yarn/pnpm
- **Better-auth:** `bun add better-auth@1.4.9 --exact`
- **Convex integration:** `bun add convex@latest @convex-dev/better-auth`

## MCP Servers

- Configured in `.cursor/mcp.json`:
  - **Convex:** `@modelcontextprotocol/server-convex`
  - **Filesystem:** `@modelcontextprotocol/server-filesystem`
  - **Grep:** `@modelcontextprotocol/server-grep`
  - **Vercel:** `@modelcontextprotocol/server-vercel`
