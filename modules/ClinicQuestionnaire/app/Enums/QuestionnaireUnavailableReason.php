<?php

namespace Modules\ClinicQuestionnaire\Enums;

enum QuestionnaireUnavailableReason: string
{
    case Answered = 'answered';
    case Expired  = 'expired';
}
