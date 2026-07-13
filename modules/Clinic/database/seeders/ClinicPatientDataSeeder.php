<?php

namespace Modules\Clinic\Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Modules\Admin\Models\AdminAssessmentTemplate;
use Modules\Admin\Models\Exercise;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\ExerciseFavorite;
use Modules\ClinicalRecord\Models\Assessment;
use Modules\ClinicalRecord\Models\AssessmentAnswer;
use Modules\ClinicalRecord\Models\AssessmentAnswerOption;
use Modules\ClinicalRecord\Models\EvolutionTemplate;
use Modules\ClinicalRecord\Models\PatientEvolution;
use Modules\ClinicalRecord\Models\PatientFile;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaireAnswer;
use Modules\ClinicQuestionnaire\Models\QuestionnaireQuestion;
use Modules\ClinicQuestionnaire\Models\QuestionnaireSection;
use Modules\ClinicQuestionnaire\Models\QuestionnaireTemplate;
use Modules\Patient\Models\Patient;

/**
 * Preenche os dados clínicos de cada paciente seedado:
 * arquivos, evoluções, avaliações, questionários e favoritos.
 */
class ClinicPatientDataSeeder extends Seeder
{
    /** Arquivos reais hospedados no bucket R2 (fisioweb/patients/files). */
    private const FILES = [
        ['name' => '3e3c36af-f9c8-49ac-8b9b-7c9535f1d4fb_1775785671.jpg', 'original' => 'raio-x-coluna.jpg', 'mime' => 'image/jpeg'],
        ['name' => 'd19a7111-8d40-4fc8-b097-016450b6dc37_1775786161.png', 'original' => 'laudo-ressonancia.png', 'mime' => 'image/png'],
    ];

    private string $cdn;

    public function run(): void
    {
        if (app()->isProduction()) {
            return;
        }

        $this->cdn = rtrim(config('cloudflare.cdn_url', 'https://pub-c505783a14d2470eb49d00e4e17df019.r2.dev'), '/');

        // Dados clínicos de demonstração só para Performance e Premium; Start fica mínima
        $clinics = Clinic::whereIn('email', ['clevertonsantoscodev@gmail.com', 'performance@fisioweb.local'])->get();

        foreach ($clinics as $clinic) {
            $this->seedForClinic($clinic);
        }
    }

    private function seedForClinic(Clinic $clinic): void
    {
        $physios = ClinicUser::where('clinic_id', $clinic->id)->get();
        if ($physios->isEmpty()) {
            $this->command->warn("Clínica {$clinic->id}: sem usuários, pulando dados clínicos.");

            return;
        }

        $patients = Patient::where('clinic_id', $clinic->id)->get();
        if ($patients->isEmpty()) {
            $this->command->warn("Clínica {$clinic->id}: sem pacientes, pulando dados clínicos.");

            return;
        }

        $questionnaireTemplate = $this->questionnaireTemplate($clinic);
        $evolutionTemplate     = EvolutionTemplate::where('is_system', true)->with('sections.items')->first();
        $assessmentTemplates   = AdminAssessmentTemplate::with('sections.fields.options')->get();

        foreach ($patients as $index => $patient) {
            $physio = $physios[$index % $physios->count()];

            $this->seedFiles($clinic, $patient, $physio);
            $this->seedEvolutions($clinic, $patient, $physio, $evolutionTemplate);

            if ($assessmentTemplates->isNotEmpty()) {
                $this->seedAssessment($clinic, $patient, $physio, $assessmentTemplates[$index % $assessmentTemplates->count()]);
            }

            $this->seedQuestionnaire($clinic, $patient, $physio, $questionnaireTemplate);
        }

        $this->seedFavorites($physios);

        $this->command->info("Clínica {$clinic->id}: dados clínicos completos para {$patients->count()} pacientes.");
    }

    private function seedFiles(Clinic $clinic, Patient $patient, ClinicUser $physio): void
    {
        foreach (self::FILES as $file) {
            $path = 'patients/files/' . $file['name'];

            PatientFile::firstOrCreate(
                [
                    'clinic_id'  => $clinic->id,
                    'patient_id' => $patient->id,
                    'file_path'  => $path,
                ],
                [
                    'clinic_user_id' => $physio->id,
                    'original_name'  => $file['original'],
                    'name'           => pathinfo($file['original'], PATHINFO_FILENAME),
                    'cdn_url'        => $this->cdn . '/' . $path,
                    'mime_type'      => $file['mime'],
                    'size'           => 524288,
                ],
            );
        }
    }

