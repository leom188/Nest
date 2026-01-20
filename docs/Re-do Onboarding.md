Our track expenses app is not like others. Most expense trackers are either strictly individual or require a complex "IOU" system that feels like a chore. By distinguishing between **Split Tracking** (debts) and **Joint Bags** (shared pools), you're solving the two most common ways couples and roommates handle money.

Here is a breakdown of how to polish these functionalities and a proposed onboarding flow.

---

## **1\. Refining the Workspace Logic**

To keep the app from feeling cluttered, the "Workspace" should act like a **context switch**.

### **A. The Split Workspace (The "Settlement" Model)**

In this mode, the goal is transparency regarding debt.

* **The "Settlement Hero":** Instead of just numbers, use a "Net Position" card.  
  * *Example:* "You are up **$150**. Ale owes you." or "You are down **$40**. Pay Ale."  
* **Distribution Logic:** \* **Income-Weighted:** The app calculates the split based on $User A / (User A \+ User B) \\times 100$.  
  * **Manual Override:** For one-off expenses (e.g., "I'm treating you to this dinner"), a 100/0 toggle is essential.

### **B. The Joint Bag (The "Virtual Wallet" Model)**

This functions like a shared digital checking account.

* **Funding Phase:** At the start of the month, the app "requests" the contributions from both users to reach the target "Bag Total."  
* **The "Burn Rate" Visual:** Since this is a fixed pot, show a progress bar of the remaining "Bag" funds.  
* **Savings Logic:** Anything left in the bag at the end of the month should automatically move to a "Shared Savings" history tab.

---

## **2\. The Onboarding Flow**

You asked whether users should start with a personal workspace or choose immediately. I recommend a **Hybrid Approach**. Forcing a shared setup immediately can be high-friction, but hiding it makes the app look "generic."

### **Proposed Step-by-Step Onboarding**

1. **The Identity Phase:** \* Basic account creation (Name/Email).  
   * *Question:* "How do you plan to track?" (Options: "Just me," "With a partner/roommate," "Both").  
2. **The Personal Anchor:** \* Create the **Personal Workspace** by default. This ensures the user has a "safe space" for their own data immediately.  
3. **The "Shared" Invitation (The "Pairing" Screen):**  
   * If they selected "With a partner," show a dedicated screen: *"Ready to sync up? Send a pair-code to your partner."* \* *Crucial:* One person should "host" the configuration (set the % splits or the Bag amount) and the other "accepts."  
4. **The Configuration Wizard (Shared Only):**  
   * Once paired, ask: *"How do you want to manage shared money?"*  
   * **Option 1: The Split (50/50 or % based).**  
   * **Option 2: The Joint Bag (Monthly pot).**  
   * The app then sets the default view for the Shared Workspace based on this choice.

---

## **3\. UI/UX Considerations for Shared Spaces**

To ensure the "Shared" vs. "Personal" distinction is clear:

| Feature | Personal Workspace | Shared Workspace |
| :---- | :---- | :---- |
| **Color Palette** | Neutral (e.g., Blue/Grey) | Vibrant (e.g., Green/Purple) |
| **Top Nav** | "My Expenses" | "Our Expenses" |
| **Quick Action** | Add Expense | Add Expense \+ "Who Paid?" Toggle |
| **Privacy** | Only you can see this. | Syncs instantly with partner. |

**Pro-Tip:** Include a "Transfer to Shared" button on personal expenses. Often, we buy something individually and realize later, "Oh, this was for the house." A one-tap move is a huge quality-of-life feature.

---

## **4\. Addressing Your Configuration Question**

You mentioned being unsure about how to present the "Split vs. Joint Bag" choice. Think of them as **"Financial Personalities."** \* **"The Fair Splitter" (Split Mode):** For those who prefer keeping their bank accounts separate and just want to make sure the math is right at the end of the month.

* **"The Common Pot" (Joint Bag):** For those who have a unified budget and treat their shared money as a single resource.

