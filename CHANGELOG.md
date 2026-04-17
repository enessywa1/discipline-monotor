# Changelog

All notable changes to this project will be documented in this file.

## [1.4.0-DIRECTORY] - 2026-04-17

### Added
- **Student Registry Folder System**: Restructured the registry into a class-based folder directory for easier navigation.
- **Academic Year Groups**: Pre-configured folders for YR8-YR13 and BTEC Y1-Y2.
- **Smart Counting**: Real-time student count badges on folders.
- **Contextual Registration**: When registering a student from within a folder, the class is automatically pre-selected.

### Fixed
- **Socket.io Stability**: Switched to a CDN for the socket.io client to prevent MIME type failures on Vercel.
- **Manifest Errors**: Fixed root-relative paths for app icons and PWA manifest.
- **Syntax Regressions**: Resolved backtick escaping issues in student suggestion logic.

## [1.3.0-VIBRANT] - 2026-04-17

### Added
- **Universal Student Photos**: Integrated student profile thumbnails across all core modules including Reports, Statements, Watchlist, Detentions, and Suspensions.
- **Enhanced Student Registry**: Expanded student profiles with contact details and picture management.
- **Improved Performance Standings**: Added support for more detailed tracking in the standings module.

### Fixed
- **Auth Logout Loop**: Resolved a critical issue where server restarts would trigger background 401 errors and force a full app logout.
- **Script Stability**: Hardened frontend rendering with null-safety checks for user sessions and student records.
- **Case-Insensitive Student Matching**: Improved SQL joins to ensure students are correctly identified regardless of name casing.

### Changed
- **Premium UI Refinement**: Switched to circular profile avatars (32px) for a more modern, cohesive aesthetic.
- **Notification Logic**: Background notification polls now handle session resets gracefully without interrupting the user.

## [1.2.2-STABLE] - 2026-03-21

### Added
- **About Page Enhancement**: Added detailed section for Performance and a dedicated "How to Download" (PWA Installation) guide.
- **Improved UI Layout**: Optimized the About page grid and animations for a more premium experience.

### Changed
- **Version Bump**: Incremented system version to `1.2.2-STABLE`.

## [1.2.1-STABLE] - 2026-03-21

### Changed
- **Version Synchronization**: Unified version numbers across `package.json`, `package-lock.json`, `about.js`, and `setup-postgres.js` to `1.2.1-STABLE`.
- **Git Tracking**: Added `routes/settings.js` to version control.

## [1.2.0-STABLE] - 2026-03-21

### Added
- **My Records Area**: Dedicated workspace for Staff to manage their own submissions.
- **Role-Based Visibility**: Strict rules for discipline records and task management.
- **Asynchronous Notifications**: Reworked backend for instant form submissions.
- **Optimistic UI**: Snappier interactions for task status changes.
- **Duplicate Protection**: Submit button disabling and visual feedback on all forms.

### Fixed
- **Statistics Chart**: Resolved critical issue where analytics failed to load due to undefined function.

### Performance
- **Database Indexing**: Added indexes for student names, staff IDs, and dates.
- **Artificial Delay Removal**: Removed loading delays from login and dashboard.

## [1.0.0] - 2026-03-11

### Initial Release
- Core School Discipline Department Admin System.
- Basic student and discipline record management.
- Dashboard analytics and task tracking.
