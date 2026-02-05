
# IMPLEMENTATION PLAN: Advanced Private Email Service

## 0. Project Structure & Global Strategy
**Objective:** Build a scalable, self-hosted email service with guest (10-min) and registered (persistent) user capabilities.
**Stack:** NestJS (Backend), React+Vite (Frontend), PostgreSQL (Primary DB), Redis (Cache/Queue).
**Testing Strategy:** Unit Tests for Logic, E2E Tests for API Routes, Integration Tests for SMTP.

### File Structure Target
```text
/10-min-mail
├── /backend                 # NestJS (Port 3000)
│   ├── /src
│   │   ├── /modules
│   │   │   ├── /auth        # JWT, Guards, Strategies
│   │   │   ├── /users       # User Management
│   │   │   ├── /aliases     # Alias Creation & Expiry Logic
│   │   │   ├── /emails      # Email Retrieval & Storage
│   │   │   ├── /smtp        # The Port 25 Listener
│   │   │   └── /gateway     # WebSocket Hub
│   │   ├── /database        # TypeORM Config & Migrations
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── docker-compose.yml   # Postgres + Redis
│   └── package.json
├── /frontend                # React (Port 5173)
│   ├── /src
│   │   ├── /contexts        # AuthContext
│   │   ├── /hooks           # useSocket, useAliases
│   │   ├── /pages           # Login, Dashboard, Inbox
│   │   └── App.tsx
│   └── package.json
└── plan.md

```

---

## Phase 1: Infrastructure & Database Layer

### Step 1.1: Environment & Monorepo Setup

* **Goal:** Initialize git, create folders, and setup Docker infrastructure.
* **Implementation:**
* Initialize Git. Create `/backend` (NestJS) and `/frontend` (Vite React TS).
* Create root `docker-compose.yml`:
* **Postgres:** Image `postgres:15-alpine`, Port `5432`, Volume `pgdata`.
* **Redis:** Image `redis:alpine`, Port `6379`.


* Create `.env` example in backend (`POSTGRES_HOST`, `REDIS_URL`, `JWT_SECRET`).


* **Tests:**
* Run `docker-compose up -d`. Verify connection to both databases using a simple script or GUI tool (DBeaver/TablePlus).



### Step 1.2: TypeORM & Entity Configuration

* **Goal:** Connect NestJS to Postgres and define the schema.
* **Implementation:**
* Install: `npm i @nestjs/typeorm typeorm pg`.
* Create `User` Entity (`id`, `email`, `password`, `created_at`).
* Create `Alias` Entity (`id`, `address`, `expires_at`, `user_id`, `is_active`).
* Create `Email` Entity (`id`, `sender`, `subject`, `body_text`, `body_html`, `alias_id`).
* Configure `TypeOrmModule.forRoot()` in `app.module.ts`.


* **Tests:**
* Run the app. Check if tables are automatically created in Postgres (using `synchronize: true` for dev).



---

## Phase 2: Authentication & User System

### Step 2.1: User Registration & Password Hashing

* **Goal:** Create users securely.
* **Implementation:**
* Generate `UsersModule`.
* Install `bcrypt`.
* Implement `UserService.create()`: Hash password, save user.


* **Tests (Unit):**
* `users.service.spec.ts`: Mock Repository. Call create -> verify password is hashed (not plain text).



### Step 2.2: JWT Auth Implementation

* **Goal:** Secure the API so only logged-in users can keep emails for 1 week.
* **Implementation:**
* Install `npm i @nestjs/passport passport passport-local passport-jwt @types/passport-jwt`.
* Create `AuthModule`, `LocalStrategy` (Login), `JwtStrategy` (Token verification).
* Create Route: `POST /auth/login` -> Returns `{ access_token }`.
* Create Route: `POST /auth/register`.


* **Tests (E2E):**
* `auth.e2e-spec.ts`: Register a user, Login with credentials, Expect 200 OK + JWT Token.



---

## Phase 3: Core Logic (Aliases & SMTP)

### Step 3.1: Alias Management API

* **Goal:** Create temporary emails.
* **Implementation:**
* Create `AliasesModule`.
* Route `POST /aliases`:
* If Guest: `expires_at = NOW() + 10 min`.
* If Auth User: `expires_at = NOW() + 7 days`.
* Generate random string (e.g., `fox-92@domain`). Save to DB.


