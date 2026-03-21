# Changelog

All notable changes to this project will be documented in this file.

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
