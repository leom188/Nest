# **Technical Specification Document (TSD)**

App Name: Nest

Version: 1.0 (Spatial, Sustainable, Test-Driven)

Date: January 13, 2026

## **1\. Executive Summary**

**Nest** is a cross-platform household finance application that unifies **Split Mode** (debt tracking) and **Joint Mode** (collective savings).

The Design Philosophy:

**OtterLife** makes wellness delightful through gamification and companionship. The aesthetic is defined by **softness**, **rounded corners (20px)**, **pastel gradients**, and **friendly illustrations**. It maintains modern usability standards (iOS ecosystem) while embracing a "Cute/Kawaii" spirit.

## **2\. Technology Stack**

*Strict adherence to these versions is required.*

### **Core Framework**

* **Runtime:** Node.js 20+ / Bun 1.0+  
* **Frontend:** React 19 \+ Vite 5  
* **Language:** TypeScript 5.4 (Strict Mode)  
* **Mobile Engine:** Capacitor 6 (iOS/Android/HarmonyOS)

### **State & Data**

* **Backend-as-a-Service:** **Convex** (Real-time DB, Functions)  
* **State Management:** **Zustand** (Client global) \+ **Convex React Hooks** (Server)  
* **Schema Validation:** **Zod**

### **Spatial UI & Interaction**

* **System:** **shadcn/ui** (Base components)
* **Styling:** **Tailwind CSS 4.0**
* **Animation Physics:** **Framer Motion** (Use `layoutId` prop for shared element transitions - morphing effects where components transition smoothly between states)
* **Haptics:** **@capacitor/haptics**
* **Icons:** **lucide-react** (Import individual icons for optimal bundle size)

### **Authentication**

* **Component:** **@convex-dev/better-auth** (Official Integration)

### **Quality Assurance (Testing)**

* **Unit/Integration:** **convex-test** \+ **Vitest**.  
  * *Usage:* In-memory backend logic tests (e.g., verifying split math without hitting the live DB).  
* **E2E:** **Playwright**.  
  * *Usage:* Critical user flows (Login \-\> Create Workspace \-\> Add Expense).  
* **Performance/Sustainability:** **Lighthouse CI**.  
  * *Usage:* Enforce a "Performance Budget" (e.g., First Contentful Paint \< 1.0s) to ensure low energy usage.

---

## **3\. Data Model (Schema Design)**

The database is **Convex**. We utilize the **Dual-Table Pattern**.

TypeScript

import { Id } from "./\_generated/dataModel";

// Table: users  
export interface User {  
  \_id: Id\<"users"\>;  
  \_creationTime: number;  
  authUserId: string; // Links to better-auth  
  name: string;  
  email: string;  
  income?: number;  
  avatarUrl?: string;  
  onboarded: boolean;  
  prefersReducedMotion: boolean; // Accessibility/Green setting  
}

// Table: workspaces  
export interface Workspace {  
  \_id: Id\<"workspaces"\>;  
  \_creationTime: number;  
  name: string;  
  type: "split" | "joint";  
  currency: string;  
  splitMethod: "50/50" | "income" | "custom";  
  customSplitConfig?: string;  
}

// Table: members  
export interface Member {  
  \_id: Id\<"members"\>;  
  \_creationTime: number;  
  workspaceId: Id\<"workspaces"\>;  
  userId: Id\<"users"\>;  
  role: "owner" | "admin" | "member";  
  joinedAt: number;  
}

// Table: expenses
export interface Expense {
  _id: Id\<"expenses"\>;
  _creationTime: number;
  workspaceId: Id\<"workspaces"\>;
  paidBy: Id\<"users"\>;
  amount: number;
  description: string;
  category: string;
  date: number;
  receiptImageUrl?: string;
  isRecurring: boolean;
  recurrenceRule?: string; // iCal RRULE format (e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR")
  splitDetails?: Record\<Id\<"users"\>, number\>;
}

### **3.1 Role-Based Access Control (RBAC)**

| Role | Scope | Permissions (Capabilities) |
| :---- | :---- | :---- |
| **Owner** | Workspace | **Full Access.** Delete workspace, transfer ownership, billing. |
| **Admin** | Workspace | **Manage Data.** Invite members, edit/delete *any* expense. |
| **Member** | Workspace | **Contributor.** Add expenses. Edit/delete *only own* expenses. |

---

## **4\. Feature Implementation Plan**

### **Phase 1: The Spatial Shell & Auth**

* **Tasks:**  
  * Setup Tailwind with the "OtterLife" palette.  
  * Implement card-based layout with soft shadows.  
  * Integrate better-auth.  
* **🛑 CHECKPOINT:**  
  * **Verification:** Log in via UI. Verify auth_users and users tables are synced in Convex Dashboard.

### Phase 2: Core Workspace & Logic Tests ✅ COMPLETE

* **Tasks:**
  * ✅ Create Workspace mutation (Must add creator as Owner).
  * ✅ Sidebar component.
  * ✅ Logout functionality with auth state management.
* **🛑 CHECKPOINT:**
  * ✅ **Test:** Create convex/workspaces.test.ts. Use convex-test to assert that creating a workspace increases the members count by 1\.
  * ✅ **Run:** npx vitest run workspaces.
  * ✅ **Manual Testing:** Verified workspace creation, sidebar switching, and logout functionality.

### **Phase 3: The Ledger (Expenses)**

* **Tasks:**  
  * "Add Expense" Dialog with spatial expansion animation.  
  * "Settle Up" math logic.  
* **🛑 CHECKPOINT:**  
  * **Test:** Create convex/splits.test.ts. Mock 2 users, add $100 expense, verify debt calculation.  
  * **Run:** npx vitest run splits.

