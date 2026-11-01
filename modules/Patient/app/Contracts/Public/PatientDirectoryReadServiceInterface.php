<?php

namespace Modules\Patient\Contracts\Public;

use Modules\Patient\Data\Public\PatientNameDTO;

/**
 * Leitura pública de nomes de paciente para outros módulos (ex.: Finanças), sempre
 * limitada à clínica. Devolve DTO, nunca o Model.
 */
interface PatientDirectoryReadServiceInterface
{
    /**
     * Os pacientes da clínica com esses ids, inclusive os excluídos (um lançamento antigo
     * continua dizendo quem pagou). Id de outra clínica fica de fora.
     *
     * @param  list<int>  $ids
     * @return array<int, PatientNameDTO> indexado pelo id
     */
    public function namesByIds(int $clinicId, array $ids): array;

    /**
     * Pacientes da clínica cujo nome contém o termo, sem diferenciar maiúscula, em ordem
     * alfabética. Com `$withTrashed`, entram também os excluídos. "%" e "_" no termo são texto,
     * não curinga; termo vazio (ou "0") devolve lista vazia.
     *
     * @return list<PatientNameDTO>
     */
    public function searchByName(int $clinicId, string $term, int $limit = 20, bool $withTrashed = false): array;
}
