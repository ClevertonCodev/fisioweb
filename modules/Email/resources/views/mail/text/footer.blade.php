@props(['sender' => null])
{{ empty($sender) ? 'Enviado pela IVS MED.' : "Enviado pela IVS MED em nome da {$sender}." }} Este endereço não recebe respostas.
{{ $slot }}
