# FRONTEND IMPLEMENTATION PLAN: React + Vite + Real-Time Inbox

## 0. Initial Setup & Architecture
**Goal:** Initialize a modern React application with strong typing and styling foundations.
**Stack:** React (Vite), TypeScript, Tailwind CSS, React Router, Vitest.

### Step 0.1: Project Initialization
* **Action:**
    * Run `npm create vite@latest frontend -- --template react-ts`.
    * Install core dependencies: `npm i axios react-router-dom socket.io-client dayjs dompurify framer-motion lucide-react clsx tailwind-merge`.
    * Install dev dependencies: `npm i -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom jsdom`.
    * Initialize Tailwind: `npx tailwindcss init -p`.
* **Configuration:**
    * Update `tailwind.config.js`: Add content paths (`"./index.html", "./src/**/*.{js,ts,jsx,tsx}"`).
    * Update `vite.config.ts`: Set server proxy (optional) or configuring CORS handling instructions.
    * Setup `vitest` in `vite.config.ts` (environment: 'jsdom').
* **Testing:**
    * Run `npm run dev`. Verify the "Vite + React" landing page appears.
    * Run `npm run test`. Verify a simple "2+2=4" test passes.

### Step 0.2: Directory Structure & Base Components
* **Goal:** Create a scalable folder structure.
* **Structure:**
    ```text
    /src
    ├── /api          # Axios instance & endpoints
    ├── /assets       # Static files
    ├── /components   # Reusable UI (Button, Input, Card)
    ├── /context      # AuthContext, ToastContext
    ├── /hooks        # Custom logic (useSocket, useAuth)
    ├── /layouts      # MainLayout (Sidebar + Content)
    ├── /pages        # Home, Login, Inbox, Dashboard
    └── /utils        # Date formatters, Validators
    ```
* **Action:**
    * Create a reusable `Button.tsx` (using `clsx` for variants).
    * Create a `Input.tsx` (with error state handling).
    * Create a `Card.tsx` container.
* **Testing:**
    * `Button.test.tsx`: Render button, click it, verify `onClick` handler fires.

---

## Phase 1: Authentication Layer

### Step 1.1: Axios & API Service
* **Goal:** Centralized HTTP handling with JWT injection.
* **Implementation:**
    * Create `src/api/axios.ts`.
    * Create instance with `baseURL` (from `import.meta.env.VITE_API_URL`).
    * **Interceptors:**
        * Request: Check `localStorage` for `token`. If exists, add `Authorization: Bearer ...`.
        * Response: If 401, clear token & redirect to login (or attempt refresh flow).
* **Testing:**
    * Mock Axios. Call a test endpoint. Verify headers contain the token.

### Step 1.2: Auth Context
* **Goal:** Global state for "Is User Logged In?".
* **Implementation:**
    * Create `src/context/AuthContext.tsx`.
    * State: `user` (null | UserObject), `isLoading` (boolean).
    * Methods: `login(email, password)`, `register(email, password)`, `logout()`.
    * On Mount: Check if token exists in storage. If yes, decode payload (or hit `/auth/me`) to restore session.
* **Testing:**
    * Wrap a test component in `AuthProvider`. Mock the login API. Trigger login -> Assert `user` state updates.

### Step 1.3: Login & Register Pages
* **Goal:** Forms for user entry.
* **Implementation:**
    * Create `src/pages/Login.tsx` and `Register.tsx`.
    * Use `react-hook-form` (optional) or simple controlled inputs.
    * On Submit: Call `auth.login()`.
    * On Success: Navigate to `/dashboard`.
    * On Error: Show error message (Alert/Toast).
    * Add into .env file Key REGISTER=true . only if key is set and true registration is allowed in frontend and backend (other wise hide buttons)
* **Testing:**
    * Fill out form with invalid email. Assert validation error appears.

---

## Phase 2: Core Feature - Guest Alias Generation

### Step 2.1: The Landing Page (Guest View)
* **Goal:** "One-Click" email generation for non-logged-in users.
* **Implementation:**
    * Create `src/pages/Home.tsx`.
    * **UI:** Hero section with a big "Create Temporary Email" button.
    * **Action:**
        * Click -> `POST /aliases` (no token).
        * Response -> `{ address, expires_at }`.
        * Save to `localStorage` (key: `guest_alias`).
        * Redirect to `/inbox/:address`.
* **Testing:**
    * Mock API response. Click button. Verify API call and navigation.

