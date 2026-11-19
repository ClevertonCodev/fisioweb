@props(['rows' => [], 'struck' => false, 'struckNote' => null])
@if ($struck && !empty($struckNote))
{{ $struckNote }}
@endif
@foreach ($rows as [$label, $value])
{{ $label }}: {{ $value }}
@endforeach