    private function seedEvolutions(Clinic $clinic, Patient $patient, ClinicUser $physio, ?EvolutionTemplate $template): void
    {
        if ($template === null || PatientEvolution::where('patient_id', $patient->id)->exists()) {
            return;
        }

        $items = $template->sections->flatMap->items;

        $sessions = [
            ['days_ago' => 14, 'status' => PatientEvolution::STATUS_SIGNED],
            ['days_ago' => 7, 'status' => PatientEvolution::STATUS_SIGNED],
        ];

        foreach ($sessions as $session) {
            $date    = Carbon::today()->subDays($session['days_ago']);
            $checked = $items->shuffle()->take(fake()->numberBetween(4, 8));

            $evolution = PatientEvolution::create([
                'clinic_id'             => $clinic->id,
                'patient_id'            => $patient->id,
                'clinic_user_id'        => $physio->id,
                'evolution_template_id' => $template->id,
                'title'                 => 'Sessão de fisioterapia — ' . $date->format('d/m/Y'),
                'generated_text'        => $checked->pluck('print_text')->implode(' '),
                'notes'                 => fake()->randomElement([
                    'Paciente evoluiu bem, sem queixas durante a sessão.',
                    'Relata melhora do quadro álgico em relação à sessão anterior.',
                    'Mantida conduta. Reavaliar amplitude de movimento na próxima sessão.',
                    'Paciente apresentou leve desconforto ao final, orientado repouso relativo.',
                ]),
                'status'                => $session['status'],
                'signed_at'             => $session['status'] === PatientEvolution::STATUS_SIGNED ? $date->copy()->setTime(18, 0) : null,
                'created_at'            => $date,
                'updated_at'            => $date,
            ]);

            foreach ($checked as $item) {
                $evolution->checkedItems()->create([
                    'evolution_template_item_id' => $item->id,
                    'free_text_value'            => $item->has_free_text ? fake()->randomElement([
                        'EVA 3/10 após a sessão',
                        '3 séries de 12 repetições',
                        'região lombar, 20 minutos',
                        'joelho direito, boa tolerância',
                    ]) : null,
                ]);
            }
        }
    }

    private function seedAssessment(Clinic $clinic, Patient $patient, ClinicUser $physio, AdminAssessmentTemplate $template): void
    {
        if (Assessment::where('patient_id', $patient->id)->exists()) {
            return;
        }

        $assessment = Assessment::create([
            'clinic_id'                    => $clinic->id,
            'patient_id'                   => $patient->id,
            'clinic_user_id'               => $physio->id,
            'admin_assessment_template_id' => $template->id,
            'status'                       => Assessment::STATUS_SIGNED,
            'signed_at'                    => Carbon::today()->subDays(20)->setTime(10, 0),
        ]);

        foreach ($template->sections as $section) {
            foreach ($section->fields as $field) {
                if ($field->options->isNotEmpty()) {
                    AssessmentAnswerOption::create([
                        'assessment_id'                    => $assessment->id,
                        'admin_assessment_field_id'        => $field->id,
                        'admin_assessment_field_option_id' => $field->options->random()->id,
                    ]);

                    continue;
                }

                AssessmentAnswer::create([
                    'assessment_id'             => $assessment->id,
                    'admin_assessment_field_id' => $field->id,
                    'value'                     => $field->field_type === 'range'
                        ? (string) fake()->numberBetween(0, 10)
                        : fake()->randomElement([
                            'Sem alterações dignas de nota.',
                            'Paciente relata dor moderada aos esforços, com melhora ao repouso.',
                            'Apresenta limitação leve de amplitude de movimento.',
                            'Histórico sem comorbidades relevantes para o quadro atual.',
                        ]),
                ]);
            }
        }
    }