* Route `GET /aliases`: Return list of active aliases.


* **Tests (Integration):**
* Call `POST /aliases` as Guest -> Check DB `expires_at` is ~10 mins.
* Call `POST /aliases` as User -> Check DB `expires_at` is ~1 week.



### Step 3.2: SMTP Listener (The Receiver)

* **Goal:** Receive emails on Port 25 and map them to aliases.
* **Implementation:**
* Setup `smtp-server` inside `SmtpModule`.
* `onRcptTo`: Query Postgres `Alias` table.
* If alias exists AND `is_active` AND `expires_at > NOW()` -> Accept.
* Else -> Reject (550 Invalid User).




* **Tests:**
* Manually insert an expired alias in DB. Try to send mail via `telnet` -> Expect rejection.
* Insert valid alias -> Expect acceptance.



### Step 3.3: Email Storage

* **Goal:** Parse and save the incoming stream.
* **Implementation:**
* `onData`: Use `mailparser`.
* Find `Alias` entity.
* Create `Email` entity with parsed content.
* Save to Postgres `emails` table.


* **Tests:**
* Send full email with HTML body. Verify content exists in Postgres `emails` table with correct `alias_id`.



---

## Phase 4: Real-Time Communication

### Step 4.1: WebSocket Setup (Redis Adapter)

* **Goal:** Scalable real-time notifications.
* **Implementation:**
* Install `socket.io-redis` (or `@socket.io/redis-adapter`).
* Create `EventsGateway`.
* Implement `handleConnection`: Verify JWT (optional) or just allow joining alias rooms.
* Event `join_room`: Client sends `{ aliasId }`. Server: `client.join("alias:${aliasId}")`.



### Step 4.2: Connecting SMTP to Socket

* **Goal:** Push notification immediately upon receipt.
* **Implementation:**
* Inject `EventsGateway` into `SmtpService`.
* After `emailRepo.save()`:
`gateway.server.to("alias:" + alias.id).emit("email_received", emailDto)`


* **Tests (E2E):**
* Start Socket Client. Join room. Send SMTP mail. Verify client receives JSON event.



---

## Phase 5: Frontend Implementation

### Step 5.1: Routing & Auth Context

* **Goal:** Handle Guest vs. User views.
* **Implementation:**
* Setup `react-router-dom`.
* `AuthProvider`: Checks for stored JWT.
* Routes: `/` (Landing/Guest), `/dashboard` (User Aliases), `/inbox/:aliasId`.



### Step 5.2: Dashboard & Alias Creation

* **Goal:** UI to generate and view aliases.
* **Implementation:**
* `useAliases` hook: Fetches `GET /aliases`.
* "Create New" button calls `POST /aliases`.
* List view showing "Expires in..." (using `dayjs`).



### Step 5.3: The Live Inbox

* **Goal:** View emails and auto-update.
* **Implementation:**
* `InboxPage`: Fetches historical emails `GET /aliases/:id/emails`.
* Connects Socket.io. Listens for `email_received`. Appends new mail to list.
* `EmailViewer`: Uses `DOMPurify` to render HTML safely.



---

## Phase 6: Maintenance & Polish

### Step 6.1: The Cleanup Cron Job

* **Goal:** Remove old data to save space.
* **Implementation:**
* Install `@nestjs/schedule`.
* Task 1 (Every 10 mins): Update `is_active = false` for aliases where `expires_at < NOW()`.
* Task 2 (Daily): `DELETE FROM emails` where `received_at < 7 days ago`.


* **Tests:**
* Manually trigger the Cron Service method. Verify expired rows are updated/deleted.



### Step 6.2: Rate Limiting

* **Goal:** Prevent abuse.
* **Implementation:**
* Setup `ThrottlerModule`.
* Limit `POST /aliases` to 5 per minute per IP.



### Step 6.3: Final Docker Production Build

* **Goal:** Ready for deployment.
* **Implementation:**
* Create multi-stage Dockerfiles.
* Nginx setup to reverse-proxy port 80 -> Frontend and API.
* Expose Port 25 for the Backend container only.

