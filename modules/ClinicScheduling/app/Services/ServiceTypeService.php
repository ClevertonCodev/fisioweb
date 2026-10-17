<?php

namespace Modules\ClinicScheduling\Services;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\ClinicScheduling\Contracts\ServiceTypeRepositoryInterface;
use Modules\ClinicScheduling\Contracts\ServiceTypeServiceInterface;

class ServiceTypeService implements ServiceTypeServiceInterface
{
    /** Tipos que toda clínica recebe na primeira leitura: nome => minutos. */
    public const DEFAULTS = [
        'Avaliação'         => 60,
        'Sessão'            => 45,
        'Retorno'           => 30,
        'Reavaliação'       => 60,
        'Sessão de Pilates' => 60,
    ];

    public function __construct(
        private readonly ServiceTypeRepositoryInterface $repository,
    ) {}

    public function listForClinic(int $clinicId): Collection
    {
        if (!$this->repository->clinicHasAnyIncludingDeleted($clinicId)) {
            $this->seedDefaults($clinicId);
        }

        return $this->repository->listForClinic($clinicId);
    }

    public function replace(int $clinicId, array $items): Collection
    {
        return $this->withClinicLock($clinicId, function () use ($clinicId, $items) {
            return DB::transaction(function () use ($clinicId, $items) {
                // Substituir antes da primeira leitura: os padrão entram e saem
                // aqui, para uma lista vazia não fazê-los aparecer depois.
                $this->createDefaultsIfNeverHad($clinicId);

                $current = $this->repository->listForClinic($clinicId)->keyBy('id');

                foreach ($items as $index => $item) {
                    if (!is_null($item->id) && !$current->has($item->id)) {
                        throw ValidationException::withMessages([
                            "items.{$index}.id" => 'Tipo de serviço não encontrado.',
                        ]);
                    }
                }

                $keepIds = [];
                foreach ($items as $position => $item) {
                    if (is_null($item->id)) {
                        $keepIds[] = (int) $this->repository
                            ->create($clinicId, $item->name, $item->durationMinutes, $position)
                            ->id;

                        continue;
                    }

                    $this->repository->update($current->get($item->id), $item->name, $item->durationMinutes, $position);
                    $keepIds[] = $item->id;
                }

                $this->repository->deleteForClinicExcept($clinicId, $keepIds);

                return $this->repository->listForClinic($clinicId);
            });
        });
    }

    /**
     * Duas leituras ao mesmo tempo não podem gravar os padrão duas vezes: o
     * lock serializa por clínica e a checagem é refeita lá dentro.
     */
    private function seedDefaults(int $clinicId): void
    {
        $this->withClinicLock($clinicId, function () use ($clinicId) {
            DB::transaction(fn () => $this->createDefaultsIfNeverHad($clinicId));
        });
    }

    /** Chamar com o lock da clínica e dentro de uma transação. */
    private function createDefaultsIfNeverHad(int $clinicId): void
    {
        if ($this->repository->clinicHasAnyIncludingDeleted($clinicId)) {
            return;
        }

        $position = 0;
        foreach (self::DEFAULTS as $name => $minutes) {
            $this->repository->create($clinicId, $name, $minutes, $position++);
        }
    }

    private function withClinicLock(int $clinicId, callable $callback): mixed
    {
        return Cache::lock("clinic-service-types:{$clinicId}", 10)->block(5, $callback);
    }
}
