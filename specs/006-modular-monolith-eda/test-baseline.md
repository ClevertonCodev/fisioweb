# Test Baseline: Modular Monolith EDA

## 2026-06-27 - Initial PHPUnit Smoke

Command:

```bash
vendor/bin/phpunit --filter=__no_such_test__
```

Result:

- Status: PASS
- PHPUnit booted successfully.
- No tests executed because the filter intentionally matches no tests.

## 2026-06-27 - Autoload Refresh

Command:

```bash
composer dump-autoload
```

Result:

- Status: PASS
- `Modules\ClinicFinance\` is registered in `vendor/composer/autoload_psr4.php`.

## 2026-06-27 - Module Boundary Synthetic Detection

The architecture scanner includes `test_boundary_scanner_detects_synthetic_prohibited_import()` in `tests/Architecture/ModuleBoundaryTest.php`.

Expected:

- A synthetic `Modules\Clinic\Models\ClinicUser` import is detected as a prohibited cross-module model import.
- A synthetic `Modules\Patient\Repositories\PatientRepository` import is detected as a prohibited cross-module repository import.

## 2026-06-27 - ClinicFinance Route Compatibility

Command:

```bash
vendor/bin/phpunit --filter=FinanceRouteCompatibilityTest
```

Result:

- Status: PASS
- Tests: 1
- Assertions: 35
- Confirms all `/api/clinic/finances/*` paths are owned by `Modules\ClinicFinance\Http\Controllers\Financial*Controller`.

## 2026-06-27 - ClinicFinance Feature Tests

Command:

```bash
vendor/bin/phpunit modules/ClinicFinance/tests/Feature
```

Result:

- Status: PASS
- Tests: 7
- Assertions: 63

## 2026-06-27 - ClinicFinance Event Tests

Command:

```bash
vendor/bin/phpunit --filter=Event
```

Result:

- Status: PASS
- Tests: 5
- Assertions: 16

## 2026-06-27 - Extraction Readiness Tests

Command:

```bash
vendor/bin/phpunit --filter=ExtractionReadinessTest
```

Result:

- Status: PASS
- Tests: 2
- Assertions: 2

## 2026-06-27 - Architecture Tests

Command:

```bash
vendor/bin/phpunit tests/Architecture
```

Result:

- Status: PASS
- Tests: 7
- Assertions: 8

## 2026-06-27 - Final Finances Filter

Command:

```bash
vendor/bin/phpunit --filter=Finances
```

Result:

- Status: PASS
- Tests: 2
- Assertions: 5

## 2026-06-27 - Final Module Boundary Filter

Command:

```bash
vendor/bin/phpunit --filter=ModuleBoundaryTest
```

Result:

- Status: PASS
- Tests: 3
- Assertions: 4

## 2026-06-27 - Final Extraction Readiness Filter

Command:

```bash
vendor/bin/phpunit --filter=ExtractionReadinessTest
```

Result:

- Status: PASS
- Tests: 2
- Assertions: 2

## 2026-06-27 - Pint Formatting

Command:

```bash
./vendor/bin/pint
```

Result:

- Status: PASS
- Files scanned: 466
- Style issues fixed: 42
