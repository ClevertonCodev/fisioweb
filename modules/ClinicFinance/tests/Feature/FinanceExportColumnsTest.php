<?php

namespace Modules\ClinicFinance\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Response;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Enums\PaymentMethod;
use Modules\ClinicFinance\Models\FinancialCategory;
use Modules\ClinicFinance\Models\FinancialTransaction;
use Modules\Patient\Models\Patient;
use Modules\Pdf\Contracts\PdfGeneratorInterface;
use OpenSpout\Reader\XLSX\Reader;
use Tests\TestCase;

/**
 * A exportação (PDF, Excel e CSV) traz o paciente e, por linha, o valor bruto,
 * a taxa e o líquido. Texto que a planilha leria como fórmula sai com "'" na frente: no CSV,
 * o que começa com = + - @ tab ou CR; no Excel, só o que começa com = (o resto já vai como
 * célula de texto, e o "'" ficaria visível).
 */
class FinanceExportColumnsTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $secretary;

    private FinancialCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(now()->setDate(2026, 10, 15)->setTime(12, 0));

        $this->clinic    = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->secretary = ClinicUser::factory()->create([
            'clinic_id' => $this->clinic->id,
            'role'      => ClinicUser::ROLE_SECRETARY,
        ]);
        $this->category = FinancialCategory::factory()->custom($this->clinic)->create(['name' => 'Sessões']);
    }

    public function test_pdf_export_has_patient_gross_fee_and_net_columns(): void
    {
        $patient = Patient::factory()->create(['clinic_id' => $this->clinic->id, 'name' => 'Paciente A']);
        $this->transaction(['description' => 'Pacote', 'patient_id' => $patient->id]);

        $views = [];
        $this->app->instance(PdfGeneratorInterface::class, new class($views) implements PdfGeneratorInterface
        {
            public function __construct(private array &$views) {}

            public function download(string $view, array $data = [], string $filename = 'documento.pdf'): Response
            {
                $this->views[] = $view;

                return new Response(view($view, $data)->render());
            }

            public function stream(string $view, array $data = [], string $filename = 'documento.pdf'): Response
            {
                return $this->download($view, $data, $filename);
            }
        });

        $html = $this->actingAs($this->secretary, 'clinic')
            ->get('/api/clinic/finances/export?format=pdf&range=current_month')
            ->assertOk()
            ->getContent();

        $this->assertSame(['clinic::finance.export-transactions'], $views);
        $this->assertSame(
            ['Data', 'Descrição', 'Categoria', 'Paciente', 'Tipo', 'Valor bruto', 'Taxa', 'Valor líquido', 'Status'],
            $this->cellsOf($html, 'th'),
        );
        $this->assertSame(
            ['15/10/2026', 'Pacote', 'Sessões', 'Paciente A', 'Entrada', 'R$ 100,00', 'R$ 3,00', 'R$ 97,00', 'Recebido'],
            $this->cellsOf($html, 'td'),
        );
    }

    public function test_xlsx_export_has_patient_gross_fee_and_net_columns(): void
    {
        $patient = Patient::factory()->create(['clinic_id' => $this->clinic->id, 'name' => 'Paciente A']);
        $this->transaction(['description' => 'Pacote', 'patient_id' => $patient->id]);
        $this->transaction(['description' => 'Avulso', 'date' => '2026-10-16']);

        $rows = $this->xlsxRows();

        $this->assertSame(
            ['Data', 'Descrição', 'Categoria', 'Paciente', 'Tipo', 'Método', 'Valor bruto', 'Taxa', 'Valor líquido', 'Status'],
            $rows[0],
        );
        $this->assertSame('Paciente A', $rows[1][3]);
        $this->assertEquals([100, 3, 97], array_slice($rows[1], 6, 3));
        $this->assertSame('', $rows[2][3]);
    }

    public function test_previous_month_on_the_31st_exports_the_month_before_not_the_current_one(): void
    {
        foreach (['2027-03-31' => ['2027-02-15', '2027-03-15'], '2027-07-31' => ['2027-06-15', '2027-07-15']] as $today => [$before, $current]) {
            $this->travelTo($today . ' 12:00:00');
            $this->transaction(['description' => "Anterior {$today}", 'date' => $before]);
            $this->transaction(['description' => "Atual {$today}", 'date' => $current]);

            $csv = $this->actingAs($this->secretary, 'clinic')
                ->get('/api/clinic/finances/export?format=csv&range=previous_month')
                ->assertOk()
                ->streamedContent();

            $this->assertStringContainsString("Anterior {$today}", $csv);
            $this->assertStringNotContainsString("Atual {$today}", $csv);
        }
    }

    public function test_csv_neutralizes_text_that_a_spreadsheet_would_run_as_formula(): void
    {
        $this->formulaRows();

        $csv  = $this->actingAs($this->secretary, 'clinic')
            ->get('/api/clinic/finances/export?format=csv&range=current_month')
            ->assertOk()
            ->streamedContent();
        $handle = fopen('php://memory', 'r+');
        fwrite($handle, $csv);
        rewind($handle);
        $rows = [];

        while (($row = fgetcsv($handle, null, ';', '"', '\\')) !== false) {
            $rows[] = $row;
        }

        fclose($handle);

        $this->assertFormulaRowsAreSafe(
            $rows,
            descriptions: ['\'=HYPERLINK("http://x","clique")', "'-1+2", "'\tTab", "'\nCR", 'Sessão = R$ 100'],
            category: "'@SUM(A1)",
            patient: "'+5511999999999",
            amounts: ['100,00', '3,00', '97,00'],
        );
    }

    public function test_xlsx_neutralizes_text_that_a_spreadsheet_would_run_as_formula(): void
    {
        $this->formulaRows();

        // O OpenSpout só grava fórmula quando o texto começa com "=": o resto já é célula de texto.
        $this->assertFormulaRowsAreSafe(
            $this->xlsxRows(),
            descriptions: ['\'=HYPERLINK("http://x","clique")', '-1+2', "\tTab", "\nCR", 'Sessão = R$ 100'],
            category: '@SUM(A1)',
            patient: '+5511999999999',
            amounts: [100, 3, 97],
        );
    }

    private function formulaRows(): void
    {
        $this->category->update(['name' => '@SUM(A1)']);
        $patient = Patient::factory()->create(['clinic_id' => $this->clinic->id, 'name' => '+5511999999999']);

        $this->transaction(['date' => '2026-10-01', 'description' => '=HYPERLINK("http://x","clique")', 'patient_id' => $patient->id]);
        $this->transaction(['date' => '2026-10-02', 'description' => '-1+2']);
        $this->transaction(['date' => '2026-10-03', 'description' => "\tTab"]);
        $this->transaction(['date' => '2026-10-04', 'description' => "\rCR"]);
        $this->transaction(['date' => '2026-10-05', 'description' => 'Sessão = R$ 100']);
    }

    /**
     * @param  list<list<mixed>>  $rows
     * @param  list<string>  $descriptions
     * @param  list<mixed>  $amounts
     */
    private function assertFormulaRowsAreSafe(array $rows, array $descriptions, string $category, string $patient, array $amounts): void
    {
        // O XML do Excel guarda o CR como quebra de linha; o que importa é o "'" na frente.
        $exported = array_map(
            fn (string $text) => str_replace("\r", "\n", $text),
            array_column(array_slice($rows, 1), 1),
        );

        $this->assertSame($descriptions, $exported);
        $this->assertSame($category, $rows[1][2]);
        $this->assertSame($patient, $rows[1][3]);
        $this->assertSame('01/10/2026', $rows[1][0]);
        $this->assertSame($amounts, array_slice($rows[1], 6, 3));
    }

    /**
     * @return list<list<mixed>>
     */
    private function xlsxRows(): array
    {
        $content = $this->actingAs($this->secretary, 'clinic')
            ->get('/api/clinic/finances/export?format=xlsx&range=current_month')
            ->assertOk()
            ->streamedContent();

        $path = tempnam(sys_get_temp_dir(), 'finance-export-') . '.xlsx';
        file_put_contents($path, $content);

        $reader = new Reader;
        $reader->open($path);
        $rows = [];

        foreach ($reader->getSheetIterator() as $sheet) {
            foreach ($sheet->getRowIterator() as $row) {
                $rows[] = $row->toArray();
            }
            break;
        }

        $reader->close();
        unlink($path);

        return $rows;
    }

    /**
     * @return list<string>
     */
    private function cellsOf(string $html, string $tag): array
    {
        preg_match_all("/<{$tag}>(.*?)<\/{$tag}>/s", $html, $matches);

        return array_map(fn (string $cell) => trim(html_entity_decode($cell)), $matches[1]);
    }

    private function transaction(array $overrides = []): FinancialTransaction
    {
        return FinancialTransaction::factory()->forClinic($this->clinic)->create(array_merge([
            'financial_category_id' => $this->category->id,
            'type'                  => FinancialTransactionType::Entrada,
            'status'                => FinancialTransactionStatus::Recebido,
            'payment_method'        => PaymentMethod::CartaoCredito,
            'date'                  => '2026-10-15',
            'gross_amount'          => 100,
            'fee_amount'            => 3,
            'net_amount'            => 97,
            'created_by_user_id'    => $this->secretary->id,
        ], $overrides));
    }
}
