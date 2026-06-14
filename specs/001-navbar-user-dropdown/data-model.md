# Data Model: Navbar User Dropdown

## Entity: AuthenticatedUserContext

**Purpose**: Drives navbar trigger rendering and conditional menu visibility.

**Fields**:
- `userId` (string, required)
- `displayName` (string, required)
- `avatarUrl` (string, optional)
- `role` (enum: `admin` | `clinic_user`, required)
- `clinicId` (string, optional for non-admin contexts)

**Validation Rules**:
- `displayName` must provide a non-empty trimmed value for initial fallback.
- Avatar fallback must use first valid character of `displayName`; if unavailable, use safe placeholder indicator.

## Entity: NavbarAccountMenu

**Purpose**: Represents action set displayed from the navbar dropdown.

**Fields**:
- `commonActions` (list, required): `notifications`, `tutorials`, `myProfile`, `signOut`
- `adminActions` (list, conditional): `clinicId`, `clinicData`
- `isOpen` (boolean, runtime UI state)

**Visibility Rules**:
- `commonActions` visible for all authenticated users.
- `adminActions` visible only when `role = admin`.
- Sidebar must not render duplicated account actions after dropdown migration.

## Entity: ClinicDataViewContext

**Purpose**: Supports admin-only Clinic Data page with read and basic edit behavior.

**Fields (minimum scope)**:
- `clinicId` (string, required, read-only display)
- `clinicName` (string, required, editable)
- `contactEmail` (string, required, editable)
- `contactPhone` (string, optional, editable)
- `address` (string, optional, editable)

**Validation Rules**:
- `clinicName` required.
- `contactEmail` must be syntactically valid.
- Optional fields allow empty values without breaking save flow.

## Relationships

- `AuthenticatedUserContext` -> determines `NavbarAccountMenu` composition.
- `NavbarAccountMenu.clinicData` action -> navigates to `ClinicDataViewContext`.
- `ClinicDataViewContext` read/write privileges depend on admin authorization.

## State Transitions

1. `Authenticated` -> navbar renders avatar/initial trigger.
2. `DropdownClosed` -> `DropdownOpen` on trigger action.
3. `DropdownOpen` + admin -> clinic actions available.
4. `ClinicDataLoaded` -> `ClinicDataEditing` -> `ClinicDataSaved` (success) or `ClinicDataEditing` (validation error).
5. Non-admin direct URL attempt -> `AccessDeniedRedirect`.
