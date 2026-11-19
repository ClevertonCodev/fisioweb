@props(['sender' => null, 'badge' => null])
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
<x-mail::footer :sender="$sender">
{{ $footer ?? '' }}
</x-mail::footer>
</x-slot:footer>
</x-mail::layout>
