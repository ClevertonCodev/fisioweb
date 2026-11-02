<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Modules\Admin\Models\Exercise;
use Modules\Media\Contracts\VideoServiceInterface;

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

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->has('video_id')) {
                return;
            }

            $user     = Auth::guard('clinic')->user();
            $clinicId = !is_null($user) ? (int) $user->clinic_id : 0;
            $videoId  = (int) $this->input('video_id');

            if ($clinicId <= 0 || !app(VideoServiceInterface::class)->isOwnedByClinic($videoId, $clinicId)) {
                $validator->errors()->add('video_id', 'O vídeo selecionado não pertence a esta clínica.');
            }
        });
    }
}
