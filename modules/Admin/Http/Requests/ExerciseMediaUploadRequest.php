<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Admin\Models\ExerciseMedia;

class ExerciseMediaUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(array_keys(ExerciseMedia::TYPES))],
            'files' => ['required', 'array', 'min:1', 'max:10'],
            'files.*' => $this->getFileRules(),
        ];
    }

    protected function getFileRules(): array
    {
        $type = $this->input('type', 'image');

        return match ($type) {
            'image' => ['file', 'mimes:jpg,jpeg,png,gif,webp,svg,bmp', 'max:10240'],
            'gif' => ['file', 'mimes:gif', 'max:20480'],
            'audio' => ['file', 'mimes:mp3,wav,ogg,m4a', 'max:51200'],
            default => ['file', 'max:10240'],
        };
    }

    public function messages(): array
    {
        return [
            'type.required' => 'O tipo de mídia é obrigatório.',
            'type.in' => 'Tipo de mídia inválido.',
            'files.required' => 'Pelo menos um arquivo é obrigatório.',
            'files.max' => 'Máximo de 10 arquivos por envio.',
            'files.*.max' => 'O arquivo excede o tamanho máximo permitido.',
            'files.*.mimes' => 'Formato de arquivo não permitido.',
        ];
    }
}