By framing them as "Modes" you can switch between, you allow the app to grow with the user (e.g., a couple might start with "Split" and move to "Joint Bag" as they get more serious).

**To help you move from concept to development, I have organized the documentation into three key parts: the Onboarding User Journey, the Core Functionalities (PRD style), and the Calculation Logic for the "Settlement Hero" and "Joint Bag" sections.**

---

## **1\. Onboarding User Journey**

**This flow minimizes friction while ensuring the "Shared Workspace" isn't hidden.**

| Step | Action | Description |
| :---- | :---- | :---- |
| **1\. Identity** | **Email/Social Login** | **Basic account creation.** |
| **2\. Intent** | **Choice Screen** | **"How will you use the app?" Options: *Just for me*, *With a partner*, or *Both*.** |
| **3\. Default Setup** | **Auto-Provision** | **Personal Workspace is created instantly as the default landing page.** |
| **4\. The "Pair"** | **Invitation** | **If "Partner/Both" was chosen: User generates a 6-digit code or link to send to their partner.** |
| **5\. Configuration** | **The Mode Selector** | **Once the partner joins, the Host selects the Shared Mode: Split Tracking or Joint Bag.** |
| **6\. The "First Win"** | **Add Expense** | **Prompt the user to log their first expense in either workspace to see the logic in action.** |

---

## **2\. Product Functionality & User Stories**

### **The Workspace Switcher**

* **Feature: A top-level toggle (sidebar or dropdown) to switch between "Personal," "Shared (e.g., Household)," or "Custom Groups."**  
* **User Story: *As a user, I want to keep my personal hobbies separate from my shared rent expenses so that my partner doesn't see my private spending and our shared math stays clean.***

### **Workspace Type A: Split Tracking (The "Settlement" Model)**

* **Feature: Default 50/50 split with "Income-Weighted" or "Custom %" options.**  
* **The "Settlement Hero": A dashboard card that aggregates all shared expenses and provides a "who owes whom" summary.**  
* **User Story: *As a partner who earns more, I want to set a 60/40 split based on our incomes so that our shared expenses are distributed fairly.***

### **Workspace Type B: Joint Bag (The "Virtual Wallet" Model)**

* **Feature: A target monthly "Bag Total."**  
* **Funding: Shows how much each person has contributed toward the goal.**  
* **User Story: *As a couple with a joint budget, I want to see how much "Bag money" we have left for groceries this month so we don't overspend.***

---

## **3\. Technical Calculation Logic**

**To ensure your developers (or you, when coding) have the right math, here is the logic for the "Hero" sections:**

### **A. Split Settlement Logic**

**For any month, the app calculates:**

1. **Total Spent (TS): Sum of all expenses in the shared workspace.**  
2. **User A's Target ($T\_A$): $TS \\times \\text{User A's \\% share}$**  
3. **User A's Paid ($P\_A$): Sum of expenses actually paid by User A.**  
4. **The Settlement:**  
   * **If $P\_A \> T\_A$, User B owes User A the difference: $P\_A \- T\_A$.**  
   * **If $P\_A \< T\_A$, User A owes User B the difference: $T\_A \- P\_A$.**

### **B. Joint Bag Logic**

1. **Bag Goal: $Goal \= Contribution\_A \+ Contribution\_B$**  
2. **Current Balance: $Goal \- \\sum(\\text{Expenses})$**  
3. **Savings: $Balance\_{\\text{end of month}}$**  
4. **Visuals:**  
   * **The Progress Bar: $(\\text{Spent} / \\text{Goal}) \\times 100$.**  
   * **The Funding Status: $(\\text{Actual Contribution} / \\text{Expected Contribution})$.**

---

## **4\. Proposed UI Elements**

