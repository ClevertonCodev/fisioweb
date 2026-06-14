# Quickstart: Validate Navbar User Dropdown

## Prerequisites

- Project dependencies installed (`composer install`, `npm install`)
- Environment configured (`.env` ready, database migrated)
- Dev stack running (`composer run dev`)
- At least one admin user and one non-admin clinic user available

## Validation Scenarios

### Scenario 1: Dropdown trigger fallback

1. Login as user with avatar.
2. Confirm navbar trigger shows profile image.
3. Login as user without avatar.
4. Confirm navbar trigger shows name initial.

Expected outcome: Trigger always visible and valid.

### Scenario 2: Common actions moved to dropdown

1. Login as authenticated user.
2. Open dropdown.
3. Confirm presence of Notifications, Tutorials, My Profile, Sign Out.
4. Confirm these account actions are not duplicated in sidebar.

Expected outcome: All account actions accessible from dropdown only.

### Scenario 3: Admin-only entries and access

1. Login as admin.
2. Open dropdown and confirm Clinic ID + Clinic Data are visible.
3. Open Clinic Data page from dropdown.
4. Edit basic clinic fields and save.
5. Confirm updated values are displayed.

Expected outcome: Admin sees and uses Clinic Data flow successfully.

### Scenario 4: Non-admin access restriction

1. Login as non-admin clinic user.
2. Open dropdown and confirm Clinic ID + Clinic Data are not shown.
3. Try direct URL navigation to Clinic Data route.

Expected outcome: Access is denied and user is redirected to an allowed page.

### Scenario 5: Support removal

1. Login as admin and non-admin users.
2. Inspect sidebar navigation.

Expected outcome: Support menu entry does not appear for either role.

## Suggested Checks

- Frontend tests: `npm run test`
- Type safety: `npm run types`
- Linting: `npm run lint`

## References

- Spec: `specs/001-navbar-user-dropdown/spec.md`
- Plan: `specs/001-navbar-user-dropdown/plan.md`
- Data model: `specs/001-navbar-user-dropdown/data-model.md`
- Contract: `specs/001-navbar-user-dropdown/contracts/navbar-user-dropdown.md`
