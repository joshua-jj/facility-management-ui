# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
yarn dev          # Start development server (http://localhost:3000)
yarn build        # Production build
yarn lint         # Run ESLint
yarn prettier     # Format all files with Prettier
```

Docker commands are available for containerized development:
```bash
yarn docker:dev   # Start dev environment with docker-compose
yarn docker:prod  # Start production environment
yarn docker:stop  # Stop and remove containers
```

## Architecture Overview

This is a Next.js 15 facility management application using the Pages Router with Redux-Saga for state management.

### Directory Structure

```
src/
├── pages/              # Next.js pages (file-based routing)
│   ├── admin/          # Protected admin routes (dashboard, items, users, etc.)
│   └── request/        # Public request submission forms
├── redux/
│   ├── store.ts        # Redux store with next-redux-wrapper + redux-persist
│   ├── reducers/       # Combined reducers for each domain
│   └── sagas/          # Redux-Saga handlers for async operations
├── actions/            # Action creators for each domain module
├── components/         # Reusable React components
├── types/              # TypeScript type definitions
├── constants/          # Action types, API URIs, enums
├── utilities/          # Helper functions (API requests, formatters)
├── hooks/              # Custom React hooks
├── navigation/         # Header and Sidebar components
└── controllers/        # EventEmitter for cross-component communication
```

### State Management Pattern

Each domain module (user, item, request, department, generator, maintenance, etc.) follows this structure:
- **Constants**: Action type strings and API URIs in `src/constants/{module}.constant.ts`
- **Actions**: Action creators in `src/actions/{module}.actions.ts`
- **Reducer**: Combined reducer in `src/redux/reducers/{module}.reducer.ts`
- **Saga**: Async handlers in `src/redux/sagas/{module}.saga.ts`
- **Types**: TypeScript interfaces in `src/types/{module}.types.ts`

### API Layer

API calls are made through sagas using helper functions from `src/utilities/helpers.ts`:
- `createRequestWithToken(uri, config)` - Creates authenticated requests with Bearer token
- `createMultiPartRequestWithToken(uri, config)` - For file uploads
- `checkStatus(response)` - Validates HTTP response
- `parseResponse(response)` - Converts to JSON/text

Base URL is configured via `NEXT_PUBLIC_BASE_URL` environment variable.

### Authentication

- JWT tokens stored in localStorage via localForage
- `PrivateRoute` component protects admin routes and handles role-based access
- Login success triggers token storage and cookie setting
- Default password flow redirects to `/change-password` when `hasDefaultPassword` is true

### Form Handling

Forms use Formsy-React for validation. The `TextInput` component in `src/components/Inputs/` wraps Formsy's withFormsy HOC.

### Notifications

- Redux-based snackbar via `appActions.setSnackBar({ type, message, variant })`
- EventEmitter in `src/controllers/EventEmitter.ts` for custom DOM events

### Path Alias

Use `@/*` to import from `src/` directory (configured in tsconfig.json).

## Code Style

- Prettier config: single quotes, tab width 3, trailing commas, 150 char line width
- Tailwind CSS v4 for styling
- SVGs imported as React components via @svgr/webpack
