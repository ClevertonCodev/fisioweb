<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <title>Exportação de transações</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background: #f5f5f5; }
    </style>
</head>
<body>
    <h2>Transações financeiras</h2>
    <table>
        <thead>
            <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Paciente</th>
                <th>Tipo</th>
                <th>Valor bruto</th>
                <th>Taxa</th>
                <th>Valor líquido</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($transactions as $transaction)
                <tr>
                    <td>{{ $transaction->date?->format('d/m/Y') }}</td>
                    <td>{{ $transaction->description }}</td>
                    <td>{{ $transaction->category->name ?? '' }}</td>
                    <td>{{ $transaction->patient['name'] ?? '' }}</td>
                    <td>{{ $transaction->type->label() ?? $transaction->type }}</td>
                    <td>R$ {{ number_format((float) $transaction->gross_amount, 2, ',', '.') }}</td>
                    <td>R$ {{ number_format((float) $transaction->fee_amount, 2, ',', '.') }}</td>
                    <td>R$ {{ number_format((float) $transaction->net_amount, 2, ',', '.') }}</td>
                    <td>{{ $transaction->status->label() ?? $transaction->status }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
