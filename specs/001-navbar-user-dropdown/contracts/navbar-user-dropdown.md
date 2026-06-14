# Contract: Navbar User Dropdown

## 1. Trigger Contract

- Authenticated users MUST see a navbar account trigger.
- Trigger rendering priority:
  1. Show profile image when available.
  2. Otherwise show first character from display name.
  3. Otherwise show safe default placeholder.

## 2. Dropdown Composition Contract

- For all authenticated users, dropdown MUST include:
  - Notifications
  - Tutorials
  - My Profile
  - Sign Out
- For admin users only, dropdown MUST additionally include:
  - Clinic ID
  - Clinic Data

## 3. Navigation Placement Contract

- Notifications, Tutorials, My Profile, and Sign Out MUST be available from dropdown.
- Sidebar MUST NOT duplicate these migrated account actions.
- Support menu entry MUST NOT be present in sidebar navigation.

## 4. Access Control Contract

- Clinic Data route MUST allow admin users.
- Clinic Data route MUST deny non-admin users, including direct URL access.
- Denied users MUST be redirected to an allowed authenticated area.

## 5. Clinic Data Interaction Contract

- Admin users MUST be able to open Clinic Data from dropdown.
- Clinic Data page MUST support:
  - viewing current basic clinic fields
  - editing basic clinic fields (mestre only)
  - saving and seeing updated values after success
- Slug and plan fields are read-only on clinic side (admin module only).

## 6. UI Pattern Contract

- Dropdown account menu MUST use **Popover** with light background (`bg-popover`), NOT dark sidebar colors.
- Menu items MUST follow [`specs/_shared/frontend-ui-patterns.md`](../../_shared/frontend-ui-patterns.md) and skill `frontend-ui-patterns`.
- Canonical references:
  - Account menu: `resources/js/components/clinic/ClinicUserDropdown.tsx`
  - Sidebar item styles: `resources/js/components/clinic/ClinicSidebar.tsx`
  - Admin submenu pattern: `resources/js/components/admin/AdminSidebar.tsx` → `NavItemWithChildren`
- All clickable menu items MUST use `cursor-pointer`.