### Step 2.2: Countdown Timer Component
* **Goal:** Show urgency ("Expires in 09:59").
* **Implementation:**
    * Create `src/components/Timer.tsx`.
    * Props: `expiresAt` (ISO String).
    * Logic: `setInterval` every 1s. Calculate `diff = expiresAt - now`.
    * Formatting: `mm:ss` or `D days H hours` (using `dayjs`).
    * Edge Case: If `diff <= 0`, emit `onExpire` event.
* **Testing:**
    * Pass a time 10s in future. Advance timers (Vitest fake timers). Verify text updates and reaches "00:00".

---

## Phase 3: The Real-Time Inbox (Socket.io)

### Step 3.1: Socket Hook (`useSocket`)
* **Goal:** Manage WebSocket connection lifecycle.
* **Implementation:**
    * Create `src/hooks/useSocket.ts`.
    * Accepts `aliasId` as argument.
    * `useEffect`:
        * Initialize `io(URL)`.
        * `socket.emit('join_room', { aliasId })`.
        * `socket.on('email_received', (data) => callback(data))`.
        * Cleanup: `socket.disconnect()`.
* **Testing:**
    * Mock `socket.io-client`. Mount hook. Verify `join_room` is emitted with correct ID.

### Step 3.2: Inbox Layout & List
* **Goal:** Display list of emails (Sidebar/Split View).
* **Implementation:**
    * Create `src/pages/Inbox.tsx`.
    * **Fetch History:** On mount, `GET /aliases/:id/emails`. Set `emails` state.
    * **Live Updates:** Use `useSocket`. On new mail, prepend to `emails` array.
    * **UI:** List of `InboxItem` (Sender, Subject, Time).
        * Active item highlighted.
        * "Empty State" illustration if no emails.

### Step 3.3: Email Viewer (Security Critical)
* **Goal:** Render HTML content safely.
* **Implementation:**
    * Create `src/components/EmailViewer.tsx`.
    * Props: `email` object.
    * **Sanitization:**
        ```typescript
        const cleanHtml = DOMPurify.sanitize(email.body_html, {
            USE_PROFILES: { html: true },
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed']
        });
        ```
    * **Render:** `<div dangerouslySetInnerHTML={{ __html: cleanHtml }} />`.
    * **Styling:** Use a Shadow DOM or a CSS Reset specific to this div to prevent email styles from breaking your app layout.
* **Testing:**
    * Pass HTML with `<script>alert(1)</script>`. Assert script is stripped from output.

---

## Phase 4: User Dashboard (Registered Features)

### Step 4.1: Dashboard Layout
* **Goal:** Manage multiple long-term aliases.
* **Implementation:**
    * Create `src/pages/Dashboard.tsx` (Protected Route).
    * Fetch: `GET /aliases`.
    * **Table:** Address, Created At, Expires At, Status (Active/Expired).
    * **Actions:** "Create New Alias", "Delete", "Extend Time".

### Step 4.2: Alias Actions
* **Goal:** CRUD operations for aliases.
* **Implementation:**
    * **Create:** Modal popup -> `POST /aliases`. Refresh list.
    * **Extend:** Button "Add 1 Hour" -> `PATCH /aliases/:id/extend`.
    * **Delete:** Confirmation -> `DELETE /aliases/:id`.
    * **Navigate:** Clicking an alias row redirects to `/inbox/:id`.

---

## Phase 5: Polish & UX

### Step 5.1: Notifications (Toasts)
* **Goal:** Feedback for actions (e.g., "Email Copied", "New Mail Arrived").
* **Implementation:**
    * Install `react-hot-toast` or build simple context.
    * Trigger toast on:
        * Socket event "email_received".
        * Copy to clipboard success.
        * API Errors.

### Step 5.2: Copy to Clipboard
* **Goal:** Quick usage.
* **Implementation:**
    * Component `CopyButton`.
    * Logic: `navigator.clipboard.writeText(address)`.
    * Icon changes from "Copy" to "Checkmark" for 2s.

### Step 5.3: Mobile Responsiveness
* **Goal:** Usable on phones.
* **Implementation:**
    * **Inbox:** On mobile, showing "List" hides "Viewer". Clicking item shows "Viewer" (full screen) with "Back" button.
    * **Sidebar:** Collapsible hamburger menu.

### Step 5.4: Production Build
* **Goal:** Optimize for Nginx serving.
* **Implementation:**
    * Run `npm run build`.
    * Check `dist/` folder.
    * Verify `index.html` loads assets correctly.