* **The "Context Bar": A colored bar at the top of the screen (e.g., Blue for Personal, Green for Shared) so the user always knows where they are logging.**  
* **The "Quick-Flip" Toggle: Inside the "Add Expense" screen, a toggle to "Move to Shared" in case they accidentally started logging a personal item that was actually for the house.**

**Would you like me to create a technical data schema (tables and relationships) for how the database should handle these two different workspace types?**

**import { defineSchema, defineTable } from "convex/server";**

**import { v } from "convex/values";**

**export default defineSchema({**

  **users: defineTable({**

    **authUserId: v.string(),**

    **name: v.string(),**

    **email: v.string(),**

    **income: v.optional(v.number()), // Essential for "income-weighted" splits**

    **avatarUrl: v.optional(v.string()),**

    **onboarded: v.boolean(),**

    **prefersReducedMotion: v.boolean(),**

  **})**

    **.index("by\_authUserId", \["authUserId"\])**

    **.index("by\_email", \["email"\]),**

  **authPasswords: defineTable({**

    **userId: v.id("users"),**

    **password: v.string(),**

  **}).index("by\_userId", \["userId"\]),**

  **workspaces: defineTable({**

    **name: v.string(),**

    **// Added "personal" to allow for the default workspace logic**

    **type: v.union(v.literal("personal"), v.literal("split"), v.literal("joint")),**

    **currency: v.string(),**

    **// Logic for splitting**

    **splitMethod: v.union(v.literal("50/50"), v.literal("income"), v.literal("custom")),**

    **// Suggestion: store customSplitConfig as a Map/Record of UserId \-\> Percentage**

    **customSplitConfig: v.optional(v.record(v.id("users"), v.number())),** 

    **// New: For "Joint Bag" mode**

    **monthlyTarget: v.optional(v.number()),** 

  **}),**

  **members: defineTable({**

    **workspaceId: v.id("workspaces"),**

    **userId: v.id("users"),**

    **role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),**

    **joinedAt: v.number(),**

    **// New: Track how much this specific member contributed to the "Bag" this month**

    **monthlyContribution: v.optional(v.number()),** 

  **})**

    **.index("by\_workspaceId", \["workspaceId"\])**

    **.index("by\_userId", \["userId"\])**

    **.index("by\_workspaceId\_and\_userId", \["workspaceId", "userId"\]),**

  **expenses: defineTable({**

    **workspaceId: v.id("workspaces"),**

    **paidBy: v.id("users"),**

    **amount: v.number(),**

    **description: v.string(),**

    **category: v.string(),**

    **date: v.number(),**

    **receiptImageUrl: v.optional(v.string()),**

    **isRecurring: v.boolean(),**

    **recurrenceRule: v.optional(v.string()),**

    **// Useful for overriding the default workspace split on a per-expense basis**

    **splitDetails: v.optional(v.record(v.id("users"), v.number())),** 

  **})**

    **.index("by\_workspaceId", \["workspaceId"\])**

    **.index("by\_paidBy", \["paidBy"\])**

    **.index("by\_date", \["date"\]),**

  **// New: To track "Joint Bag" history and savings month-over-month**

  **monthlySnapshots: defineTable({**

    **workspaceId: v.id("workspaces"),**

    **month: v.number(), // timestamp or YYYYMM**

    **totalSpent: v.number(),**

    **totalContributed: v.number(),**

    **remainingSavings: v.number(),**

  **}).index("by\_workspaceId\_and\_month", \["workspaceId", "month"\]),**

  **invitations: defineTable({**

    **workspaceId: v.id("workspaces"),**

    **code: v.string(),**

    **role: v.union(v.literal("admin"), v.literal("member")),**

    **createdBy: v.id("users"),**

    **expiresAt: v.number(),**

    **status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("expired"), v.literal("cancelled")),**

    **acceptedBy: v.optional(v.id("users")),**

  **})**

    **.index("by\_code", \["code"\])**

    **.index("by\_workspaceId", \["workspaceId"\])**

    **.index("by\_status", \["status"\]),**

**});**

