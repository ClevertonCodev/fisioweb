# Feature Specification: Modular Monolith EDA

**Feature Branch**: `[006-modular-monolith-eda]`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "Evoluir o backend do SaaS de fisioterapia para um Modular Monolith com Event-Driven Architecture, mantendo um unico deploy, fortalecendo fronteiras entre modulos, reduzindo acoplamento direto, preservando APIs REST existentes e preparando extracao futura de modulos como microservicos quando necessario."

## Clarifications

### Session 2026-06-27

- Q: When splitting Clinic responsibilities, should the first migration create new physical modules or start with internal boundaries inside `modules/Clinic`? -> A: Create physical clinic-scoped modules first, named by clinic capability such as ClinicFinance and ClinicScheduling, so future Admin finance can evolve separately.
- Q: Which physical clinic-scoped module should be extracted first? -> A: ClinicFinance first, covering clinic transactions, categories, balances, reports, and financial exports.
- Q: During `ClinicFinance` extraction, should legacy `Clinic` and new `ClinicFinance` share financial table writes temporarily, or should `ClinicFinance` own writes immediately? -> A: Temporary shared writes are acceptable during migration only; when `ClinicFinance` is complete, legacy clinic financial routes must be disabled and the same public REST paths must be served by `ClinicFinance`.
- Q: What event delivery strategy should the first migration use? -> A: Use internal application events with stable, versionable payloads prepared for a future outbox, without implementing outbox/inbox in the first phase.
- Q: How strict should dependency fitness tests be in the first phase? -> A: Fail prohibited imports in production code; tests, factories, and seeders require documented whitelist exceptions. The system is development-only, but existing table and view names such as `clinic_financial_categories` must remain stable.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preserve Business Flows While Reducing Coupling (Priority: P1)

As a product owner and engineering team, we need existing clinic management flows to keep working while backend modules communicate through explicit boundaries instead of direct internal dependencies.

**Why this priority**: The system already supports active business workflows, so architectural migration must not interrupt clinics, admins, patients, scheduling, media, messaging, or financial operations.

**Independent Test**: Can be tested by running current backend feature flows after each migration step and verifying no externally visible behavior or response contract changes for existing users.

**Acceptance Scenarios**:

1. **Given** an existing admin or clinic workflow, **When** the underlying module communication is migrated to an explicit contract or event, **Then** the user-facing behavior remains unchanged.
2. **Given** a module currently depending on another module's internal data, **When** the dependency is replaced, **Then** the consuming module uses only an approved public collaboration path.
3. **Given** a clinic financial endpoint used by the frontend, **When** ownership moves from the legacy clinic area to `ClinicFinance`, **Then** the public route path, request shape, response shape, and user flow remain compatible.

---

### User Story 2 - React to Business Facts Through Events (Priority: P2)

As the engineering team, we need important business facts such as patient creation, appointment scheduling, media processing, and payment changes to be published as stable events so other modules can react without owning the original decision.

**Why this priority**: Event-based collaboration lets modules evolve independently and moves side effects such as notifications, documents, projections, and synchronization out of the core business action.

**Independent Test**: Can be tested by triggering each priority business fact and verifying that the expected downstream consequences occur exactly once and remain owned by the consuming module.

**Acceptance Scenarios**:

1. **Given** a patient is created in a clinic, **When** the creation succeeds, **Then** interested modules can react using a stable event containing only necessary business facts.
2. **Given** an appointment is scheduled, changed, cancelled, or completed, **When** the scheduling action succeeds, **Then** downstream modules can update their own responsibilities without reading scheduling internals.
3. **Given** a financial or media event occurs, **When** the source module confirms the fact, **Then** notification, reporting, and projection modules can process it independently.

---

### User Story 3 - Split Clinic Responsibilities Into Clear Business Capabilities (Priority: P3)

As the engineering team, we need the current clinic area to be decomposed into smaller physical clinic-scoped business modules so scheduling, clinical care, finances, questionnaires, files, and clinic identity do not evolve as one oversized module.

