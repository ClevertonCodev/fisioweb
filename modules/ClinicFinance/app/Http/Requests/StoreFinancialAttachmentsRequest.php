<?php

namespace Modules\ClinicFinance\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Modules\ClinicFinance\Models\FinancialAttachment;

/** `POST transactions/{id}/attachments` (multipart, `files[]`). A Policy é chamada no controller. */
class StoreFinancialAttachmentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'files'   => ['required', 'array', 'min:1', 'max:' . FinancialAttachment::MAX_PER_TRANSACTION],
            'files.*' => [
                'required',
                'file',
                'mimes:' . implode(',', FinancialAttachment::ALLOWED_EXTENSIONS),
                // O tipo pelo conteúdo é o que decide a extensão gravada no R2.
                'mimetypes:' . implode(',', array_keys(FinancialAttachment::EXTENSION_BY_MIME)),
                'max:' . FinancialAttachment::MAX_SIZE_KB,
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $max = FinancialAttachment::MAX_PER_TRANSACTION;

        return [
            'files.required'    => 'Escolha pelo menos um arquivo.',
            'files.min'         => 'Escolha pelo menos um arquivo.',
            'files.max'         => "Cada lançamento aceita até {$max} comprovantes.",
            'files.*.file'      => 'O envio do arquivo falhou. Tente de novo.',
            'files.*.mimes'     => 'O arquivo :position não é JPG, PNG, WEBP, HEIC ou PDF.',
            'files.*.mimetypes' => 'O arquivo :position não é JPG, PNG, WEBP, HEIC ou PDF.',
            'files.*.max'       => 'O arquivo :position passa de 10 MB.',
        ];
    }

    /** @return array<int, UploadedFile> */
    public function uploadedFiles(): array
    {
        return array_values($this->file('files', []));
    }
}
