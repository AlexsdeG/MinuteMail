# Changelog

All notable changes to the MinuteMail monorepo will be documented in this file.

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

