# Changelog

## [0.0.7] - 2024-05-22
### Security & Robustness
- **Strict HTML Sanitization**: `EmailViewer` now uses an allow-list approach for DOMPurify to prevent XSS and layout breakage.
- **Auth Resilience**: Implemented global 401 error handling via event dispatching to ensure immediate logout upon token expiry.

### Added
- **Email Actions**: Added "Download" (as .html) and "Delete" buttons to the Email Viewer.
- **Custom Aliases**: Users can now specify a custom prefix when creating an alias in the Dashboard.
- **Tests**: Updated tests for EmailViewer to cover new actions.

## [0.0.6] - 2024-05-22
### Added
- **Notifications**: Integrated `react-hot-toast` for application-wide alerts (New Email, Copy Success, Errors).
- **CopyButton**: Reusable component with "Copied!" feedback state.
- **Mobile UX**: 
  - Inbox now acts as a native mobile app with split-view navigation (List ↔ Detail).
  - Added "Back" navigation for mobile email viewing.
- **Dependency**: Added `react-hot-toast` to import map.

## [0.0.5] - 2024-05-22
### Added
- **User Dashboard**: Full CRUD management for persistent aliases.
- **Alias Management**: Create, Delete, and Extend duration (1 hour) for aliases.
- **Modal Component**: Reusable UI component for dialogs.
- **Dashboard UI**: List view with status indicators and quick actions.
- **Tests**: Integration tests for Dashboard API interactions.

## [0.0.4] - 2024-05-22
### Added
- **Real-Time WebSockets**: Implemented `useSocket` hook for live email delivery updates.
- **Inbox Functionality**: Complete split-view inbox with email list and detail viewer.
- **Secure Email Rendering**: Added `EmailViewer` component using `DOMPurify` to sanitize HTML content.
- **Dependencies**: Added `socket.io-client`, `dompurify`, and `dayjs`.
- **Tests**: Unit tests for socket connection logic and HTML sanitization.

## [0.0.3] - 2024-05-22
### Added
- **Guest Alias Generation**: Home page now supports one-click temporary email creation via API.
- **Timer Component**: Visual countdown for email expiration.
- **Inbox Updates**: Display alias address and remaining time in the Inbox header.
- **Utils**: Time formatting helper functions.
- **Tests**: Unit tests for Timer component and Home page logic.

## [0.0.2] - 2024-05-22
### Added
- **Authentication Layer**: Implemented JWT-based auth with Axios interceptors.
- **Auth Context**: Global state management for user sessions (`login`, `register`, `logout`).
- **Protected Routes**: Login/Register pages now functional.
- **Layout Updates**: Navigation adapts to login state.
- **Tests**: Added unit tests for AuthContext and API logic.

## [0.0.1] - 2024-05-22
### Added
- Initial project setup with React + TypeScript + Vite structure.
- Configuration for Tailwind CSS (via CDN).
- Base UI components: Button, Input, Card.
- Layout and Routing setup.
- Core types definition.
- Documentation files (Knowledge Base, Plans).