**Why this priority**: The clinic area concentrates too many responsibilities today, making future changes riskier and making microservice extraction harder.

**Independent Test**: Can be tested by mapping every major clinic responsibility to a named owner and verifying that new features can be added inside that owner without importing unrelated internals.

**Acceptance Scenarios**:

1. **Given** a clinic-related feature request, **When** the feature is classified, **Then** it has a clear owning clinic-scoped module and allowed collaboration paths.
2. **Given** a future financial feature that appears in both clinic and admin contexts, **When** ownership is decided, **Then** clinic financial responsibilities remain in a clinic-scoped finance module while future admin financial responsibilities can evolve separately.
3. **Given** the first physical module extraction begins, **When** migration tasks are prioritized, **Then** `ClinicFinance` is migrated before other clinic-scoped modules.

---

### User Story 4 - Measure Extraction Readiness (Priority: P4)

As technical leadership, we need objective checks showing whether a module is ready to be extracted later without a large rewrite.

**Why this priority**: Microservices should remain an option, not an immediate operational burden, and readiness must be measurable before extraction is attempted.

**Independent Test**: Can be tested by selecting a candidate module and verifying that its data ownership, contracts, events, dependency direction, and cross-module transactions satisfy the readiness criteria.

**Acceptance Scenarios**:

1. **Given** a module candidate for extraction, **When** readiness is assessed, **Then** the assessment lists remaining direct dependencies, shared data writes, synchronous contracts, events, and operational gaps.
2. **Given** a developer introduces a prohibited dependency, **When** dependency fitness checks run, **Then** the change is rejected before it reaches production.

### Edge Cases

- A critical operation requires immediate consistency across two business capabilities; the decision must be documented and protected as a temporary exception.
- An event consumer runs more than once; the consequence must remain idempotent and not duplicate external effects.
- A module needs frequent read access to another module's data; the system must prefer owned projections or approved public read contracts over direct table ownership confusion.
- A historical direct dependency cannot be removed in the first migration; it must have an owner, removal path, and guard against spreading.
- Existing external REST behavior must remain stable while internal module communication changes.
- During `ClinicFinance` migration, legacy clinic financial writes may coexist temporarily, but the final state must disable legacy clinic financial routes and serve the same public routes from `ClinicFinance`.
- Because the system is still development-only, stricter production-code boundary checks can be introduced early; however, existing table and view names must remain stable to avoid unnecessary data and query churn.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define explicit ownership for each backend business capability and its data.
- **FR-002**: The system MUST allow cross-module collaboration only through approved public contracts, business events, or owned read projections.
- **FR-003**: The system MUST publish stable business events for priority facts needed by other capabilities.
- **FR-004**: Published business events MUST include only the minimum facts required by consumers, such as identifiers, tenant context, business snapshot, occurrence time, and version when needed.
- **FR-005**: Event consumers MUST own their consequences and must not depend on the private data model of the event producer.
- **FR-006**: The migration MUST preserve existing external API behavior for current admin, clinic, patient, scheduling, media, and financial flows.
- **FR-007**: The migration MUST provide a dependency policy that distinguishes acceptable temporary exceptions from dependencies that must be removed.
- **FR-008**: The system MUST include automated dependency fitness checks that fail when new prohibited cross-module dependencies are introduced.
- **FR-009**: The current clinic area MUST be reorganized into smaller physical clinic-scoped business modules with clear ownership and collaboration rules.
- **FR-010**: Clinic financial responsibilities MUST be owned by a clinic-scoped finance module so future admin financial responsibilities can evolve separately without sharing hidden business rules.
- **FR-011**: The system MUST define readiness criteria for extracting a module into an independently deployable service in the future.
- **FR-012**: Migration decisions that create durable boundaries, exceptions, or trade-offs MUST be documented in architecture decision records.
- **FR-013**: `ClinicFinance` MUST be the first physical clinic-scoped module extracted from the current clinic area, including clinic transactions, categories, balances, reports, and financial exports.
- **FR-014**: During `ClinicFinance` migration, temporary shared writes between legacy clinic finance code and `ClinicFinance` are allowed only as a documented transition state with an explicit removal path.
- **FR-015**: When `ClinicFinance` migration is complete, legacy clinic financial routes MUST be disabled and `ClinicFinance` MUST serve the same public route paths, request contracts, response contracts, and user-visible flows.
- **FR-016**: The first migration MUST use internal application events with stable, versionable payloads and MUST defer outbox/inbox implementation until a later extraction-readiness phase.
- **FR-017**: Dependency fitness tests MUST fail prohibited cross-module imports in production code during the first phase, while tests, factories, and seeders may use documented whitelist exceptions.
- **FR-018**: Physical table and view names already used by clinic financial features MUST remain stable during `ClinicFinance` extraction, including names such as `clinic_financial_categories`.

