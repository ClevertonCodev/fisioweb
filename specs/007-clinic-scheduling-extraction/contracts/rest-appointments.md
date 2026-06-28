# REST Contract — Appointments (PRESERVED, must not change)

Todos os paths, métodos, request shapes e response shapes abaixo são **idênticos aos atuais** e não podem mudar. Apenas o owner do controller muda de `Modules\Clinic\Http\Controllers\AppointmentController` para `Modules\ClinicScheduling\Http\Controllers\AppointmentController`.

Grupo: `prefix('clinic')` + `middleware(['auth:clinic','clinic.guard'])`, sub-prefixo `appointments`, names `clinic.appointments.*`. Montado sob `prefix('api')` + `name('api.')` pelo `RouteServiceProvider` do módulo.

| Método | URI (full) | Route name | Controller action |
|--------|-----------|------------|-------------------|
| GET | `api/clinic/appointments` | `api.clinic.appointments.index` | `index` |
| POST | `api/clinic/appointments` | `api.clinic.appointments.store` | `store` |
| GET | `api/clinic/appointments/{appointment}` | `api.clinic.appointments.show` | `show` |
| PUT | `api/clinic/appointments/{appointment}` | `api.clinic.appointments.update` | `update` |
| PATCH | `api/clinic/appointments/{appointment}/status` | `api.clinic.appointments.status` | `updateStatus` |
| POST | `api/clinic/appointments/{appointment}/cancel` | `api.clinic.appointments.cancel` | `cancel` |

## index — GET /api/clinic/appointments

Query params (opcionais): `from`, `to`, `clinic_user_id`, `status`.
Visibilidade: fisioterapeuta recebe apenas a própria agenda (forçado no Service).
Response 200: `{ "data": [ Appointment(load: patient, clinicUser) ... ] }`.

## store — POST /api/clinic/appointments

Request body:
```
patient_id      required, exists:patients,id
clinic_user_id  required, exists:clinic_users,id   (forçado ao próprio id se fisioterapeuta)
title           nullable string max:255
description     nullable string
location        nullable string max:255
starts_at       required date
ends_at         required date, after:starts_at
```
Regras multi-tenant (withValidator): patient e clinic_user pertencem à clínica do usuário; responsável é fisioterapeuta.
`clinic_id` é injetado pelo controller a partir do usuário autenticado. Status inicial = `scheduled`, `source = system`.
Response 201: `{ "data": Appointment(load: patient, clinicUser) }`.

## show — GET /api/clinic/appointments/{appointment}

404 se de outra clínica. Response 200: `{ "data": Appointment(load: patient, clinicUser) }`.

## update — PUT /api/clinic/appointments/{appointment}

Request body (todos `sometimes`): mesmos campos do store. `status` é **ignorado** aqui (só via updateStatus).
404 se de outra clínica. Response 200: `{ "data": Appointment(load: patient, clinicUser) }`.

## updateStatus — PATCH /api/clinic/appointments/{appointment}/status

Request: `status` required (enum AppointmentStatus). Transição inválida → 422 `{ errors: { status: [...] } }`.
Response 200: `{ "data": Appointment(load: patient, clinicUser) }`.

## cancel — POST /api/clinic/appointments/{appointment}/cancel

Atalho para status→cancelled. Response 200: `{ "data": Appointment(load: patient, clinicUser) }`.

## Contract test

`SchedulingRouteCompatibilityTest` (Feature) assegura: estas 4 URIs com seus métodos existem e todos os owners começam com `Modules\ClinicScheduling\Http\Controllers\Appointment`.
