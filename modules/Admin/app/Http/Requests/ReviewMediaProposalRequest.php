<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReviewMediaProposalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'video_id'         => ['required', 'integer'],
            'proposal_version' => ['required', 'string', 'max:128'],
        ];
    }
}