### Key Entities *(include if feature involves data)*

- **Business Capability**: A cohesive business responsibility with a clear owner, data ownership, rules, and allowed collaboration paths.
- **Clinic-Scoped Module**: A physical backend module dedicated to a clinic business capability, named to avoid confusion with future admin or SaaS-level capabilities.
- **Module Boundary**: The rule set defining what a capability exposes publicly and what remains private implementation detail.
- **Business Event**: A stable statement that something important already happened and that other capabilities may react to.
- **Public Contract**: A stable collaboration surface used when a capability needs an immediate answer from another capability.
- **Read Projection**: A consumer-owned view of external facts used for frequent reads without taking ownership of the original data.
- **Architecture Decision Record**: A durable record of a boundary decision, exception, trade-off, and future extraction implications.
- **Dependency Fitness Check**: An automated validation that prevents new forbidden dependencies between backend capabilities.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 80% of the currently identified high-risk direct dependencies are either removed or documented with an approved migration path before the architecture migration is considered complete.
- **SC-002**: New backend work touching cross-capability behavior can be reviewed against a documented dependency policy in under 10 minutes.
- **SC-003**: Automated dependency checks catch 100% of newly introduced imports that violate the approved boundary rules.
- **SC-004**: Existing external workflows for clinic and admin users continue to pass regression validation after each migration phase.
- **SC-005**: At least one high-priority capability can be assessed for future extraction with a checklist covering data ownership, contracts, events, idempotency, transactions, and operational readiness.
- **SC-006**: Side effects for priority business facts can be added by a consuming capability without changing the source capability's core business flow.
- **SC-007**: The first completed physical module extraction establishes `ClinicFinance` as the owner of clinic financial behavior and prevents new clinic financial rules from being added to the legacy clinic module.
- **SC-008**: Frontend clinic financial workflows continue to work without route changes after `ClinicFinance` becomes the route owner.
- **SC-009**: Event payloads introduced in the first migration can be documented as stable contracts and reused in a future outbox design without changing their business meaning.
- **SC-010**: Boundary checks prevent new prohibited production-code dependencies while allowing documented non-production setup exceptions.
- **SC-011**: `ClinicFinance` extraction completes without renaming existing clinic financial tables or views.

## Assumptions

- The migration is backend-only and does not change frontend behavior or routes.
- The application remains a single deployable system during this work.
- Microservice extraction is a future option, not a delivery target for the first migration.
- Existing REST contracts remain externally compatible unless a separate product decision approves a versioned change.
- Temporary exceptions are allowed only when documented, owned, and guarded by dependency checks.
- Clinic finances should be extracted as a clinic-scoped module first; future admin financial management should be modeled separately rather than sharing the same module by default.
- Route ownership may move between backend modules, but public REST paths must remain stable for existing frontend flows.
- Event delivery remains in-process during the first migration, while event payloads are designed as future integration contracts.
- The system is still in local development, so compatibility risk focuses on frontend/API stability and migration clarity rather than protecting existing production traffic.
