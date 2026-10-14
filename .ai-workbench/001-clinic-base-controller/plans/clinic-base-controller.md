# Controller base para o guard clinic

Data: 2026-10-13
Fonte: conversa de refinamento (skill `refinar`) sobre a repetição de `Auth::guard('clinic')->user()` nos controllers.

## Problema

Quem mantém o backend repete a mesma leitura do usuário autenticado da clínica em cerca de 130 pontos, espalhados por uns 20 controllers de 7 módulos (`Clinic`, `ClinicFinance`, `ClinicScheduling`, `ClinicalRecord`, `ClinicQuestionnaire`, `TreatmentProgram`, `GoogleCalendar`). Cada controller escreve do seu jeito: alguns convertem `clinic_id` com `(int)`, outros não, e alguns comparam com `!==` estrito sem conversão. O resultado é ruído, risco de comparação de tipo errada e nenhuma garantia de que um controller novo vá seguir o padrão.

Para a clínica (`admin`, `physiotherapist`, `secretary`) nada muda: é uma refatoração interna sem efeito visível.

## Solução

Um controller base abstrato no núcleo compartilhado do backend, que os controllers autenticados no guard `clinic` estendem. Ele oferece três métodos de identidade: o usuário da clínica, o `clinic_id` já como inteiro e o id do usuário. Todos os controllers de clínica passam a usar esses métodos. Um teste de arquitetura impede que o acesso direto ao guard volte a aparecer.

Comportamento, status HTTP, mensagens e isolamento entre clínicas ficam exatamente como estão. Onde falta um teste com dado de outra clínica, escrevemos esse teste antes de mexer no controller, para provar que o isolamento continua igual.

## Histórias de Usuário

1. Como dev do backend, quero obter o usuário da clínica com uma chamada curta e padronizada, para não repetir `Auth::guard('clinic')->user()` em todo método.
2. Como dev do backend, quero obter o `clinic_id` já como inteiro, para não espalhar `(int)` e não errar comparação estrita.
3. Como dev do backend, quero obter o id do usuário da clínica como inteiro, para gravar autoria (`clinic_user_id`, `created_by`) sem conversão manual.
4. Como dev do backend, quero que chamar esses métodos sem usuário autenticado devolva 401, e não um erro de "propriedade de null" com 500.
5. Como dev do backend, quero que o controller base fique fora de `modules/Clinic`, para que os outros módulos possam usá-lo sem violar o `ModuleBoundaryTest`.
6. Como dev do backend, quero que o controller base continue herdando do `Controller` do projeto, para manter `authorize` e `authorizeResource` funcionando.
7. Como dev do backend, quero que os controllers de `modules/Clinic` (Patient, ClinicUser, ClinicProfile, Dashboard, Exercise) usem o controller base.
8. Como dev do backend, quero que os controllers de `ClinicFinance` (Category, Transaction, Summary, Report, Export) usem o controller base.
9. Como dev do backend, quero que o `AppointmentController` de `ClinicScheduling` use o controller base.
10. Como dev do backend, quero que os controllers de `ClinicalRecord` (Assessment, Evolution, EvolutionTemplate, PatientFile) usem o controller base.
11. Como dev do backend, quero que os controllers de `ClinicQuestionnaire` (QuestionnaireTemplate, PatientQuestionnaire) usem o controller base.
12. Como dev do backend, quero que os controllers de `TreatmentProgram` (TreatmentPlan, ProgramDraft) usem o controller base.
13. Como dev do backend, quero que as ações autenticadas do `GoogleCalendarController` (connect, status, pull, disconnect) usem o controller base, sem afetar o callback público.
14. Como dev do backend, quero um teste de arquitetura que falhe quando um controller de clínica acessar o guard `clinic` direto, para que o padrão não volte.
15. Como dev do backend, quero que esse teste aceite só as exceções legítimas (login, logout e refresh no fluxo de autenticação, e impersonação no painel admin), para que elas fiquem explícitas.
16. Como clínica, quero continuar vendo só os meus dados, para que a refatoração não exponha nada de outra clínica.
17. Como clínica, quero que os endpoints continuem respondendo com o mesmo status, envelope `data` e mensagem de hoje, para que o SPA não quebre.
18. Como revisor, quero que todo controller sem teste de outra clínica ganhe esse teste antes de ser migrado, para ter prova de que o isolamento não mudou.

