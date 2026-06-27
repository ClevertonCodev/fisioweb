# Route Baseline: ClinicFinance

## 2026-06-27 - Legacy Clinic Route Owner

Command:

```bash
php artisan route:list --path=clinic/finances
```

Result:

- Status: PASS
- Total routes: 19
- Current owner: `Modules\Clinic\Http\Controllers\Financial*Controller`
- Public path prefix: `api/clinic/finances`

Routes observed:

- `GET|HEAD api/clinic/finances/categories`
- `POST api/clinic/finances/categories`
- `DELETE api/clinic/finances/categories/{category}`
- `POST api/clinic/finances/categories/{category}/toggle-active`
- `GET|HEAD api/clinic/finances/export`
- `PUT api/clinic/finances/opening-balance`
- `GET|HEAD api/clinic/finances/reports/category-breakdown`
- `GET|HEAD api/clinic/finances/reports/category-distribution`
- `GET|HEAD api/clinic/finances/reports/income-vs-expense`
- `GET|HEAD api/clinic/finances/reports/monthly-comparison`
- `GET|HEAD api/clinic/finances/reports/summary`
- `GET|HEAD api/clinic/finances/summary`
- `GET|HEAD api/clinic/finances/transactions`
- `POST api/clinic/finances/transactions`
- `GET|HEAD api/clinic/finances/transactions/trash`
- `POST api/clinic/finances/transactions/{id}/restore`
- `GET|HEAD api/clinic/finances/transactions/{transaction}`
- `PUT|PATCH api/clinic/finances/transactions/{transaction}`
- `DELETE api/clinic/finances/transactions/{transaction}`

Note:

- `modules/Clinic/routes/clinic.php` needed the existing missing `EvolutionController` import fixed before route listing could run.
