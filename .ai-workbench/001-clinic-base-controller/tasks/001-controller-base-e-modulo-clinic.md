# Criar ClinicAuthenticatedController e migrar Patient, ClinicProfile e Exercise

**Tipo:** Tarefa
**Plano:** `../plans/clinic-base-controller.md`
**Issue:** ainda não criada

## Descrição

Os controllers do guard `clinic` repetem `Auth::guard('clinic')->user()` e convertem `clinic_id` cada um do seu jeito. Esta tarefa cria o controller base abstrato no núcleo compartilhado do backend, com três métodos de identidade, e migra os três controllers do módulo `Clinic` que já têm teste de outra clínica: Patient, ClinicProfile e Exercise. Assim o controller base entra cedo, e as tarefas seguintes (002 a 007) podem rodar em paralelo.

Cobre as histórias 1 a 6, parte da 7, a 16 e a 17 do plano.

## O que construir

- **Controller base `ClinicAuthenticatedController`.** Fica no namespace `App\Http\Controllers`, fora de `modules/`, e estende o `Controller` do projeto, então `authorize` e `authorizeResource` continuam funcionando. Expõe três métodos:
  - `clinicUser()`: o usuário autenticado no guard `clinic`, tipado pelo contrato `Authenticatable`, sem importar `ClinicUser`;
  - `clinicId(): int`;
  - `clinicUserId(): int`.

  Sem usuário no guard, os três lançam `AuthenticationException`, que vira 401 JSON.
- **PatientController, ClinicProfileController e ExerciseController** passam a estender o controller base e trocam todo acesso ao guard pelos métodos novos. Isso inclui o `Auth::guard('clinic')->id()` do Exercise.
- Onde uma comparação estrita usa `clinic_id` de um model, esse lado ganha `(int)`, porque nenhum model faz cast. Os `(int)` redundantes do lado do `clinicId()` saem.
- **Nada muda para quem usa:**
  - continua o guard `clinic`, com os papéis `admin`, `physiotherapist` e `secretary`;
  - Policies e `authorize` ficam iguais;
  - status, mensagens e envelope `data` ficam iguais;
  - o filtro por `clinic_id` fica no mesmo lugar.
- Não tem migration, fila nem frontend.

## Critérios de Aceite

- [x] O controller base existe, estende o `Controller` do projeto e não importa nada de `Modules\`.
- [x] Há teste unitário do controller base cobrindo:
  - [x] `clinicUser()` devolve o usuário autenticado no guard `clinic`;
  - [x] `clinicId()` e `clinicUserId()` devolvem `int`;
  - [x] sem usuário, os métodos lançam `AuthenticationException`.
- [x] Nenhum `Auth::guard('clinic')` ou `auth('clinic')` sobra em PatientController, ClinicProfileController e ExerciseController.
- [x] Toda comparação estrita de `clinic_id` nesses controllers converte o lado do model para `int`.
- [x] `PatientControllerTest`, `ExerciseControllerTest` e `ExerciseSubmissionTest` passam sem alteração nos testes.
- [x] Os testes existentes de outra clínica em Patient e Exercise continuam verdes: um usuário de outra clínica não vê nem altera paciente ou exercício privado desta clínica pelos caminhos que esses testes cobrem.
  - **Ressalva (revisão adversária, 2026-10-13):** `POST /exercises/{id}/favorite` + `GET /favorites` deixam outra clínica ler exercício privado/pendente — falha que já existia na `main` (89a483db), não criada nem alterada por esta refatoração. Vai num bugfix separado (`bugfix/favoritos-visibilidade`), por decisão do usuário.
- [x] `GET /api/clinic/profile` devolve só a clínica do usuário autenticado.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/clinic-base-controller`
- **Exemplo no código:**
  - `app/Http/Controllers/BaseAuthController.php`: controller base abstrato que já existe no núcleo;
  - `modules/Clinic/tests/Feature/PatientControllerTest.php`: padrão de teste com `actingAs($user, 'clinic')` e o caso de outra clínica.
- **Skills:** `backend-clean-code`, `architecture-paradigm-modular-monolith`, `php-modern`, `php-testing`.
- **Atenção:** o teste unitário pode usar `Auth::guard('clinic')->setUser(...)`, ou `actingAs`, numa subclasse anônima de teste que expõe os métodos protegidos.

## Como testar na mão

1. Com duas clínicas, A e B, cada uma com um usuário `admin`, entrar como A.
2. `GET /api/clinic/patients` lista só pacientes de A. `GET /api/clinic/patients/{id}` de um paciente de A devolve 200.
3. Entrar como B e chamar `GET /api/clinic/patients/{id}` com o id do paciente de A: deve dar 404, como hoje.
4. `GET /api/clinic/profile` como A mostra a clínica A; como B, a clínica B.
5. `GET /api/clinic/exercises` como B não lista exercício privado enviado por A.
6. Chamar `GET /api/clinic/patients` sem token: 401.
