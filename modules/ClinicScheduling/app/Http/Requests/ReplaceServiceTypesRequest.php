<?php

namespace Modules\ClinicScheduling\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\ClinicScheduling\Data\ServiceTypeData;

class ReplaceServiceTypesRequest extends FormRequest
{
    public const MAX_ITEMS = 30;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items'                    => ['present', 'array', 'max:' . self::MAX_ITEMS],
            'items.*'                  => ['array'],
            'items.*.id'               => ['nullable', 'integer', 'distinct'],
            'items.*.name'             => ['required', 'string', 'max:100', 'distinct:ignore_case'],
            'items.*.duration_minutes' => ['required', 'integer', 'min:5', 'max:480'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.*.name.distinct' => 'Já existe um tipo com esse nome.',
        ];
    }

    /**
     * @return list<ServiceTypeData>
     */
    public function items(): array
    {
        return array_map(
            fn (array $item) => ServiceTypeData::fromArray($item),
            array_values($this->validated('items')),
        );
    }
}
