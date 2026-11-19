@props(['sender' => null, 'phone' => null, 'address' => null])
<tr>
<td class="footer-cell" align="center">
@if (!empty($sender) && (!empty($phone) || !empty($address)))
<p class="footer-clinic"><strong>{{ $sender }}</strong>{{ empty($phone) ? '' : " · {$phone}" }}</p>
@if (!empty($address))
<p class="footer-address">{{ $address }}</p>
@endif
@endif
<p>{{ empty($sender) ? 'Enviado pela IVS MED.' : "Enviado pela IVS MED em nome da {$sender}." }} Este endereço não recebe respostas.</p>
{!! $slot !!}
</td>
</tr>
