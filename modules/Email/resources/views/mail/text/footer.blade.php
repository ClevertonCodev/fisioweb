@props(['sender' => null, 'phone' => null, 'address' => null])
@if (!empty($sender) && (!empty($phone) || !empty($address)))
{{ $sender }}{{ empty($phone) ? '' : " · {$phone}" }}
@if (!empty($address))
{{ $address }}
@endif
@endif
{{ empty($sender) ? 'Enviado pela IVS MED.' : "Enviado pela IVS MED em nome da {$sender}." }} Este endereço não recebe respostas.
{{ $slot }}
