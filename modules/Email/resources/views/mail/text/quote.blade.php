@props(['author' => null, 'role' => null])
@php
$safeAuthor = is_null($author) ? '' : (string) preg_replace('/\R+/u', ' ', trim((string) $author));
$safeRole = is_null($role) ? '' : (string) preg_replace('/\R+/u', ' ', trim((string) $role));
@endphp
"{!! trim($slot->toHtml()) !!}"
@if (!empty($safeAuthor))
{{ $safeAuthor }}{{ empty($safeRole) ? '' : " · {$safeRole}" }}
@endif
