@props(['sender' => null])
<tr>
<td class="footer-cell" align="center">
<p>{{ empty($sender) ? 'Enviado pela IVS MED.' : "Enviado pela IVS MED em nome da {$sender}." }} Este endereço não recebe respostas.</p>
{!! $slot !!}
</td>
</tr>
