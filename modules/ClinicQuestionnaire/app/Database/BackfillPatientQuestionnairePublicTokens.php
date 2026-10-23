<?php

namespace Modules\ClinicQuestionnaire\Database;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class BackfillPatientQuestionnairePublicTokens
{
    public function __invoke(): int
    {
        $updated = 0;
        $ids     = DB::table('clinic_patient_questionnaires')
            ->whereNull('public_token')
            ->orderBy('id')
            ->pluck('id');

        foreach ($ids as $id) {
            DB::table('clinic_patient_questionnaires')->where('id', $id)->update([
                'public_token' => (string) Str::uuid(),
            ]);
            $updated++;
        }

        return $updated;
    }
}
