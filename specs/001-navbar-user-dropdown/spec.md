# Feature Specification: Navbar User Dropdown

**Feature Branch**: `[001-navbar-user-dropdown]`

**Created**: 2026-06-14

**Status**: Draft

**Input**: User description: "/speckit-specify preciso de ajuda com navbar, 1.preciso com dropdown para abrir ele vai ser a foto do usuario ou a primeira letra do nome, 2.quando abrir vai aparecer os seguintes botoes, id da clinica se for admin,dados da clinica se for admin, notificacoes, tutoriais, meu perfil e sair. 3.crie a pagina dados da clinica que so deve ser acessado se for admin, apague o menu suporte"

## Clarifications

### Session 2026-06-14

- Q: A página Dados da Clínica deve ser só leitura, edição básica, ou apenas atalhos? → A: Visualização + edição dos dados básicos da clínica.
- Q: Itens de conta devem ficar também no menu lateral ou apenas no dropdown? → A: Apenas no dropdown do usuário (sem duplicação no menu lateral).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Access account actions from navbar (Priority: P1)

As a logged-in user, I want to open my account dropdown from the navbar using my profile image or my name initial so that I can quickly access personal actions from any page.

**Why this priority**: This is the main interaction requested and replaces fragmented account actions in the sidebar.

**Independent Test**: Log in as any user, click the profile trigger in the navbar, and confirm the dropdown opens with personal options available and actionable.

**Acceptance Scenarios**:

1. **Given** a logged-in user with profile image, **When** the navbar is rendered, **Then** the dropdown trigger shows the profile image.
2. **Given** a logged-in user without profile image, **When** the navbar is rendered, **Then** the dropdown trigger shows the first letter of the user name.
3. **Given** a logged-in user, **When** the user opens the dropdown, **Then** the options Notifications, Tutorials, My Profile, and Sign Out are visible.

---

### User Story 2 - Show clinic management options only for admins (Priority: P1)

As an admin user, I want to see clinic-level management options in the account dropdown so that I can identify and manage the clinic context directly from the navbar.

**Why this priority**: Role-based visibility is critical for correct navigation and prevents non-admin users from seeing restricted options.

**Independent Test**: Log in as admin and as non-admin, open the dropdown in both sessions, and compare that admin-only entries appear only for admin users.

**Acceptance Scenarios**:

1. **Given** an admin user, **When** the dropdown opens, **Then** the clinic ID option is visible.
2. **Given** an admin user, **When** the dropdown opens, **Then** the Clinic Data option is visible.
3. **Given** a non-admin user, **When** the dropdown opens, **Then** clinic ID and Clinic Data options are not visible.

---

### User Story 3 - Access clinic data page with admin-only protection (Priority: P2)

As an admin user, I want a dedicated Clinic Data page so I can view and edit basic clinic information, while non-admin users remain blocked from this page.

**Why this priority**: The new page is required to support the new admin dropdown action and maintain access control boundaries.

**Independent Test**: Open Clinic Data from dropdown as admin and confirm page access; attempt direct URL access as non-admin and confirm access is denied.

**Acceptance Scenarios**:

1. **Given** an admin user, **When** the user selects Clinic Data in the dropdown, **Then** the Clinic Data page is displayed.
2. **Given** an admin user, **When** the user updates basic clinic information and confirms the action, **Then** the new clinic information is saved and shown on the page.
3. **Given** a non-admin user, **When** the user tries to open the Clinic Data page URL directly, **Then** access is blocked and the user is redirected to an allowed area.
4. **Given** any logged-in user, **When** navigation is rendered, **Then** the Support menu entry is not displayed.
5. **Given** any logged-in user, **When** navigation is rendered, **Then** account actions (Notifications, Tutorials, My Profile, and Sign Out) appear in the user dropdown and are not duplicated in the sidebar.

---

### Edge Cases

- User name starts with whitespace or special character; system should still resolve a visible fallback character for the trigger.
- User has no profile image and no valid display name; system should show a safe default avatar indicator.
- Admin user with missing clinic context data should still open the dropdown and see non-clinic options without breaking navigation.
- Non-admin user attempts direct navigation to Clinic Data through bookmarked URL; access should remain blocked.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render an account dropdown trigger in the navbar for authenticated users.
- **FR-002**: System MUST display the user profile image in the trigger when an image is available.
- **FR-003**: System MUST display the first character of the user display name when no profile image is available.
- **FR-004**: System MUST show the following options in the account dropdown for all authenticated users: Notifications, Tutorials, My Profile, and Sign Out.
- **FR-005**: System MUST show clinic ID in the account dropdown only when the authenticated user has admin role.
- **FR-006**: System MUST show Clinic Data in the account dropdown only when the authenticated user has admin role.
- **FR-007**: System MUST provide a Clinic Data page reachable through the Clinic Data dropdown option for admin users.
- **FR-008**: System MUST allow admin users to view and edit basic clinic information on the Clinic Data page.
- **FR-009**: System MUST block non-admin users from accessing the Clinic Data page, including direct URL access attempts.
- **FR-010**: System MUST remove the Support menu item from the current navigation for all users.
- **FR-011**: System MUST preserve existing behavior for Notifications, Tutorials, My Profile, and Sign Out actions after moving them into the dropdown.
- **FR-012**: System MUST remove duplicated account-action entries from the sidebar once those actions are provided in the user dropdown.

### Key Entities *(include if feature involves data)*

- **Authenticated User Context**: Represents the current logged-in user, including name, optional profile image, role, and clinic association.
- **Navbar Account Menu**: Represents the set of account and role-specific actions shown from the navbar trigger.
- **Clinic Data View Context**: Represents clinic-identification and basic editable clinic-information content shown on the admin-only Clinic Data page.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of authenticated sessions display a visible navbar account trigger.
- **SC-002**: 100% of users can open account actions (Notifications, Tutorials, My Profile, Sign Out) in 2 clicks or less from any authenticated page.
- **SC-003**: 100% of non-admin access attempts to Clinic Data are denied.
- **SC-004**: 100% of admin sessions display clinic ID and Clinic Data options in the dropdown.
- **SC-005**: Support-related navigation click events drop to zero after release.

## Assumptions

- Existing authentication and role information are already available during navbar rendering.
- Existing destinations for Notifications, Tutorials, My Profile, and Sign Out already exist and remain unchanged.
- Clinic Data page in this feature includes viewing and editing basic clinic information.
- Removing the Support menu does not require migration of support content inside this scope.
- Notifications, Tutorials, My Profile, and Sign Out become navbar account-dropdown actions in this feature and are no longer shown as separate sidebar account entries.
