<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Evolução — {{ $evolution->patient->name ?? '' }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            color: #1a1a1a;
            background: #fff;
            line-height: 1.5;
        }

        .header {
            border-bottom: 2px solid #2563eb;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }

        .header-top {
            display: table;
            width: 100%;
        }

        .header-clinic {
            display: table-cell;
            vertical-align: middle;
        }

        .clinic-name {
            font-size: 15px;
            font-weight: bold;
            color: #1e3a8a;
        }

        .clinic-info {
            font-size: 9px;
            color: #6b7280;
            margin-top: 2px;
        }

        .header-badge {
            display: table-cell;
            vertical-align: middle;
            text-align: right;
            width: 120px;
        }

        .badge-title {
            background: #2563eb;
            color: #fff;
            font-size: 10px;
            font-weight: bold;
            padding: 4px 10px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
        }

        .meta-table td {
            padding: 6px 10px;
            font-size: 10px;
            border-bottom: 1px solid #e2e8f0;
        }

        .meta-table tr:last-child td {
            border-bottom: none;
        }

        .meta-label {
            font-weight: bold;
            color: #374151;
            width: 130px;
        }

        .meta-value {
            color: #1a1a1a;
        }

        .status-signed {
            display: inline-block;
            background: #dcfce7;
            color: #166534;
            font-size: 9px;
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 10px;
            text-transform: uppercase;
        }

        .status-draft {
            display: inline-block;
            background: #fef9c3;
            color: #854d0e;
            font-size: 9px;
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 10px;
            text-transform: uppercase;
        }

        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 6px;
            margin-top: 14px;
            padding-bottom: 3px;
            border-bottom: 1px solid #bfdbfe;
        }

        .evolution-text {
            font-size: 11px;
            color: #1a1a1a;
            line-height: 1.7;
            margin-bottom: 4px;
            padding-left: 8px;
        }

        .notes-box {
            margin-top: 20px;
            background: #f8fafc;
            border-left: 3px solid #2563eb;
            padding: 10px 14px;
        }

        .notes-label {
            font-size: 10px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 4px;
            text-transform: uppercase;
        }

        .notes-text {
            font-size: 11px;
            color: #1a1a1a;
            line-height: 1.6;
        }

        .signature-box {
            margin-top: 30px;
            padding-top: 14px;
            border-top: 1px solid #e2e8f0;
        }

        .signature-label {
            font-size: 9px;
            color: #6b7280;
            margin-bottom: 2px;
        }

        .signature-name {
            font-size: 11px;
            font-weight: bold;
            color: #1a1a1a;
        }

        .signature-date {
            font-size: 9px;
            color: #6b7280;
        }

        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1px solid #e2e8f0;
            padding: 6px 20px;
            font-size: 8px;
            color: #9ca3af;
            text-align: center;
            background: #fff;
        }

        .page-content {
            padding: 20px;
            padding-bottom: 40px;
        }
    </style>
</head>
<body>
<div class="page-content">

    {{-- Header --}}
    <div class="header">
        <div class="header-top">
            <div class="header-clinic">
                <div class="clinic-name">{{ $evolution->clinic->name ?? '' }}</div>
                <div class="clinic-info">
                    @if($evolution->clinic?->email) {{ $evolution->clinic->email }} @endif
                    @if($evolution->clinic?->phone) &nbsp;·&nbsp; {{ $evolution->clinic->phone }} @endif
                    @if($evolution->clinic?->city) &nbsp;·&nbsp; {{ $evolution->clinic->city }}{{ $evolution->clinic?->state ? '/' . $evolution->clinic->state : '' }} @endif
                </div>
            </div>
            <div class="header-badge">
                <span class="badge-title">Evolução</span>
            </div>
        </div>
    </div>

    {{-- Meta --}}
    <table class="meta-table">
        <tr>
            <td class="meta-label">Paciente</td>
            <td class="meta-value">{{ $evolution->patient->name ?? '—' }}</td>
        </tr>
        <tr>
            <td class="meta-label">Título da sessão</td>
            <td class="meta-value">{{ $evolution->title }}</td>
        </tr>
        <tr>
            <td class="meta-label">Profissional</td>
            <td class="meta-value">{{ $evolution->clinicUser->name ?? '—' }}</td>
        </tr>
        <tr>
            <td class="meta-label">Data</td>
            <td class="meta-value">{{ $evolution->created_at?->format('d/m/Y H:i') }}</td>
        </tr>
        @if($evolution->template)
        <tr>
            <td class="meta-label">Template</td>
            <td class="meta-value">{{ $evolution->template->name }}</td>
        </tr>
        @endif
        <tr>
            <td class="meta-label">Status</td>
            <td class="meta-value">
                @if($evolution->status === 'signed')
                    <span class="status-signed">Assinado</span>
                @else
                    <span class="status-draft">Rascunho</span>
                @endif
            </td>
        </tr>
    </table>

    {{-- Generated text (parsed by sections) --}}
    @if($evolution->generated_text)
        @php
            $blocks = preg_split('/\n\n+/', trim($evolution->generated_text));
        @endphp

        @foreach($blocks as $block)
            @php
                $lines = explode("\n", trim($block));
                $firstLine = $lines[0] ?? '';
                $isSectionTitle = preg_match('/^\*\*(.+)\*\*:?$/', $firstLine, $matches);
            @endphp

            @if($isSectionTitle)
                <div class="section-title">{{ $matches[1] }}</div>
                @foreach(array_slice($lines, 1) as $line)
                    @if(trim($line))
                        <div class="evolution-text">{{ trim($line) }}</div>
                    @endif
                @endforeach
            @else
                @foreach($lines as $line)
                    @if(trim($line))
                        <div class="evolution-text">{{ trim($line) }}</div>
                    @endif
                @endforeach
            @endif
        @endforeach
    @endif

    {{-- Notes --}}
    @if($evolution->notes)
        <div class="notes-box">
            <div class="notes-label">Observações</div>
            <div class="notes-text">{{ $evolution->notes }}</div>
        </div>
    @endif

    {{-- Signature --}}
    @if($evolution->status === 'signed' && $evolution->clinicUser)
        <div class="signature-box">
            <div class="signature-label">Assinado digitalmente por</div>
            <div class="signature-name">{{ $evolution->clinicUser->name }}</div>
            <div class="signature-date">em {{ $evolution->signed_at?->format('d/m/Y \à\s H:i') }}</div>
        </div>
    @endif

</div>

<div class="footer">
    Documento gerado em {{ now()->format('d/m/Y H:i') }} &nbsp;·&nbsp; {{ $evolution->clinic->name ?? '' }}
</div>
</body>
</html>
