<?php

namespace Modules\Email\Contracts;

use Modules\ClinicQuestionnaire\Events\QuestionnaireEmailRequested;

interface QuestionnaireEmailSenderInterface
{
    public const EMAIL_TYPE = 'questionnaire_sent';

    public function send(QuestionnaireEmailRequested $event): void;
}
