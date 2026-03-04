# Source Code

This directory contains the core WinCC OA functionality and utilities.

## Structure

- `types/` - TypeScript type definitions
  - `components/` - WinCC OA component base classes and implementations
  - `project/` - Project management and registry handling
  - `localization/` - Language and localization support
  - `logs/` - Log parsing and error handling
  - `status/` - Manager status tracking
  - `version/` - Version information utilities
- `utils/` - Utility functions and helpers
- `index.ts` - Main library exports

## Key Features

### Component Management (`types/components/`)

- **WinCCOAComponent**: Abstract base class for all WinCC OA components
  - Detached process spawning with proper Windows support
  - Process timeout handling for tests and production
  - Version-specific component execution
  - Automatic executable discovery across installed versions
  - Stdout/stderr capture with timestamped logging

### Project Registry (`types/project/`)

- **ProjEnvProjectRegistry**: Automatic project registration tracking
  - File system watcher for real-time pvssInst.conf monitoring
  - 500ms debounced cache refresh to handle rapid file changes
  - Automatic cache invalidation on configuration changes
  
- **ProjEnvProject**: Complete project lifecycle management
  - Async project registration with retry logic
  - Polling-based status verification with proper async/await
  - Automatic registry reload between status checks

### Utilities (`utils/`)

- Path resolution for WinCC OA installations
- Version detection and comparison
- Localization helpers
- Log parsing utilities

## Recent Improvements

### Process Management

- Fixed detached process spawning on Windows using `stdio: 'ignore'` and `unref()`
- Added configurable timeout support to prevent hanging processes
- Improved error handling with descriptive timeout messages

### Project Registration

- Fixed async sleep operations in registration polling loops
- Implemented automatic registry reloading during status checks
- Added retry logic to handle transient file system delays
- Extended registration timeout to 5 seconds (50 attempts × 100ms)

### Debugging & Observability

- Added ISO 8601 timestamps to all console output
- Enhanced logging for file watcher events
- Detailed cache size reporting during registry reloads

## Testing

The library includes comprehensive test suites:

- **Unit tests**: Component behavior, parsing logic
- **Integration tests**: Project registration, version detection
- Tests now exit immediately on first failure with `--test-force-exit`

---

## 🎉 Thank You

Thank you for using WinCC OA tools package!
We're excited to be part of your development journey. **Happy Coding! 🚀**

---

## Quick Links

• [📦 VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mPokornyETM.wincc-oa-projects)

---

<center>Made with ❤️ for and by the WinCC OA community</center>
