<?php

namespace Modules\Media\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PresignedThumbnailUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $maxSize = (int) config('cloudflare.max_thumbnail_size', 5242880);
        $allowedMimes = implode(',', config('cloudflare.allowed_thumbnail_mimes', []));

        return [
            'filename' => ['required', 'string', 'max:255'],
            'mime_type' => ['required', 'string', "in:{$allowedMimes}"],
            'size' => ['required', 'integer', 'min:1', "max:{$maxSize}"],
        ];
    }

    public function messages(): array
    {
        $maxSizeMB = (int) (config('cloudflare.max_thumbnail_size', 5242880) / 1048576);

        return [
            'filename.required' => 'O nome do arquivo é obrigatório.',
            'filename.max' => 'O nome do arquivo não pode exceder 255 caracteres.',
            'mime_type.required' => 'O tipo do arquivo é obrigatório.',
            'mime_type.in' => 'O tipo do arquivo não é permitido. Use JPEG, PNG ou WebP.',
            'size.required' => 'O tamanho do arquivo é obrigatório.',
            'size.min' => 'O arquivo deve ter pelo menos 1 byte.',
            'size.max' => "A thumbnail não pode exceder {$maxSizeMB}MB.",
        ];
    }
}