### **Phase 4: E2E & Polish**

* **Tasks:**  
  * Implement safe-area padding for mobile notches.  
  * Run Playwright tests for full critical path.

---

## **5\. UI/UX Design System**

**Concept:** "Delightful Wellness" (OtterLife Design System).

### 5.1 Color Palette ("OtterLife")

* **Royal Otter Blue:** #6C5CE7 (Primary Actions, Headers, Active States)
* **Fresh Water:** #74B9FF (Secondary Backgrounds, Progress Bars)
* **Warm Coral:** #FAB1A0 (Warmth, Energy)
* **Sleepy Lavender:** #A29BFE (Evening Mode)
* **Cloud White:** #F7F9FC (App Backgrounds)
* **Functional:** Love Pink (#FF7675), Gold Star (#FDCB6E), Success Mint (#55EFC4)

### 5.2 Typography

* **Headings:** Quicksand Bold (Rounded, friendly)
* **Body:** Nunito Bold/Regular

### 5.3 Core UI Elements

* **Cards:** Border Radius 20px, Soft Drop Shadow, Padding 16-24px.
* **Buttons:** Minimum touch target 44x44pt.

---

## **6\. Agents.md (Rules of Engagement)**

1. **Testing First:** Do not mark a Phase as complete until the specific **CRITICAL CHECKPOINT** (Vitest/Playwright) tests pass.
2. **Sustainability:**
    * **Lazy Load:** All heavy routes.
    * **Icon Import:** Import individual icons (e.g., import { Wallet } from 'lucide-react').
3. **Spatial Context:** All modals must use BackdropBlur and Framer Motion for entry/exit.
4. **Strict Types:** No any.
5. **Convex Patterns:** Use ctx.auth.getUserIdentity() for security.

---

## **7\. Authentication Implementation Notes**

### **Convex Authentication Architecture**

**CRITICAL:** Use this pattern from the beginning to avoid complex debugging.

#### **Correct Pattern (Phase 1)**
```typescript
// convex/auth.ts
import { action, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import bcrypt from "bcryptjs";

// ✅ EXPORT internal functions so they're accessible via internal.auth.*
export const checkUserExists = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", args.email)).first();
  }
});

export const createUser = internalMutation({
  args: { email: v.string(), name: v.string(), authUserId: v.string() },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      authUserId: args.authUserId,
      email: args.email,
      name: args.name,
      onboarded: false,
      prefersReducedMotion: false,
    });
    return await ctx.db.get(userId);
  }
});

export const createPassword = internalMutation({
  args: { userId: v.id("users"), password: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("authPasswords", args);
  }
});

export const getPasswordForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.query("authPasswords").withIndex("by_userId", (q) => q.eq("userId", args.userId)).first();
  }
});

// ✅ Actions use internal API references (NOT direct function calls)
export const signup = action({
  args: { email: v.string(), name: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const existingUser = await ctx.runQuery(internal.auth.checkUserExists, { email: args.email });
    if (existingUser) throw new Error("User already exists");

    const hashedPassword = await bcrypt.hash(args.password, 10);

    const user = await ctx.runMutation(internal.auth.createUser, {
      email: args.email,
      name: args.name,
      authUserId: args.email,
    });

    await ctx.runMutation(internal.auth.createPassword, {
      userId: user._id,
      password: hashedPassword,
    });

    return user;
  }
});

export const login = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.auth.checkUserExists, { email: args.email });
    if (!user) throw new Error("Invalid credentials");

    const authPassword = await ctx.runQuery(internal.auth.getPasswordForUser, { userId: user._id });
    if (!authPassword) throw new Error("Invalid credentials");

    const isValid = await bcrypt.compare(args.password, authPassword.password);
    if (!isValid) throw new Error("Invalid credentials");

    return user;
  }
});
```

#### **Common Mistakes (Avoid These!)**
1. **❌ Actions calling `ctx.db` directly** - Actions don't have DB access
2. **❌ Mutations/Actions calling other functions directly** - Use `ctx.runQuery()` / `ctx.runMutation()`
3. **❌ Not exporting internal functions** - They won't be available via `internal.auth.*`
4. **❌ Using `bcryptjs` in queries/mutations** - Only works in actions
5. **❌ Direct function calls from actions** - Use `internal.auth.functionName`

#### **Context Access by Function Type**
- **Queries**: `ctx.db` (read-only), `ctx.auth`
- **Mutations**: `ctx.db` (read-write), `ctx.auth`, `ctx.scheduler`
- **Actions**: `ctx.auth`, `ctx.runQuery()`, `ctx.runMutation()`, `ctx.scheduler` (NO `ctx.db`)

#### **Database Schema**
```typescript
// users table
{
  _id: Id<"users">,
  authUserId: string,     // Email used as authUserId initially
  email: string,
  name: string,
  onboarded: boolean,
  prefersReducedMotion: boolean,
}

// authPasswords table (separate for security)
{
  _id: Id<"authPasswords">,
  userId: Id<"users">,
  password: string,       // bcrypt hashed
}
```

#### **Frontend Integration**
```typescript
// Use useAction for signup/login
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

const signup = useAction(api.auth.signup);
const login = useAction(api.auth.login);
```

#### **Debugging Tips**
- **Error: "Cannot read properties of undefined (reading 'query')"** → Actions can't access `ctx.db`
- **Error: "Convex functions should not directly call other Convex functions"** → Use `ctx.runQuery()` / `ctx.runMutation()`
- **Error: "Couldn't resolve api.auth.functionName"** → Export the function from the module
- **Error: "Can't use setTimeout in queries and mutations"** → Use actions for bcrypt operations