## Decisões de Implementação

- **Dono:** o controller base vive no núcleo compartilhado do backend (namespace `App\Http\Controllers`), ao lado do `Controller` e do `BaseAuthController` que já estão lá. Ele não pode morar em `modules/Clinic`, porque o `ModuleBoundaryTest` e a skill `architecture-paradigm-modular-monolith` proíbem que os módulos importem internos de outro módulo. Nenhuma tela muda.
- **Nome:** `ClinicAuthenticatedController`. O nome `ClinicController` já é usado pelo controller de clínicas do painel admin.
- **Interface do controller base** (abstrato, estende `Controller`):

  ```php
  protected function clinicUser(): Authenticatable; // usuário do guard clinic
  protected function clinicId(): int;               // clinic_id do usuário
  protected function clinicUserId(): int;           // id do usuário
  ```

  - O retorno usa o contrato `Authenticatable` do Laravel, e não o model `ClinicUser`. Assim `app/` não importa nada de `Modules\Clinic`, já que o núcleo compartilhado não depende de módulo. Um docblock `@return` pode indicar o tipo concreto para a IDE.
  - Sem usuário no guard, o controller base lança `AuthenticationException`. O handler do Laravel transforma isso em 401 JSON. Na prática as rotas já estão sob `auth:clinic`, então isso só protege contra uso fora da rota certa.
- **Migration:** nenhuma. Não há dado novo nem dado antigo para converter.
- **Endpoints:** nenhum contrato muda. Método, URL, guard, entrada, saída (envelope `data`), status e mensagens ficam iguais.
- **Comparação de `clinic_id`:** nenhum model faz cast de `clinic_id` para inteiro. Como `clinicId()` passa a devolver `int`, toda comparação estrita com `clinic_id` vindo de um model ganha `(int)` desse lado. Exemplos são o `PatientController`, com `$patient->clinic_id !== $clinicId`, e o `TreatmentPlanController`. Do lado do `clinicId()`, os `(int)` que sobrarem são removidos.
- **Permissões:** nada muda. As chamadas de `authorize`, `authorizeResource` e as Policies continuam como estão.
- **Isolamento:** os filtros e checagens por `clinic_id` ficam no mesmo lugar, com a mesma lógica. Só muda de onde vem o `clinicId`. A checagem "o recurso pertence à clínica" não é extraída nesta feature (ver Fora do Escopo).
- **Entre módulos:** não há contrato, DTO nem evento novo. A única dependência nova dos módulos é com `App\Http\Controllers`, que eles já usam hoje pelo `Controller`.
- **Fora da migração:** o `AuthController` do Clinic, que estende `BaseAuthController` e cuida de login, logout, refresh e me; o `PasswordResetController`; e o `Admin\ClinicController`, que usa `auth('clinic')->login(...)` na impersonação.
- **Teste de arquitetura:** varre os controllers dos 7 módulos de clínica e falha quando encontra acesso direto ao guard `clinic`, nas formas `Auth::guard('clinic')`, `auth('clinic')` e `auth()->guard('clinic')`. A lista de exceções é explícita e curta: o fluxo de autenticação e o `Admin\ClinicController`. Segue o estilo do `ModuleBoundaryTest`, lendo o conteúdo dos arquivos com regex.
- **ADR:** não precisa. Não há fronteira nova; o núcleo compartilhado `App\Http\Controllers` já é usado por todos os módulos.

## Fatias Verticais

Cada fatia é um conjunto de controllers migrados com os testes Feature verdes. Dá para demonstrar cada uma sozinha: os endpoints do módulo respondem igual para a própria clínica e escondem dado da outra.

