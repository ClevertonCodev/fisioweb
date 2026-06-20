# Specification Quality Checklist: Clinic Finances

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-06-20
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Resolved Clarifications

- **FR-037 — Permissões**: decidido em 2026-06-20 — acesso **somente** ao administrador da clínica (`RequireClinicAdmin`), para leitura e escrita.
- **FR-038 — Integração com agenda**: decidido em 2026-06-20 — lançamento **manual** apenas; integração automática com Scheduling fica fora do escopo desta versão.
- **Categorias** (sessão `/speckit-clarify` 2026-06-20): modelo **híbrido** — seed global + custom per-clinic gerenciáveis pelo admin (FR-016, FR-016a).
- **Métodos de pagamento** (2026-06-20): enum fechado padrão BR — Dinheiro, Pix, Cartão de débito, Cartão de crédito, Transferência, Boleto, Outro (FR-004).
- **Taxa de cartão** (2026-06-20): input opcional por transação, sem cálculo automático nem configuração global (FR-004, FR-027 revisado).
- **Exclusão de transação** (2026-06-20): **soft delete permanente — nunca purga**; mantém lixeira indefinida com tela de gestão, sem ação de "excluir definitivamente" nem rotinas automáticas de purga (FR-007, FR-007a, FR-007b, FR-007c). Tradeoff aceito: cresce sem limite em troca de auditabilidade total.
- **Saldo disponível editável** (2026-06-20): representa **saldo inicial do período** (reconciliação manual mensal); entidade `PeriodOpeningBalance` (FR-021).

## Notes

- Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`.
- A skill `frontend-ui-patterns` deve ser consultada no `/speckit-plan` para guiar componentes/cores em vez de copiar o visual da imagem de referência.
- Skill `backend-module` orienta a estrutura backend (Controller → Service → Repository) e `frontend-ddd` orienta a estrutura frontend.
