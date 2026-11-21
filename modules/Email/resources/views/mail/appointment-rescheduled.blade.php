<x-mail::message :sender="$clinicName" badge="Consulta remarcada" :phone="$clinicPhone" :address="$clinicAddress">
# Sua consulta mudou de horário

@if (empty($greetingName))
Olá!
@else
Olá, {{ markdownLiteral($greetingName) }}!
@endif

A {{ markdownLiteral($clinicName) }} remarcou a sua consulta. Confira o novo horário:

<x-mail::details :rows="$detailsRows" />

@if (!empty($mapsUrl))
<x-mail::button :url="$mapsUrl">
Como chegar
</x-mail::button>
@endif

@if (!empty($clinicPhone))
Esse horário não dá? Ligue para a clínica: {{ markdownLiteral($clinicPhone) }}.
@else
Esse horário não dá? Ligue para a clínica.
@endif
</x-mail::message>
