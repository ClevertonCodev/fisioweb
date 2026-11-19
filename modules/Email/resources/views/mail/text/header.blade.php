@props(['sender' => null])
{{ empty($sender) ? 'IVS MED' : "{$sender} via IVS MED" }}
