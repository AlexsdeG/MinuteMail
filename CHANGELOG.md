# Changelog

All notable changes to the MinuteMail monorepo will be documented in this file.

## [0.2.4] - 2026-02-05

### Added
- **Settings Page**: New account management page with profile display, password change, and email change functionality
- **Master Admin System**: First registered user automatically becomes master admin with special privileges
- **Invite System**: Master admin can create time-limited invite links to allow registration even when disabled
  - Invite links can be restricted to specific email addresses
  - Invites can be revoked and tracked (used/expired status)
- **Email Sender Service**: Nodemailer-based email service for sending verification and invite emails (SMTP config required)
- Settings link added to navigation header for logged-in users

### Changed
- Registration page now supports invite token query parameter (`?invite=TOKEN`)
- Auth response now includes `isMasterAdmin` flag for frontend access control
- User model extended with `isMasterAdmin` and `emailVerified` fields

### Database
- Added `isMasterAdmin` (Boolean) field to User model - first user defaults to true
- Added `emailVerified` (Boolean) field to User model
- Added `InviteToken` model for invite link management

### Environment Variables (New)
- `SMTP_HOST` - SMTP server hostname
- `SMTP_MAIL_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `SMTP_FROM` - Default from email address

## [0.2.3] - 2026-02-05

### Added
- **Inbox Toolbar**: Full-featured toolbar with delete, download, copy, refresh, and time extension options (+10min, +1hour, +1day, +1week, +1month)
- **Circular Progress Timer**: Visual timer with progress ring showing remaining time in days/weeks format
- **Email Management**: Mark emails as read/unread, download as .eml, bulk delete, secure HTML viewing
- **Secure Email Viewing**: DOMPurify sanitized HTML with disabled links by default and link activation controls with warning modal
- **Custom Alias Naming**: Create aliases with custom names, real-time availability check including historical usage
- **Alias Pause/Resume**: Temporarily pause alias to drop incoming emails
- **Unread Badge**: Dashboard shows unread email count per alias with visual badge
- **Extended Time Display**: Timer now shows days/weeks for longer durations

### Changed
- Completely redesigned Inbox UI with modern toolbar, email list with selection, and secure email viewer
- Dashboard alias list with enhanced controls (pause/resume, unread badges, reload button)
- Timer component supports extended format display with days/weeks

### Database
- Added `isPaused` field to Alias model
- Added `isRead` field to Email model
- Added `UsedAddress` table for custom name history tracking

## [0.2.2] - 2026-02-05

### Fixed

- **Auth Response Format**: Backend now returns `accessToken` (camelCase) and `user` object to match frontend expectations.
- **WebSocket Event Name**: Frontend now emits correct `join_alias` event (was `join_room`).
- **Missing Entity Field**: Added `createdAt` field to Alias entity for proper Dashboard sorting.

### Changed

- Updated bcrypt to bcryptjs for better cross-platform compatibility.

### Infrastructure

- Added root-level CHANGELOG.md for monorepo versioning.

