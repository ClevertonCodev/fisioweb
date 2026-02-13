<?php

namespace Modules\Media\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VideoUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $maxSizeKB = (int) (config('cloudflare.max_video_size', 524288000) / 1024);

        if ($this->hasFile('videos')) {
            return [
                'videos' => ['required', 'array', 'min:1', 'max:10'],
                'videos.*' => ['required', 'file', 'mimes:mp4,mpeg,mpg,mov,avi,webm,flv,mkv', "max:{$maxSizeKB}"],
                'directory' => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-Z0-9\/_-]+$/'],
            ];
        }

        return [
            'video' => ['required', 'file', 'mimes:mp4,mpeg,mpg,mov,avi,webm,flv,mkv', "max:{$maxSizeKB}"],
            'directory' => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-Z0-9\/_-]+$/'],
        ];
    }

    public function messages(): array
    {
        $maxSizeMB = (int) (config('cloudflare.max_video_size', 524288000) / 1048576);

        return [
            'video.required' => 'Selecione um arquivo de vídeo para upload.',
            'video.file' => 'O arquivo enviado deve ser um vídeo válido.',
            'video.mimes' => 'O vídeo deve ser um dos formatos: MP4, MPEG, MOV, AVI, WebM, FLV, MKV.',
            'video.max' => "O tamanho do vídeo não pode exceder {$maxSizeMB}MB.",
            'videos.required' => 'Selecione pelo menos um arquivo de vídeo.',
            'videos.max' => 'O máximo de vídeos por upload é 10.',
            'videos.*.mimes' => 'Cada vídeo deve ser um dos formatos: MP4, MPEG, MOV, AVI, WebM, FLV, MKV.',
            'videos.*.max' => "Cada vídeo não pode exceder {$maxSizeMB}MB.",
            'directory.regex' => 'O diretório contém caracteres inválidos.',
        ];
    }
}