    private function questionnaireTemplate(Clinic $clinic): QuestionnaireTemplate
    {
        $template = QuestionnaireTemplate::firstOrCreate(
            ['clinic_id' => $clinic->id, 'title' => 'Avaliação Inicial de Fisioterapia'],
            ['description' => 'Questionário enviado ao paciente antes da primeira sessão.', 'is_active' => true],
        );

        if ($template->sections()->exists()) {
            return $template;
        }

        $anamnese = QuestionnaireSection::create([
            'questionnaire_template_id' => $template->id,
            'title'                     => 'Anamnese',
            'sort_order'                => 0,
        ]);

        QuestionnaireQuestion::create([
            'questionnaire_section_id' => $anamnese->id,
            'label'                    => 'Qual é a sua principal queixa?',
            'type'                     => 'text',
            'required'                 => true,
            'sort_order'               => 0,
        ]);

        QuestionnaireQuestion::create([
            'questionnaire_section_id' => $anamnese->id,
            'label'                    => 'Em uma escala de 0 a 10, qual a intensidade da sua dor hoje?',
            'type'                     => 'scale',
            'scale_min'                => 0,
            'scale_max'                => 10,
            'required'                 => true,
            'sort_order'               => 1,
        ]);

        $habitos = QuestionnaireSection::create([
            'questionnaire_template_id' => $template->id,
            'title'                     => 'Hábitos de Vida',
            'sort_order'                => 1,
        ]);

        QuestionnaireQuestion::create([
            'questionnaire_section_id' => $habitos->id,
            'label'                    => 'Com que frequência pratica atividade física?',
            'type'                     => 'multiple_choice',
            'options'                  => ['Nunca', '1-2x por semana', '3-4x por semana', 'Todos os dias'],
            'required'                 => true,
            'sort_order'               => 0,
        ]);

        QuestionnaireQuestion::create([
            'questionnaire_section_id' => $habitos->id,
            'label'                    => 'Quais atividades agravam a sua dor?',
            'type'                     => 'checkbox',
            'options'                  => ['Ficar sentado', 'Ficar em pé', 'Caminhar', 'Carregar peso', 'Dormir'],
            'required'                 => false,
            'sort_order'               => 1,
        ]);

        return $template;
    }

    private function seedQuestionnaire(Clinic $clinic, Patient $patient, ClinicUser $physio, QuestionnaireTemplate $template): void
    {
        if (PatientQuestionnaire::where('patient_id', $patient->id)->exists()) {
            return;
        }

        $answeredAt = Carbon::today()->subDays(25)->setTime(9, 30);

        $questionnaire = PatientQuestionnaire::create([
            'clinic_id'                 => $clinic->id,
            'patient_id'                => $patient->id,
            'clinic_user_id'            => $physio->id,
            'questionnaire_template_id' => $template->id,
            'modality'                  => fake()->randomElement([PatientQuestionnaire::MODALITY_PRESENCIAL, PatientQuestionnaire::MODALITY_REMOTO]),
            'status'                    => PatientQuestionnaire::STATUS_ANSWERED,
            'answered_at'               => $answeredAt,
            'expires_at'                => $answeredAt->copy()->addDays(7),
        ]);

        $questions = QuestionnaireQuestion::whereIn(
            'questionnaire_section_id',
            $template->sections()->pluck('id'),
        )->get();

        foreach ($questions as $question) {
            PatientQuestionnaireAnswer::create([
                'patient_questionnaire_id'  => $questionnaire->id,
                'questionnaire_question_id' => $question->id,
                'answer'                    => match ($question->type) {
                    'scale'           => fake()->numberBetween($question->scale_min, $question->scale_max),
                    'multiple_choice' => fake()->randomElement($question->options),
                    'checkbox'        => fake()->randomElements($question->options, fake()->numberBetween(1, 2)),
                    default           => fake()->randomElement([
                        'Dor na região lombar ao final do dia.',
                        'Dor no joelho direito ao subir escadas.',
                        'Dor no ombro ao levantar o braço.',
                    ]),
                },
            ]);
        }
    }

    private function seedFavorites($physios): void
    {
        $exercises = Exercise::take(6)->get();

        foreach ($physios as $physio) {
            foreach ($exercises->shuffle()->take(3) as $exercise) {
                ExerciseFavorite::firstOrCreate([
                    'clinic_user_id' => $physio->id,
                    'exercise_id'    => $exercise->id,
                ]);
            }
        }
    }
}
