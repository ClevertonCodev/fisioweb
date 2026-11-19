<?php

namespace Modules\ClinicQuestionnaire\Exceptions;

use Illuminate\Validation\ValidationException;
use Modules\ClinicQuestionnaire\Enums\QuestionnaireUnavailableReason;

class QuestionnaireUnavailableException extends ValidationException
{
    public QuestionnaireUnavailableReason $reason;

    public static function because(QuestionnaireUnavailableReason $reason, string $message): self
    {
        $exception         = static::withMessages(['questionnaire' => [$message]]);
        $exception->reason = $reason;

        return $exception;
    }
}
