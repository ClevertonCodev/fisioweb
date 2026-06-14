# Tasks: Navbar User Dropdown

**Input**: Design documents from `specs/001-navbar-user-dropdown/`

**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: No explicit TDD requirement in spec; implementers should validate each story using independent acceptance criteria and quickstart scenarios.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create feature file scaffolding and entry points before behavior changes.

- [x] T001 Create account menu component skeleton in `resources/js/components/clinic/ClinicUserDropdown.tsx`
- [x] T002 Create clinic topbar component skeleton in `resources/js/components/clinic/ClinicTopbar.tsx`
- [x] T003 Create clinic data page and route skeletons in `resources/js/pages/clinic/clinic-data/ClinicDataPage.tsx` and `resources/js/routes/clinic/clinic-data-routes.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared contracts and auth context needed by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Extend authenticated session user model with optional avatar and clinic fields in `resources/js/domain/auth/session.ts`
- [x] T005 Update auth normalization and restore flow for new user fields in `resources/js/contexts/AuthContext.tsx`
- [x] T006 [P] Add clinic profile repository contracts and DTOs in `resources/js/application/clinic/ports.ts`
- [x] T007 [P] Implement clinic profile repository adapter in `resources/js/infrastructure/repositories/api-clinic-profile.ts`
- [x] T008 Wire new clinic profile exports in `resources/js/application/clinic/index.ts`, `resources/js/domain/clinic/index.ts`, and `resources/js/infrastructure/repositories/index.ts`
- [x] T009 Add explicit clinic-data permission helper in `resources/js/application/clinic/permissions.ts`

**Checkpoint**: Shared auth/profile and permission foundation is ready.

---

## Phase 3: User Story 1 - Access account actions from navbar (Priority: P1) 🎯 MVP

**Goal**: Deliver navbar dropdown with avatar/initial and move common account actions out of sidebar.

**Independent Test**: Log in as any user, open dropdown from navbar trigger, confirm avatar/initial fallback and account actions are available without sidebar duplicates.

- [x] T010 [US1] Implement dropdown trigger and common account actions UI in `resources/js/components/clinic/ClinicUserDropdown.tsx`
- [x] T011 [US1] Implement clinic topbar rendering account dropdown in `resources/js/components/clinic/ClinicTopbar.tsx`
- [x] T012 [US1] Integrate clinic topbar into authenticated layout in `resources/js/components/clinic/ClinicLayout.tsx`
- [x] T013 [US1] Remove bottom account navigation block from sidebar in `resources/js/components/clinic/ClinicSidebar.tsx`
- [x] T014 [US1] Remove Support entry and duplicated account links from sidebar nav config in `resources/js/components/clinic/ClinicSidebar.tsx`
- [x] T015 [US1] Preserve logout and profile navigation behavior in dropdown actions via `resources/js/components/clinic/ClinicUserDropdown.tsx`

**Checkpoint**: User Story 1 is independently functional and matches MVP behavior.

---

## Phase 4: User Story 2 - Show clinic management options only for admins (Priority: P1)

**Goal**: Add admin-only clinic entries to dropdown while keeping non-admin menu clean.

**Independent Test**: Compare dropdown as admin vs non-admin and confirm clinic ID + Clinic Data entries appear only for admin.

- [x] T016 [US2] Add admin-only section (clinic ID + Clinic Data action) in `resources/js/components/clinic/ClinicUserDropdown.tsx`
- [x] T017 [US2] Implement clinic ID formatting and fallback display in `resources/js/components/clinic/ClinicUserDropdown.tsx`
- [x] T018 [US2] Apply role-based visibility using clinic permission helpers in `resources/js/components/clinic/ClinicUserDropdown.tsx`
- [x] T019 [US2] Ensure non-admin rendering path excludes admin actions in `resources/js/components/clinic/ClinicUserDropdown.tsx`
- [x] T020 [US2] Align dropdown action contract comments with implemented behavior in `resources/js/components/clinic/ClinicUserDropdown.tsx`

**Checkpoint**: User Story 2 role-based visibility is independently verifiable.

---

## Phase 5: User Story 3 - Access clinic data page with admin-only protection (Priority: P2)

**Goal**: Deliver admin-only Clinic Data page with basic view/edit flow and protected route.

**Independent Test**: Admin can open and edit Clinic Data from dropdown; non-admin direct URL access is denied and redirected.

- [x] T021 [P] [US3] Create clinic profile domain entity in `resources/js/domain/clinic/clinic-profile.ts`
- [x] T022 [P] [US3] Create clinic profile form schema and mapping helpers in `resources/js/application/clinic/clinic-profile-form.ts`
- [x] T023 [US3] Implement clinic profile query/mutation hook in `resources/js/application/clinic/use-clinic-profile.ts`
- [x] T024 [US3] Implement admin Clinic Data form page (read + edit) in `resources/js/pages/clinic/clinic-data/ClinicDataPage.tsx`
- [x] T025 [US3] Define protected Clinic Data route with `RequireClinicAdmin` in `resources/js/routes/clinic/clinic-data-routes.tsx`
- [x] T026 [US3] Register clinic data routes in `resources/js/routes/clinic-routes.tsx`
- [x] T027 [US3] Link dropdown Clinic Data action to protected route in `resources/js/components/clinic/ClinicUserDropdown.tsx`
- [x] T028 [US3] Confirm redirect destination for blocked direct access in `resources/js/components/clinic/RequireClinicAdmin.tsx`

**Checkpoint**: User Story 3 is independently functional and access-controlled.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency, regression checks, and delivery validation.

- [x] T029 [P] Remove any remaining duplicated account-action navigation in `resources/js/components/clinic/ClinicSidebar.tsx`
- [x] T030 [P] Validate topbar/dropdown responsive behavior on mobile and desktop in `resources/js/components/clinic/ClinicLayout.tsx` and `resources/js/components/clinic/ClinicTopbar.tsx`
- [x] T031 Execute quickstart validation scenarios from `specs/001-navbar-user-dropdown/quickstart.md`
- [x] T032 Run and fix type/lint issues for touched files in `resources/js/components/clinic/`, `resources/js/pages/clinic/clinic-data/`, `resources/js/routes/clinic/`, `resources/js/application/clinic/`, and `resources/js/infrastructure/repositories/` using `npm run types` and `npm run lint`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies, starts immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational completion.
- **User Story 2 (Phase 4)**: Depends on Foundational completion and reuses US1 dropdown component.
- **User Story 3 (Phase 5)**: Depends on Foundational completion; can start after US1 component integration path is available.
- **Polish (Phase 6)**: Depends on completed stories in scope.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories after Phase 2.
- **US2 (P1)**: Depends on US1 dropdown shell for admin-only composition.
- **US3 (P2)**: Depends on foundational contracts/repository and dropdown navigation path; independently testable once implemented.

### Within Each User Story

- Build required models/contracts first.
- Implement UI flow and route wiring next.
- Finalize role/visibility behavior and acceptance validation last.

### Parallel Opportunities

- Phase 2: `T006` and `T007` can run in parallel.
- US3: `T021` and `T022` can run in parallel before `T023`.
- Polish: `T029` and `T030` can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "Implement dropdown trigger and common actions in resources/js/components/clinic/ClinicUserDropdown.tsx"
Task: "Prepare clinic topbar container in resources/js/components/clinic/ClinicTopbar.tsx"
```

## Parallel Example: User Story 2

```bash
No parallel tasks recommended inside US2 because tasks concentrate on the same file:
resources/js/components/clinic/ClinicUserDropdown.tsx
```

## Parallel Example: User Story 3

```bash
Task: "Create clinic profile entity in resources/js/domain/clinic/clinic-profile.ts"
Task: "Create clinic profile form schema in resources/js/application/clinic/clinic-profile-form.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Finish Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) completely.
3. Validate dropdown trigger, common actions, and sidebar cleanup.
4. Demo/release MVP navigation improvement.

### Incremental Delivery

1. Add US2 for admin-specific dropdown options.
2. Add US3 for Clinic Data page and admin route protection.
3. Run Phase 6 polish and full quickstart validation.

### Parallel Team Strategy

1. One developer handles foundational auth/profile contracts (Phase 2).
2. One developer implements US1/US2 dropdown behavior.
3. One developer implements US3 clinic data flow and route protection.

---

## Notes

- Tasks marked `[P]` can run safely in parallel.
- Story labels `[US1]`, `[US2]`, `[US3]` provide traceability to spec priorities.
- Each user story has explicit independent validation criteria.
- Keep backend authorization authoritative for Clinic Data access.
