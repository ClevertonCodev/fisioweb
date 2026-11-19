@props(['author' => null, 'role' => null])
"{!! trim($slot->toHtml()) !!}"
@if (!empty($author))
{{ $author }}{{ empty($role) ? '' : " · {$role}" }}
@endif
