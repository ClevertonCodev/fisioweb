<x-mail::message :sender="$clinicName" badge="Consulta marcada" :phone="$clinicPhone" :address="$clinicAddress">
# Sua consulta está marcada

@if (empty($greetingName))
Olá!
@else
Olá, {{ markdownLiteral($greetingName) }}!
@endif

Marcamos a sua consulta na {{ markdownLiteral($clinicName) }}. Confira os detalhes:

<x-mail::details :rows="$detailsRows" />

@if (!empty($mapsUrl))
<x-mail::button :url="$mapsUrl">
Como chegar
</x-mail::button>
@endif

@if (!empty($clinicPhone))
Precisa remarcar? Ligue para a clínica: {{ markdownLiteral($clinicPhone) }}.
@else
Precisa remarcar? Ligue para a clínica.
@endif
</x-mail::message>
