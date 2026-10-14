# Teste de arquitetura que proíbe acesso direto ao guard clinic

**Tipo:** Tarefa
**Plano:** `../plans/clinic-base-controller.md`
**Issue:** ainda não criada

## Descrição

Depois que todos os controllers de clínica usam o controller base, nada impede que um controller novo volte a ler `Auth::guard('clinic')` direto. Esta tarefa cria um teste de arquitetura que falha nesse caso, com uma lista curta e explícita de exceções legítimas.

Cobre as histórias 14 e 15 do plano.

## O que construir

- **Teste em `tests/Architecture`** que varre os controllers de produção dos módulos `Clinic`, `ClinicFinance`, `ClinicScheduling`, `ClinicalRecord`, `ClinicQuestionnaire`, `TreatmentProgram` e `GoogleCalendar`. Ele falha quando encontra acesso direto ao guard `clinic` em qualquer destas formas:
  - `Auth::guard('clinic')`
  - `auth('clinic')`
  - `auth()->guard('clinic')`

  Aspas simples e duplas contam igual.
- **Exceções, listadas pelo nome no próprio teste:**
  - o fluxo de autenticação do Clinic (`AuthController` e `PasswordResetController`, que estendem os controllers base de autenticação);
  - o controller de clínicas do painel admin, que usa o guard `clinic` para a impersonação.
- **Mensagem de falha:** lista o arquivo e a linha de cada violação e diz para estender o controller base e usar `clinicUser()`, `clinicId()` ou `clinicUserId()`.
- **Teste do próprio teste:** um arquivo de fixture com uma violação prova que a varredura detecta o padrão, seguindo `tests/Architecture/fixtures`.
- Não tem migration, rota, fila nem frontend.

## Critérios de Aceite

- [x] O teste passa com o código depois das tarefas 001 a 007.
- [x] Ao colocar `Auth::guard('clinic')->user()` em qualquer controller de um dos 7 módulos, o teste falha e aponta o arquivo e a linha.
- [x] As exceções ficam numa lista explícita e curta no teste, cada uma com o motivo.
  - **Nota de implementação:** a lista ficou só com o `Admin\ClinicController` (impersonação). O `AuthController` e o `PasswordResetController` do Clinic não acessam o guard pelos padrões proibidos (usam `guardName()` do controller base de autenticação), então listá-los criaria exceções obsoletas — e o teste `test_allowed_exceptions_still_exist` falha justamente nesse caso. A detecção também cobre `->user('clinic')`.
- [x] O teste da fixture prova que as três formas de acesso ao guard são detectadas.
- [x] `php artisan test tests/Architecture` passa por inteiro.
- [x] Um usuário de outra clínica não vê nem altera nada: não se aplica diretamente, porque esta tarefa não muda comportamento. O critério é cumprido pelos testes Feature das tarefas 001 a 007, que continuam verdes.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `001-controller-base-e-modulo-clinic` (Criar ClinicAuthenticatedController e migrar Patient, ClinicProfile e Exercise)
- `002-clinic-user-e-dashboard` (Rede de segurança e migração de ClinicUser e Dashboard)
- `003-clinic-finance` (Rede de segurança e migração de ClinicFinance)
- `004-clinic-scheduling-e-treatment-program` (Migrar ClinicScheduling e TreatmentProgram)
- `005-clinical-record` (Rede de segurança e migração de ClinicalRecord)
- `006-clinic-questionnaire` (Rede de segurança e migração de ClinicQuestionnaire)
- `007-google-calendar` (Rede de segurança e migração de GoogleCalendar)

## Notas de Implementação

- **Branch:** `feat/clinic-base-controller-architecture-test`
- **Exemplo no código:** `tests/Architecture/ModuleBoundaryTest.php`, com varredura de arquivos de produção e regex sobre o conteúdo, e `tests/Architecture/ClinicScopedModuleNamingTest.php`.
- **Skills:** `architecture-paradigm-modular-monolith`, `php-testing`.
- **Smoke test:** como não há comportamento visível, a evidência é a saída do teste passando e a saída dele falhando com uma violação temporária (que não entra no commit).

## Como testar na mão

1. Rodar `php artisan test tests/Architecture`: verde.
2. Adicionar temporariamente `Auth::guard('clinic')->user();` num método do `FinancialSummaryController` e rodar de novo: o teste falha e aponta esse arquivo e essa linha.
3. Desfazer a mudança temporária e confirmar que o teste volta a passar.
