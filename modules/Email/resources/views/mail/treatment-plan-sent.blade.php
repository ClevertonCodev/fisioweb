<x-mail::message :sender="$clinicName" badge="Programa de exercícios" :phone="$clinicPhone" :address="$clinicAddress">
# Seu programa de exercícios está pronto

@if (empty($greetingName))
Olá!
@else
Olá, {{ markdownLiteral($greetingName) }}!
@endif

A {{ markdownLiteral($clinicName) }} preparou um programa de exercícios para você fazer em casa.

**{{ markdownLiteral($programTitle) }}**

<x-mail::details :rows="$detailsRows" />

@if (!empty($message))
<x-mail::quote :author="$authorName" :role="$authorRole">
{{ $message }}
</x-mail::quote>
@endif

<x-mail::button :url="$shareUrl">
Abrir meu programa
</x-mail::button>

Este link é só seu. Não precisa de senha para abrir.

<x-slot:subcopy>
Se o botão não funcionar, copie e cole no navegador:
[{{ $shareUrl }}]({{ $shareUrl }})
</x-slot:subcopy>
</x-mail::message>
