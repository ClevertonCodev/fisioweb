<?php

namespace Modules\Media\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PresignedVideoUploadRequest extends FormRequest
{
    /** Limite de validação nos controllers: 10 MB */
    private const VALIDATION_MAX_SIZE_BYTES = 10485760;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $allowedMimes = config('cloudflare.allowed_video_mimes', ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/x-flv', 'video/x-matroska']);

        return [
            'filename' => ['required', 'string', 'max:255'],
            'mime_type' => ['required', 'string', Rule::in($allowedMimes)],
            'size' => ['required', 'integer', 'min:1', 'max:'.self::VALIDATION_MAX_SIZE_BYTES],
        ];
    }

    public function messages(): array
    {
        $maxMB = (int) (self::VALIDATION_MAX_SIZE_BYTES / 1048576);

        return [
            'filename.required' => 'O nome do arquivo é obrigatório.',
            'mime_type.required' => 'O tipo MIME do vídeo é obrigatório.',
            'mime_type.in' => 'Tipo de vídeo não permitido.',
            'size.required' => 'O tamanho do arquivo é obrigatório.',
            'size.max' => "O tamanho do vídeo não pode exceder {$maxMB}MB.",
        ];
    }
}
