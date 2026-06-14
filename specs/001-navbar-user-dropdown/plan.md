# Implementation Plan: Navbar User Dropdown

**Branch**: `main` | **Date**: 2026-06-14 | **Spec**: `specs/001-navbar-user-dropdown/spec.md`

**Input**: Feature specification from `specs/001-navbar-user-dropdown/spec.md`

## Summary

Implement account actions as a navbar user dropdown, showing avatar or initial, moving account actions out of sidebar, adding admin-only entries (clinic ID and Clinic Data), creating an admin-only Clinic Data page with basic edit capability, and removing Support from navigation. The approach follows existing frontend DDD layers and backend-authoritative authorization, with UI guards only for navigation visibility.

## Technical Context

**Language/Version**: TypeScript (strict) + React 19 frontend, PHP 8.2+ Laravel 12 backend

**Primary Dependencies**: react-router-dom v6, TanStack Query v5, axios `apiClient`, shadcn/ui, React Hook Form + Zod

**Storage**: Existing application database via backend API; no new storage technology required

**Testing**: Vitest + React Testing Library (frontend), PHPUnit optional only if backend endpoint/policy adjustments are required

**Target Platform**: Web SPA (desktop-first clinical admin usage)

**Project Type**: Web application (modular Laravel API + React SPA)

**Performance Goals**: Navbar render and dropdown open stay within current UX baseline (<100ms perceived interaction on normal workstation)

**Constraints**: 
- Backend remains source of truth for authorization
- Frontend uses layered DDD flow (page/loader -> application -> infrastructure)
- HTTP traffic only through `apiClient`
- Form with 2+ fields uses RHF + Zod for Clinic Data editing

**Scale/Scope**: Single authenticated navigation experience (`clinic` context) + one admin-only page; impacts shared layout/navigation and one new resource page flow

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file contains placeholders only; enforce repository-level rules from `CLAUDE.md` and workspace skills as active governance.
- Pass: Backend authorization remains authoritative (admin-only Clinic Data access).
- Pass: Frontend layering remains intact; no direct page-level `apiClient` calls planned.
- Pass: No direct `fetch`; repository layer continues using `apiClient`.
- Pass: Clinic Data edit flow will use RHF + Zod.
- Pass: Domain model naming remains camelCase/pure in frontend domain layer.
- Pass: UI follows `specs/_shared/frontend-ui-patterns.md` and skill `frontend-ui-patterns` (Popover claro, sidebar escura, cursor pointer).

Post-design re-check: No violations introduced by planned artifacts.

## Project Structure

### Documentation (this feature)

```text
specs/001-navbar-user-dropdown/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── navbar-user-dropdown.md
└── tasks.md
```

### Source Code (repository root)

```text
resources/js/
├── components/
│   ├── clinic/
│   │   └── ... (sidebar/navigation composition)
│   └── ui/
│       └── ... (dropdown/avatar primitives)
├── pages/
│   └── clinic/
│       └── clinic-data/
│           ├── ClinicDataPage.tsx
│           └── ... (form composition)
├── application/
│   └── clinic/
│       └── ... (hooks/use-cases for read/update clinic data)
├── infrastructure/
│   └── clinic/
│       └── ... (repository + mapper if needed)
├── routes/
│   └── clinic/
│       └── ... (route guard entries)
└── test/
    └── ... (component/page/hook coverage)

modules/
└── Clinic/
    └── ... (only if backend policy/endpoint adjustment becomes necessary)
```

**Structure Decision**: Keep implementation primarily in frontend SPA layers (`components`, `pages`, `application`, `infrastructure`, `routes`) and touch backend only if existing admin clinic-data endpoint/policies are insufficient.

## Complexity Tracking

No constitution-rule violations requiring exception tracking.
