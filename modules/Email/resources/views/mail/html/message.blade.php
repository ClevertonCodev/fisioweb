@props(['sender' => null, 'badge' => null, 'phone' => null, 'address' => null])
<x-mail::layout>
<x-slot:header>
<x-mail::header :sender="$sender" />
</x-slot:header>

@if (!empty($badge))
<x-slot:badge>
<div class="badge">{{ $badge }}</div>
</x-slot:badge>
@endif

{!! $slot !!}

@isset($subcopy)
<x-slot:subcopy>
<x-mail::subcopy>
{!! $subcopy !!}
</x-mail::subcopy>
</x-slot:subcopy>
@endisset

<x-slot:footer>
<x-mail::footer :sender="$sender" :phone="$phone" :address="$address">
{{ $footer ?? '' }}
</x-mail::footer>
</x-slot:footer>
</x-mail::layout>
