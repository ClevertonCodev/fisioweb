<x-mail::message :sender="$sender" :badge="$badge">
# Título

Corpo do e-mail.

<x-mail::details :rows="$rows" />

<x-mail::quote :author="$author" :role="$role">
{{ $quote }}
</x-mail::quote>
</x-mail::message>
