@props([
    'url',
    'color' => 'primary',
    'align' => 'center',
])
<table class="action" width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td align="{{ $align }}" class="button-cell">
<a href="{{ $url }}" class="button" target="_blank" rel="noopener">{!! $slot !!}</a>
</td>
</tr>
</table>
