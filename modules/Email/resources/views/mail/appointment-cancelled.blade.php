<x-mail::message :sender="$clinicName" badge="Consulta cancelada" :phone="$clinicPhone" :address="$clinicAddress">
# Sua consulta foi cancelada

@if (empty($greetingName))
Olá!
@else
Olá, {{ markdownLiteral($greetingName) }}!
@endif

A consulta abaixo foi cancelada pela {{ markdownLiteral($clinicName) }}.

<x-mail::details :rows="$detailsRows" :struck="true" struck-note="Consulta cancelada" />

@if (!empty($clinicPhone))
Para marcar um novo horário, ligue para a clínica: {{ markdownLiteral($clinicPhone) }}.
@else
Para marcar um novo horário, ligue para a clínica.
@endif
</x-mail::message>
