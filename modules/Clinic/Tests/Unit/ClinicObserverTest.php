<?php

namespace Modules\Clinic\Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class ClinicObserverTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_clinic_creates_first_user_with_email_and_document_as_password(): void
    {
        $clinic = Clinic::create([
            'name'        => 'Clínica São Paulo',
            'document'    => '12345678901',
            'type_person' => Clinic::TYPE_PERSON_FISICA,
            'status'      => Clinic::STATUS_ACTIVE,
            'email'       => 'contato@clinicasaopaulo.com.br',
            'phone'       => '11999999999',
            'slug'        => 'clinica-sao-paulo',
            'zip_code'    => '01310100',
            'address'     => 'Av. Paulista',
            'number'      => '1000',
            'city'        => 'São Paulo',
            'state'       => 'SP',
        ]);

        $this->assertDatabaseHas('clinic_users', [
            'clinic_id' => $clinic->id,
            'email'     => 'contato@clinicasaopaulo.com.br',
            'name'      => 'Clínica São Paulo',
            'document'  => '12345678901',
            'role'      => ClinicUser::ROLE_ADMIN,
            'status'    => ClinicUser::STATUS_ACTIVE,
        ]);

        $user = ClinicUser::where('clinic_id', $clinic->id)->where('email', $clinic->email)->first();
        $this->assertInstanceOf(ClinicUser::class, $user);
        $this->assertTrue(Hash::check('12345678901', $user->password), 'Senha do usuário deve ser o documento (CPF/CNPJ) da clínica.');
    }

    public function test_created_user_belongs_to_clinic(): void
    {
        $clinic = Clinic::create([
            'name'        => 'Clínica Centro',
            'document'    => '98765432000199',
            'type_person' => Clinic::TYPE_PERSON_JURIDICA,
            'status'      => Clinic::STATUS_ACTIVE,
            'email'       => 'admin@clinicacentro.com.br',
            'phone'       => '1133334444',
            'slug'        => 'clinica-centro',
            'zip_code'    => '01001000',
            'address'     => 'Praça da Sé',
            'number'      => '1',
            'city'        => 'São Paulo',
            'state'       => 'SP',
        ]);

        $clinic->load('users');
        $this->assertCount(1, $clinic->users);
        $this->assertEquals($clinic->id, $clinic->users->first()->clinic_id);
        $this->assertEquals(ClinicUser::ROLE_ADMIN, $clinic->users->first()->role);
    }
}
