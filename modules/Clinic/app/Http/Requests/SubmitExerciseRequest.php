<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Modules\Admin\Models\Exercise;

class SubmitExerciseRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = Auth::guard('clinic')->user();

        return !is_null($user) && $user->isAdmin();
    }

    public function rules(): array
    {
        return [
            'name'             => ['required', 'string', 'max:255'],
            'physio_area_id'   => ['required', 'integer', 'exists:admin_physio_areas,id'],
            'difficulty_level' => ['required', Rule::in(array_keys(Exercise::DIFFICULTIES))],
            'description'      => ['nullable', 'string'],
            'video_id'         => ['required', 'integer', 'exists:media_videos,id'],
        ];
    }
}
