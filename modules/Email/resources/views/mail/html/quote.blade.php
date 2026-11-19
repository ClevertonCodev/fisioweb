@props(['author' => null, 'role' => null])
@php
$safeAuthor = is_null($author) ? '' : (string) preg_replace('/\R+/u', ' ', trim((string) $author));
$safeRole = is_null($role) ? '' : (string) preg_replace('/\R+/u', ' ', trim((string) $role));
@endphp
<table class="quote" width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td class="quote-cell">
<p class="quote-text">“{!! preg_replace('/\R/u', '<br>', trim($slot->toHtml())) !!}”</p>
@if (!empty($safeAuthor))
<p class="quote-author">{{ $safeAuthor }}{{ empty($safeRole) ? '' : " · {$safeRole}" }}</p>
@endif
</td>
</tr>
</table>
