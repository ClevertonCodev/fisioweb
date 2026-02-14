<?php

namespace Modules\Media\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PresignedVideoUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $maxSize = (int) config('cloudflare.max_video_size', 20971520);
        $allowedMimes = implode(',', config('cloudflare.allowed_video_mimes', []));

        return [
            'filename' => ['required', 'string', 'max:255'],
            'mime_type' => ['required', 'string', "in:{$allowedMimes}"],
            'size' => ['required', 'integer', 'min:1', "max:{$maxSize}"],
        ];
    }

    public function messages(): array
    {
        $maxSizeMB = (int) (config('cloudflare.max_video_size', 20971520) / 1048576);

        return [
            'filename.required' => 'O nome do arquivo é obrigatório.',
            'filename.max' => 'O nome do arquivo não pode exceder 255 caracteres.',
            'mime_type.required' => 'O tipo do arquivo é obrigatório.',
            'mime_type.in' => 'O tipo do arquivo não é permitido. Formatos aceitos: MP4, MPEG, MOV, AVI, WebM, FLV, MKV.',
            'size.required' => 'O tamanho do arquivo é obrigatório.',
            'size.min' => 'O arquivo deve ter pelo menos 1 byte.',
            'size.max' => "O tamanho do arquivo não pode exceder {$maxSizeMB}MB.",
        ];
    }
}
