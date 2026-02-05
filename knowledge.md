# KNOWLEDGE BASE: Private Temporary Email Service (Advanced)

## 1. Project Overview
**Type:** Advanced Disposable Email Service (Self-Hosted)
**Goal:** A full-stack system where users can generate random email addresses ("aliases"), receive emails via SMTP in real-time, and manage their duration.
**Scope Upgrade:**
* **Accounts:** Users can sign up to save their aliases.
* **Persistence:** Emails can live for 10 minutes (Guest) or up to 1 week (Registered).
* **Communication:** Full bidirectional WebSocket sync.
* **Security:** Rate limiting, JWT Authentication, and HTML Sanitization.

- sign in , auth is necessary cant use app without sign in
- highly secure robust app
- use many offical libs and packages to make development fast efficent and robust
- toolbar delete, edit, copy, refresh (refresh inbox), (+10min, +hour, day, week, month), timer dispaly with circle progress
- inbox, download and delete email + click on emails view them, secure sanatized, warning with links, add option to activate them
- create custom naming for email, check in db if it already exists (or if it ever existed)

---

## 2. Architecture & Tech Stack

### High-Level Data Flow
1.  **SMTP Layer:** Node.js server listens on **Port 25**. Receives raw stream -> Parses -> Saves to DB.
2.  **Database Layer (PostgreSQL):** Persistent storage for Users, Aliases, and Email Content.
3.  **Caching Layer (Redis):** Handles Rate Limiting, Session/PubSub for WebSockets, and short-term job queues.
4.  **API Layer (NestJS):** REST endpoints for Auth, Alias Management, and Time Extension.
5.  **Real-Time Layer (Socket.io):** Backend "pushes" new email events to the Frontend immediately.

### Technology Selection
| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Backend** | **NestJS** | Scalable, modular, excellent support for TypeORM & WebSockets. |
| **Database** | **PostgreSQL** | Relational data integrity for Users and Emails (better than Redis for 1-week storage). |
| **ORM** | **TypeORM** | TypeScript-first ORM for managing Postgres schemas and migrations. |
| **Cache/Queue** | **Redis** | Required for Socket.io adapters (multi-instance), throttling, and caching. |
| **Auth** | **Passport-JWT** | Stateless authentication using Access (15m) and Refresh Tokens (7d). |
| **Rate Limiting** | **@nestjs/throttler** | Prevents abuse of the "Create Email" API. |
| **Frontend** | **React + Vite** | Fast SPA with `socket.io-client`. |
| **Styling** | **Tailwind CSS** | Utility-first styling. |

---

## 3. Database Schema (PostgreSQL)

### Entity Relationship Diagram (Text)
* **User** (1) ↔ (Many) **Alias**
* **Alias** (1) ↔ (Many) **Email**

### Table Definitions

#### A. `users`
*Registered users who can keep emails for longer durations.*

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, Generated | Unique User ID. |
| `email` | VARCHAR | Unique, Not Null | Login email (real). |
| `password` | VARCHAR | Not Null | Bcrypt hash. |
| `created_at` | TIMESTAMP | Default NOW() | |

#### B. `aliases`
*The temporary email addresses (e.g., `purple-fox@yourdomain.com`).*

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, Generated | Internal ID. |
| `address` | VARCHAR | Unique, Not Null | The full email address. |
| `user_id` | UUID | FK (users), Nullable | Null = Guest (10 min). Not Null = Registered. |
| `expires_at` | TIMESTAMP | Not Null | When this alias stops receiving mail. |
| `is_active` | BOOLEAN | Default True | Soft delete flag. |

#### C. `emails`
*The actual messages received.*

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, Generated | |
| `alias_id` | UUID | FK (aliases) | Which alias received this? |
| `sender` | VARCHAR | Not Null | `from` address. |
| `subject` | VARCHAR | Nullable | |
| `body_text` | TEXT | Nullable | Plain text version. |
| `body_html` | TEXT | Nullable | HTML version (Sanitize before render!). |
| `received_at` | TIMESTAMP | Default NOW() | |

---

## 4. Backend Routes & API Specification

### A. Authentication Module (`/auth`)
* `POST /auth/register`
    * **Body:** `{ email, password }`
    * **Action:** Creates user in Postgres.
* `POST /auth/login`
    * **Body:** `{ email, password }`
    * **Response:** `{ accessToken, refreshToken }`
* `POST /auth/refresh`
    * **Body:** `{ refreshToken }`
    * **Action:** Issues new Access Token.

### B. Alias Module (`/aliases`)
* `POST /aliases` (Rate Limited: 5/min IP)
    * **Header:** `Authorization: Bearer <token>` (Optional)
    * **Body:** `{ domain: "yourdomain.com" }` (Optional custom prefix if admin)
    * **Action:** Generates random address (e.g., `xy92z@...`). Sets `expires_at` (10 min for guest, 1 week for user).
* `GET /aliases`
    * **Header:** `Authorization: Bearer <token>`
    * **Action:** Lists all active aliases for the logged-in user.
* `PATCH /aliases/:id/extend`
    * **Body:** `{ duration: 600 }` (seconds)
    * **Action:** Updates `expires_at`. (Guests max 1 hour total, Users max 1 month).
