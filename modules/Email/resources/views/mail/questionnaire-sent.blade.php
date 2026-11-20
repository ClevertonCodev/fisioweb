<x-mail::message :sender="$clinicName" badge="Questionário" :phone="$clinicPhone" :address="$clinicAddress">
# Responda o questionário antes da próxima sessão

@if (empty($greetingName))
Olá!
@else
Olá, {{ markdownLiteral($greetingName) }}!
@endif

A {{ markdownLiteral($clinicName) }} enviou um questionário para acompanhar o seu tratamento.

**{{ markdownLiteral($questionnaireTitle) }}**

<x-mail::details :rows="$detailsRows" />

<x-mail::button :url="$shareUrl">
Responder questionário
</x-mail::button>

Suas respostas vão direto para a clínica.

<x-slot:subcopy>
Se o botão não funcionar, copie e cole no navegador:
[{{ $shareUrl }}]({{ $shareUrl }})
</x-slot:subcopy>
</x-mail::message>
