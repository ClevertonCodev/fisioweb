<?php

namespace Modules\Patient\Services;

use Illuminate\Support\Collection;
use Modules\Patient\Models\Patient;
use Modules\Patient\Support\PatientIdentifier;

/**
 * Regras de autenticação do paciente: elegibilidade e descoberta de clínicas.
 *
 * O Controller apenas orquestra; normalização do identificador vive no
 * PatientIdentifier e a decisão de quem pode entrar vive aqui.
 */
class PatientAuthService
{
    /**
     * Status clínicos que impedem o login.
     *
     * Deliberadamente diferente de Patient::INACTIVE_STATUSES, que inclui
     * `alta`. Alta é desfecho positivo — é justamente quando o paciente ainda
     * quer rever o programa que fez. Reusar o scope do dashboard aqui faria
     * uma mudança lá quebrar o acesso silenciosamente.
     */
    public const BLOCKED_STATUSES = [
        Patient::STATUS_OBITO,
        Patient::STATUS_CANCELADO,
    ];

    /**
     * O paciente pode autenticar?
     *
     * Soft delete não precisa ser checado: o provider Eloquent já exclui
     * registros removidos.
     */
    public function isEligible(Patient $patient): bool
    {
        if (!$patient->is_active) {
            return false;
        }

        return !in_array($patient->status, self::BLOCKED_STATUSES, true);
    }

    /**
     * Traduz o contexto de clínica recebido no login para o `clinic_id`.
     *
     * O paciente que chega por `/{clinicSlug}/paciente/...` conhece o slug, não
     * o id. A busca passa pela relação já existente `Patient::clinic` para não
     * introduzir dependência direta no Model de Clinic — `clinics.slug` é
     * único, então qualquer paciente daquela clínica devolve o mesmo id.
     *
     * Devolve `null` quando nada resolve; o chamador trata como credencial
     * inválida, sem distinguir a causa.
     */
    public function resolveClinicId(?int $clinicId, ?string $clinicSlug): ?int
    {
        if (!is_null($clinicId) && $clinicId > 0) {
            return $clinicId;
        }

        if (empty($clinicSlug)) {
            return null;
        }

        return Patient::query()
            ->whereHas('clinic', fn ($query) => $query->where('slug', $clinicSlug))
            ->value('clinic_id');
    }

    /**
     * Clínicas em que o identificador possui cadastro elegível.
     *
     * Clínicas onde o paciente é inelegível são omitidas: uma opção que
     * apareceria na lista e depois falharia no login é pior que não aparecer.
     *
     * Devolve coleção vazia quando não há vínculo — nunca sinaliza a
     * inexistência do cadastro, o que transformaria o endpoint em um oráculo
     * de CPFs válidos.
     *
     * @return Collection<int, array{id: int, name: string, slug: string|null}>
     */
    public function findClinicsFor(PatientIdentifier $identifier): Collection
    {
        return Patient::query()
            ->where($identifier->column(), $identifier->value)
            ->with('clinic:id,name,slug')
            ->get()
            ->filter(fn (Patient $patient) => $this->isEligible($patient))
            ->filter(fn (Patient $patient) => !is_null($patient->clinic))
            ->map(fn (Patient $patient) => [
                'id'   => $patient->clinic->id,
                'name' => $patient->clinic->name,
                'slug' => $patient->clinic->slug,
            ])
            ->unique('id')
            ->values();
    }
}
