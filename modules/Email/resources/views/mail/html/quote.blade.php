@props(['author' => null, 'role' => null])
<table class="quote" width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td class="quote-cell">
<p class="quote-text">“{!! preg_replace('/\R/u', '<br>', trim($slot->toHtml())) !!}”</p>
@if (!empty($author))
<p class="quote-author">{{ $author }}{{ empty($role) ? '' : " · {$role}" }}</p>
@endif
</td>
</tr>
</table>
