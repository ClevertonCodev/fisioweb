<?php

namespace Modules\Xlsx\Services;

use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\StreamedResponse;

class XlsxService
{
    /**
     * @param  list<string>  $headers
     * @param  iterable<list<mixed>>  $rows
     */
    public function download(array $headers, iterable $rows, string $filename = 'export.xlsx'): StreamedResponse
    {
        return response()->streamDownload(
            fn () => $this->write($headers, $rows),
            $filename,
            [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ],
        );
    }

    /**
     * @param  list<string>  $headers
     * @param  iterable<list<mixed>>  $rows
     */
    public function stream(array $headers, iterable $rows, string $filename = 'export.xlsx'): StreamedResponse
    {
        return $this->download($headers, $rows, $filename);
    }

    /**
     * @param  list<string>  $headers
     * @param  iterable<list<mixed>>  $rows
     */
    private function write(array $headers, iterable $rows): void
    {
        $writer = new Writer;
        $writer->openToFile('php://output');
        $writer->addRow(Row::fromValues($headers));

        foreach ($rows as $row) {
            $writer->addRow(Row::fromValues($row));
        }

        $writer->close();
    }
}
