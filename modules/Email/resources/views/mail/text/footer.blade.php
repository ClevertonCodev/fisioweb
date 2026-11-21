@props(['sender' => null, 'phone' => null, 'address' => null, 'unsubscribe' => null])
@if (!empty($sender) && (!empty($phone) || !empty($address)))
{{ $sender }}{{ empty($phone) ? '' : " · {$phone}" }}
@if (!empty($address))
{{ $address }}
@endif
@endif
{{ empty($sender) ? 'Enviado pela IVS MED.' : "Enviado pela IVS MED em nome da {$sender}." }} Este endereço não recebe respostas.
@if (!empty($unsubscribe))
Não quero mais receber lembretes: {{ $unsubscribe }}
@endif
{{ $slot }}
