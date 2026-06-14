# Research: Navbar User Dropdown

## Decision 1: Use existing navbar avatar/dropdown primitives

- **Decision**: Reuse existing avatar/initial and dropdown patterns already present in the project UI components/tables.
- **Rationale**: Reduces UI inconsistency risk, minimizes implementation cost, and keeps visual language aligned with current product.
- **Alternatives considered**:
  - Build a new bespoke dropdown component (rejected: unnecessary duplication)
  - Keep actions in sidebar only (rejected: conflicts with approved spec clarification)

## Decision 2: Enforce admin access in backend and mirror in frontend UI

- **Decision**: Keep backend as authoritative guard for Clinic Data access, with frontend role checks only for menu visibility and route UX guard.
- **Rationale**: Aligns with project security principle that backend is source of truth, while frontend improves navigation experience.
- **Alternatives considered**:
  - Frontend-only route blocking (rejected: not secure)
  - Exposing admin options to all users and failing later (rejected: poor UX and noisy errors)

## Decision 3: Clinic Data page supports basic editing via RHF + Zod

- **Decision**: Implement Clinic Data page with read + basic edit form validation using React Hook Form and Zod.
- **Rationale**: Explicitly clarified in `/speckit-clarify`; aligns with repository form standard for forms with multiple fields.
- **Alternatives considered**:
  - Read-only page (rejected by clarification)
  - Link-only landing page (rejected by clarification)

## Decision 4: Move account actions exclusively to dropdown

- **Decision**: Notifications, Tutorials, My Profile, and Sign Out become dropdown-only account actions and are removed from sidebar account area.
- **Rationale**: Removes duplication and ambiguity in navigation; approved in clarification session.
- **Alternatives considered**:
  - Keep duplicated links in both sidebar and dropdown (rejected: inconsistent and redundant)
  - Hybrid split (rejected: unclear discoverability)

## Decision 5: Define a UI navigation contract artifact

- **Decision**: Document a feature-level UI contract in `contracts/navbar-user-dropdown.md`.
- **Rationale**: This feature exposes a user-facing interaction contract (visibility rules, menu composition, access behavior) that must stay stable across implementations.
- **Alternatives considered**:
  - No contract artifact (rejected: loses acceptance reference)
  - Only capture in tasks (rejected: less durable and less test-oriented)