* `DELETE /aliases/:id`
    * **Action:** Sets `is_active = false`. SMTP server stops accepting mail for this address.

### C. Emails Module (`/aliases/:id/emails`)
* `GET /aliases/:id/emails`
    * **Action:** Returns historical emails from DB (Pagination: `limit=20, offset=0`).
* `GET /emails/:emailId`
    * **Action:** Returns full content including large HTML bodies.
* `DELETE /emails/:emailId`
    * **Action:** Hard delete specific message.

---

## 5. WebSocket Communication (Real-Time)

**Namespace:** `/`
**Transporter:** `Socket.io` with Redis Adapter (for scaling).

### Events (Client → Server)
* **`join_room`**
    * **Payload:** `{ aliasId: "uuid" }`
    * **Logic:** Client validates they own the alias (or it's a public guest alias). Server adds socket to room `alias:uuid`.

### Events (Server → Client)
* **`email_received`**
    * **Trigger:** SMTP Service finishes parsing a new incoming mail.
    * **Payload:**
        ```json
        {
          "id": "uuid",
          "sender": "amazon@auth.com",
          "subject": "Your Code is 1234",
          "preview": "Your login code is...",
          "received_at": "2024-02-05T12:00:00Z"
        }
        ```
* **`alias_expired`**
    * **Trigger:** Cron job detects `expires_at` < NOW().
    * **Action:** Frontend shows "Session Ended" modal.

---

## 6. Project File Structure

```text
/my-email-service
├── /backend (NestJS)
│   ├── /src
│   │   ├── /config          # Env variables & ThrottlerConfig
│   │   ├── /modules
│   │   │   ├── /auth        # Passport, JWT Strategy, Guards
│   │   │   ├── /users       # User Entity & Service
│   │   │   ├── /aliases     # Alias Entity, Creation Logic
│   │   │   ├── /emails      # Email Entity, Controller
│   │   │   ├── /smtp        # SmtpServer (Port 25 listener)
│   │   │   └── /gateway     # WebSocket Gateway
│   │   ├── /database
│   │   │   └── data-source.ts # TypeORM Config
│   │   └── app.module.ts
│   ├── Dockerfile
│   └── package.json
├── /frontend (React + Vite)
│   ├── /src
│   │   ├── /api             # Axios instances
│   │   ├── /auth            # AuthContext (Login/Logout)
│   │   ├── /components      # Inbox, Timer, LoginModal
│   │   └── /socket          # useSocket hook
├── /infrastructure
│   ├── docker-compose.yml   # Postgres, Redis, Backend, Frontend
│   └── nginx.conf           # Reverse Proxy (Port 80 -> 3000/5173)
└── knowledge.md
````

---

## 7. Implementation Details & Snippets

### JWT Strategy (Guarding Routes)

In `backend/src/modules/auth/jwt.strategy.ts`:

TypeScript

```
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // Returns the user object to the Request
    return { userId: payload.sub, email: payload.email };
  }
}
```

### Rate Limiting (Preventing Spam)

In `app.module.ts`:

TypeScript

```
ThrottlerModule.forRoot({
  ttl: 60, // 1 minute
  limit: 10, // Max 10 requests per minute
})
```

Apply to controller:

TypeScript

```
@UseGuards(ThrottlerGuard)
@Post('/aliases')
createAlias() { ... }
```

### SMTP to Database Logic

In `smtp.service.ts` (Inside `onData`):

TypeScript

```
// 1. Check if Alias exists and is active
const alias = await this.aliasRepo.findOne({ 
  where: { address: parsed.to.text, is_active: true } 
});

if (!alias) return callback(new Error("Address not found or expired"));

// 2. Save Email to Postgres
const newEmail = this.emailRepo.create({
  alias,
  sender: parsed.from.text,
  subject: parsed.subject,
  body_html: parsed.html,
  body_text: parsed.text
});
await this.emailRepo.save(newEmail);

// 3. Emit via WebSocket
this.emailGateway.server.to(`alias:${alias.id}`).emit('email_received', newEmail);
```

---

## 8. Critical Attention Points

1. **Database Pruning (Cron Jobs):
    - You need a service (e.g., `@nestjs/schedule`) running every hour to soft-delete expired aliases and hard-delete emails older than the retention policy (e.g., 7 days) to save disk space.
        
2. **HTML Sanitization (Frontend):
    - **Always** run incoming HTML through `DOMPurify` on the client. Malicious emails _will_ try to execute JS tokens in your dashboard.
        
3. **Postgres Connection Handling:
    - SMTP is a "stream". Do not hold the database transaction open for the entire duration of the email reception (which can take seconds). Buffer the stream, parse it, _then_ open a quick DB connection to save.
        
4. **JWT Security:
    - Store `refreshToken` in an **HttpOnly Cookie**, not LocalStorage, to prevent XSS attacks from stealing user sessions.
        
5. **Environment Variables:
    - `JWT_SECRET
    - `POSTGRES_PASSWORD`
    - `REDIS_URL`
    - `DOMAIN_NAME` (e.g., "https://www.google.com/search?q=mail.myserver.com")