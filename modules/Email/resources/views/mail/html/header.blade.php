@props(['sender' => null])
<tr>
<td class="brand-header">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td width="40" valign="middle"><img src="cid:{{ config('email.logo_cid') }}" width="36" height="36" alt="" class="brand-logo"></td>
<td valign="middle" class="brand-text">
@if (!empty($sender))
<div class="brand-sender">{{ $sender }}</div>
<div class="brand-via">via IVS MED</div>
@else
<div class="brand-name">IVS MED</div>
@endif
</td>
</tr>
</table>
</td>
</tr>
