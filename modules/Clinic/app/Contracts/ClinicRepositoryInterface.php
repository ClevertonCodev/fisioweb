<?php

namespace Modules\Clinic\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;

interface ClinicRepositoryInterface
{
    public function find(int $id): ?Clinic;

    public function findOrFail(int $id): Clinic;

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function create(array $data): Clinic;

    public function createWithoutMasterUserObserver(array $data): Clinic;

    public function createMasterUser(array $data): ClinicUser;

    public function findClinicUserWithClinic(int $clinicUserId): ?ClinicUser;

    public function findActiveUnverifiedUserByEmail(string $email): ?ClinicUser;

    public function markClinicUserEmailVerified(ClinicUser $user): void;

    public function findMasterUser(int $clinicId): ?ClinicUser;

    public function findClinicUserByFirstAccessTokenHashForUpdate(string $hash): ?ClinicUser;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function saveClinicUser(ClinicUser $user, array $attributes): void;

    public function update(int $id, array $data): Clinic;

    public function delete(int $id): bool;

    public function slugExistsWithTrashed(string $slug): bool;
}
