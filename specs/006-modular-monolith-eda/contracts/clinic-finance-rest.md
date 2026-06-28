# Contract: ClinicFinance REST Compatibility

`ClinicFinance` must serve the same public clinic finance routes currently exposed under `modules/Clinic/routes/clinic.php`. The frontend must not change route paths, auth expectations, request shapes, response envelopes, or user-visible flow.

## Route Ownership Transition

| Phase | Owner | Rule |
|-------|-------|------|
| LegacyOwned | `Clinic` | Existing financial routes are served by legacy controllers. |
| SharedTransition | `Clinic` + `ClinicFinance` | Temporary shared writes allowed only with ADR and removal path. |
| RouteOwner | `ClinicFinance` | Same public routes are served by `ClinicFinance`; legacy route definitions are disabled. |
| ExclusiveOwner | `ClinicFinance` | New clinic financial behavior cannot be added to legacy `Clinic`. |

## Middleware And Auth

- Prefix remains `/clinic`.
- Guard remains `auth:clinic`.
- Middleware remains compatible with `clinic.guard`.
- Finance routes remain restricted to clinic admin semantics equivalent to current `clinic.admin`.

## Required Route Compatibility

| Method | Path | Name Intent | Response Contract |
|--------|------|-------------|-------------------|
| GET | `/clinic/finances/transactions` | List transactions | JSON `{ data: [...], meta: { page, perPage, total } }` |
| POST | `/clinic/finances/transactions` | Create transaction | JSON `{ data: transaction }`, status 201 |
| GET | `/clinic/finances/transactions/{transaction}` | Show transaction | JSON `{ data: transaction }` |
| PUT/PATCH | `/clinic/finances/transactions/{transaction}` | Update transaction | JSON `{ data: transaction }` |
| DELETE | `/clinic/finances/transactions/{transaction}` | Soft delete transaction | Empty response, status 204 |
| GET | `/clinic/finances/transactions/trash` | List deleted transactions | JSON `{ data: [...], meta: { page, perPage, total } }` |
| POST | `/clinic/finances/transactions/{id}/restore` | Restore transaction | JSON `{ data: transaction }` |
| GET | `/clinic/finances/summary` | Finance summary | JSON `{ data: summary }` |
| PUT | `/clinic/finances/opening-balance` | Update period opening balance | JSON `{ data: openingBalance }` |
| GET | `/clinic/finances/categories` | List categories | JSON `{ data: [...] }` |
| POST | `/clinic/finances/categories` | Create category | JSON `{ data: category }`, status 201 |
| POST | `/clinic/finances/categories/{category}/toggle-active` | Toggle category active state | JSON `{ data: { id, active } }` |
| DELETE | `/clinic/finances/categories/{category}` | Delete/deactivate category | Empty response, status 204 |
| GET | `/clinic/finances/reports/summary` | Report summary | JSON `{ data: report }` |
| GET | `/clinic/finances/reports/income-vs-expense` | Income vs expense report | JSON `{ data: report }` |
| GET | `/clinic/finances/reports/category-distribution` | Category distribution report | JSON `{ data: report }` |
| GET | `/clinic/finances/reports/monthly-comparison` | Monthly comparison report | JSON `{ data: report }` |
| GET | `/clinic/finances/reports/category-breakdown` | Category breakdown report | JSON `{ data: report }` |
| GET | `/clinic/finances/export` | Export transactions | File response for valid data; JSON error with status 422 for empty/invalid export |

## Compatibility Rules

- Route paths must not change.
- Existing request validation behavior must remain compatible.
- Existing JSON envelopes must remain compatible.
- Existing pagination metadata names stay `page`, `perPage`, `total`.
- Existing file export behavior for `csv`, `xlsx`, and `pdf` remains compatible.
- Authorization failures and clinic isolation behavior must remain equivalent or stricter.
- Backend namespace/controller ownership may change without changing the public contract.

## Final Implementation Notes

- Final route owner: `Modules\ClinicFinance\Http\Controllers\Financial*Controller`.
- Final route file: `modules/ClinicFinance/routes/clinic.php`.
- Legacy finance route declarations in `modules/Clinic/routes/clinic.php` are disabled.
- Compatibility is covered by `modules/ClinicFinance/tests/Feature/FinanceRouteCompatibilityTest.php`.
