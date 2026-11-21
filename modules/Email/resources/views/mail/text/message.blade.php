@props(['sender' => null, 'badge' => null, 'phone' => null, 'address' => null, 'unsubscribe' => null])
<x-mail::layout>
<x-slot:header>
<x-mail::header :sender="$sender" />
</x-slot:header>

{{ $slot }}

@isset($subcopy)
<x-slot:subcopy>
<x-mail::subcopy>
{{ $subcopy }}
</x-mail::subcopy>
</x-slot:subcopy>
@endisset

<x-slot:footer>
<x-mail::footer :sender="$sender" :phone="$phone" :address="$address" :unsubscribe="$unsubscribe">
{{ $footer ?? '' }}
</x-mail::footer>
</x-slot:footer>
</x-mail::layout>
