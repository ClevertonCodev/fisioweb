@props(['rows' => [], 'struck' => false, 'struckNote' => null])
<table class="details" width="100%" cellpadding="0" cellspacing="0" role="presentation">
@foreach ($rows as [$label, $value])
<tr>
<td class="details-label" valign="top">{!! preg_replace('/\R/u', '<br>', e($label)) !!}</td>
<td class="{{ $struck ? 'details-value details-struck' : 'details-value' }}" valign="top">{!! preg_replace('/\R/u', '<br>', e($value)) !!}</td>
</tr>
@endforeach
</table>
