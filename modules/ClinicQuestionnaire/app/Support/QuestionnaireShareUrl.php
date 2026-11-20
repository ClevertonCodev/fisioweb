<?php

namespace Modules\ClinicQuestionnaire\Support;

final class QuestionnaireShareUrl
{
    public static function from(?string $slug, ?string $token): ?string
    {
        if (empty($slug) || empty($token)) {
            return null;
        }

        return rtrim((string) config('app.url'), '/')
            . '/' . $slug
            . '/paciente/questionarios/'
            . $token;
    }
}
