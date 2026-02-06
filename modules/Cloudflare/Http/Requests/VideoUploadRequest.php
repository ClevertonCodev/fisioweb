<?php

namespace Modules\Cloudflare\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VideoUploadRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Adjust based on your authorization logic
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $maxSize = config('cloudflare.max_video_size', 524288000); // in bytes
        $maxSizeMB = $maxSize / 1024; // convert to KB for Laravel validation

        return [
            'video' => [
                'required',
                'file',
                'mimes:mp4,mpeg,mpg,mov,avi,webm,flv,mkv',
                "max:{$maxSizeMB}",
            ],
            'directory' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        $maxSizeMB = config('cloudflare.max_video_size', 524288000) / 1048576;

        return [
            'video.required' => 'Please select a video file to upload.',
            'video.file' => 'The uploaded file must be a valid video file.',
            'video.mimes' => 'The video must be one of the following formats: MP4, MPEG, MOV, AVI, WebM, FLV, MKV.',
            'video.max' => "The video file size must not exceed {$maxSizeMB}MB.",
            'directory.string' => 'The directory must be a valid string.',
            'directory.max' => 'The directory name is too long.',
        ];
    }
}
