<?php

namespace Modules\Clinic\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Clinic\Contracts\ClinicRepositoryInterface;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;

class ClinicRepository implements ClinicRepositoryInterface
{
    public function __construct(protected Clinic $model) {}

    public function find(int $id): ?Clinic
    {
        return $this->model->find($id);
    }

    public function findOrFail(int $id): Clinic
    {
        return $this->model->with('plan')->findOrFail($id);
    }

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->query();

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (isset($filters['plan_id'])) {
            $query->where('plan_id', $filters['plan_id']);
        }

        if (array_key_exists('status', $filters)) {
            $query->where('status', (int) $filters['status']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (isset($filters['search']) && $filters['search'] !== '') {
            $search       = $filters['search'];
            $searchDigits = preg_replace('/[^\d]+/', '', $search);
            $query->where(function ($q) use ($search, $searchDigits) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('crefito', 'like', "%{$search}%");
                if ($searchDigits !== '') {
                    $q->orWhere('document', 'like', "%{$searchDigits}%");
                }
            });
        }

        return $query->with('plan')->latest()->paginate($perPage);
    }

    public function create(array $data): Clinic
    {
        return $this->model->create($data);
    }

    public function createWithoutMasterUserObserver(array $data): Clinic
    {
        $clinic                         = new Clinic($data);
        $clinic->skipMasterUserObserver = true;
        $clinic->save();

        return $clinic;
    }

    public function createMasterUser(array $data): ClinicUser
    {
        $master = (new ClinicUser)->forceFill($data);
        $master->save();

        return $master;
    }

    public function findClinicUserWithClinic(int $clinicUserId): ?ClinicUser
    {
        return ClinicUser::with('clinic')->find($clinicUserId);
    }

    public function findActiveUnverifiedUserByEmail(string $email): ?ClinicUser
    {
        return ClinicUser::query()
            ->where('email', mb_strtolower(trim($email)))
            ->where('status', ClinicUser::STATUS_ACTIVE)
            ->whereNull('email_verified_at')
            ->first();
    }

    public function markClinicUserEmailVerified(ClinicUser $user): void
    {
        $user->forceFill(['email_verified_at' => now()])->save();
    }

    public function findMasterUser(int $clinicId): ?ClinicUser
    {
        return ClinicUser::query()
            ->where('clinic_id', $clinicId)
            ->where('mestre', ClinicUser::MESTRE_YES)
            ->orderBy('id')
            ->first();
    }

    public function findActiveAdminForImpersonation(int $clinicId): ?ClinicUser
    {
        return ClinicUser::query()
            ->where('clinic_id', $clinicId)
            ->where('role', ClinicUser::ROLE_ADMIN)
            ->where('status', ClinicUser::STATUS_ACTIVE)
            ->orderByDesc('mestre')
            ->orderBy('id')
            ->first();
    }

    public function clinicUserNames(int $clinicId, array $ids): array
    {
        if (empty($ids)) {
            return [];
        }

        return ClinicUser::withTrashed()
            ->where('clinic_id', $clinicId)
            ->whereIn('id', $ids)
            ->pluck('name', 'id')
            ->all();
    }

    public function findClinicUserByFirstAccessTokenHashForUpdate(string $hash): ?ClinicUser
    {
        return ClinicUser::query()->where('first_access_token_hash', $hash)->lockForUpdate()->first();
    }

    public function saveClinicUser(ClinicUser $user, array $attributes): void
    {
        $user->forceFill($attributes)->save();
    }

    public function update(int $id, array $data): Clinic
    {
        $clinic = $this->model->findOrFail($id);
        $clinic->update($data);

        return $clinic->fresh(['plan']);
    }

    public function delete(int $id): bool
    {
        return (bool) $this->model->findOrFail($id)->delete();
    }

    public function slugExistsWithTrashed(string $slug): bool
    {
        return $this->model->withTrashed()->where('slug', $slug)->exists();
    }
}