1. **Controller base + módulo Clinic.** Cria o `ClinicAuthenticatedController` com teste unitário (usuário, `clinicId`, `clinicUserId` e 401 sem usuário). Migra Patient, ClinicUser, ClinicProfile, Dashboard e Exercise. Antes da migração, cria teste de outra clínica para os controllers do módulo que ainda não têm.
2. **ClinicFinance.** Primeiro a rede de segurança: testes Feature de outra clínica para Category, Transaction (show, update, destroy), Summary, Report e Export, passando no código atual. Depois migra os 5 controllers.
3. **ClinicScheduling + TreatmentProgram.** Migra Appointment, TreatmentPlan e ProgramDraft. Esses módulos já têm testes de outra clínica; o que faltar para `ProgramDraft` é criado antes.
4. **ClinicalRecord + ClinicQuestionnaire.** Rede de segurança de outra clínica para Assessment, Evolution, EvolutionTemplate e PatientFile (hoje só há 1 teste no módulo) e, se faltar, para QuestionnaireTemplate e PatientQuestionnaire. Depois migra os 6 controllers.
5. **GoogleCalendar.** Rede de segurança para connect, status, pull e disconnect: o usuário só vê e mexe na própria conexão. Depois migra as ações autenticadas. O callback público não muda.
6. **Trava de arquitetura.** Teste em `tests/Architecture` que proíbe o acesso direto ao guard `clinic` nos controllers dos 7 módulos, com a lista de exceções. Vem por último porque só passa quando todas as fatias anteriores estiverem migradas.

## Testes

- **Como rodar:**
  - `php artisan test --filter=ClinicAuthenticatedController`
  - `vendor/bin/phpunit modules/<Modulo>/tests` para cada módulo da fatia
  - `php artisan test tests/Architecture`
  - `bash bin/verificar.sh` antes de fechar cada fatia
  - `npm run test` não é necessário: o frontend não muda.
- **Padrões que já existem e serão copiados:**
  - Feature com `RefreshDatabase`, `ClinicUser::factory()->create()` e `actingAs($user, 'clinic')`, como em `modules/Clinic/tests/Feature/PatientControllerTest.php`.
  - O caso de outra clínica segue `test_destroy_returns404_for_patient_of_another_clinic` desse mesmo arquivo.
  - O teste de arquitetura segue `tests/Architecture/ModuleBoundaryTest.php`.
  - Banco de teste: SQLite em memória (`phpunit.xml`).
- **O que será testado:**
  - **Controller base (unitário):** devolve o usuário autenticado; `clinicId()` e `clinicUserId()` voltam como `int`; sem usuário, lança `AuthenticationException`.
  - **Rede de segurança (Feature, antes de migrar):** para cada endpoint que carrega recurso por id, um usuário de outra clínica recebe o mesmo status de hoje (404 ou 403) e não vê o dado. Para cada listagem, o dado de outra clínica não aparece.
  - **Regressão:** todos os testes Feature atuais dos 7 módulos continuam verdes depois da migração, incluindo os de papel sem permissão que já existem.
  - **Arquitetura:** o teste falha quando um controller de clínica usa o guard direto. O teste do próprio teste usa um arquivo de fixture, como em `tests/Architecture/fixtures`.

## Fora do Escopo

- Extrair a checagem "recurso pertence à clínica → 404" para um helper ou para Policies. Isso mexe em autorização e merece uma feature própria.
- Padronizar o formato dos 404, que hoje mistura `abort_if` com `response()->json([...], 404)` e varia as mensagens.
- Fazer o mesmo para os guards `admin` e `patient` (são 2 usos, no `ExerciseReviewController`).
- Tirar dos controllers as queries Eloquent diretas, como em `ClinicUserController` e `DashboardController`.
- Mexer no `AuthController`, no `PasswordResetController` ou na impersonação do `Admin\ClinicController`.
- Adicionar cast de `clinic_id` nos models.
- Qualquer mudança no frontend.

## Notas

- O risco principal é a comparação estrita de `clinic_id`. Com MySQL e SQLite no PHP 8.2+, o PDO já devolve inteiros, mas isso depende de driver e configuração. Por isso a decisão é converter explicitamente o lado do model, em vez de confiar no tipo que o driver devolve.
- `ClinicalRecord`, `ClinicFinance` e `GoogleCalendar` são os módulos com menos cobertura de outra clínica. É ali que a rede de segurança vale mais.
- O smoke test de cada fatia (Definição de Pronto) usa duas clínicas: uma lista e um detalhe com dado da própria clínica, e o mesmo id acessado pela outra clínica.
