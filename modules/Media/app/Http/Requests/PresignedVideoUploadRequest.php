<?php

namespace Modules\Media\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PresignedVideoUploadRequest extends FormRequest
{
    /** Teto do tamanho declarado, 20 MB para clínica e admin; o env só pode baixar o limite. */
    public const MAX_VIDEO_SIZE = 20971520;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $maxSize      = $this->maxVideoSize();
        $allowedMimes = implode(',', config('cloudflare.allowed_video_mimes', []));

        return [
            'filename'  => ['required', 'string', 'max:255'],
            'mime_type' => ['required', 'string', "in:{$allowedMimes}"],
            'size'      => ['required', 'integer', 'min:1', "max:{$maxSize}"],
        ];
    }

    public function messages(): array
    {
        $maxSizeMB = (int) ($this->maxVideoSize() / 1048576);

        return [
            'filename.required'  => 'O nome do arquivo é obrigatório.',
            'filename.max'       => 'O nome do arquivo não pode exceder 255 caracteres.',
            'mime_type.required' => 'O tipo do arquivo é obrigatório.',
            'mime_type.in'       => 'O tipo do arquivo não é permitido. Formatos aceitos: MP4, MPEG, MOV, AVI, WebM, FLV, MKV.',
            'size.required'      => 'O tamanho do arquivo é obrigatório.',
            'size.min'           => 'O arquivo deve ter pelo menos 1 byte.',
            'size.max'           => "O tamanho do arquivo não pode exceder {$maxSizeMB}MB.",
        ];
    }

    private function maxVideoSize(): int
    {
        $configured = (int) config('cloudflare.max_video_size', self::MAX_VIDEO_SIZE);

        // Env vazio ou inválido vira 0: usa o teto em vez de recusar todo vídeo.
        return $configured > 0 ? min($configured, self::MAX_VIDEO_SIZE) : self::MAX_VIDEO_SIZE;
    }
}
