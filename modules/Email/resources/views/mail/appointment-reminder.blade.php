<x-mail::message :sender="$clinicName" badge="Lembrete" :phone="$clinicPhone" :address="$clinicAddress" :unsubscribe="$unsubscribeUrl">
# Sua consulta é {{ $dayWord }}

@if (empty($greetingName))
Olá!
@else
Olá, {{ markdownLiteral($greetingName) }}!
@endif

Passando para lembrar da sua consulta na {{ markdownLiteral($clinicName) }}.

<x-mail::details :rows="$detailsRows" />

@if (!empty($mapsUrl))
<x-mail::button :url="$mapsUrl">
Como chegar
</x-mail::button>
@endif

@if (!empty($clinicPhone))
Não vai conseguir ir? Avise a clínica pelo {{ markdownLiteral($clinicPhone) }}.
@else
Não vai conseguir ir? Avise a clínica.
@endif
</x-mail::message>
