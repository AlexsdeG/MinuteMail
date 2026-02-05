# Changelog

All notable changes to the MinuteMail monorepo will be documented in this file.

## [0.2.2] - 2026-02-05

### Fixed

- **Auth Response Format**: Backend now returns `accessToken` (camelCase) and `user` object to match frontend expectations.
- **WebSocket Event Name**: Frontend now emits correct `join_alias` event (was `join_room`).
- **Missing Entity Field**: Added `createdAt` field to Alias entity for proper Dashboard sorting.

### Changed

- Updated bcrypt to bcryptjs for better cross-platform compatibility.

### Infrastructure

- Added root-level CHANGELOG.md for monorepo versioning.
