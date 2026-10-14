# Rede de segurança e migração de ClinicalRecord

**Tipo:** Tarefa
**Plano:** `../plans/clinic-base-controller.md`
**Issue:** ainda não criada

## Descrição

O módulo `ClinicalRecord` guarda o prontuário: avaliações, evoluções, modelos de evolução e arquivos do paciente. É dado de saúde (LGPD). Só o PatientFileController tem teste de outra clínica. Assessment, Evolution e EvolutionTemplate não têm nenhum teste Feature próprio. Antes de migrar, escrevemos os testes de outra clínica contra o código atual. Depois os quatro controllers passam a usar o controller base.

Cobre as histórias 10, 16, 17 e 18 do plano.

## O que construir

- **Rede de segurança (antes da migração, passando no código atual).** Um usuário da clínica B:
  - **Avaliações:**
    - `GET` e `POST /api/clinic/patients/{patient}/assessments` com paciente de A devolvem 404 "Paciente não encontrado." e não criam nada;
    - `GET`, `PUT`, `DELETE` e `POST .../sign` em `/api/clinic/assessments/{id}` com avaliação de A devolvem o status de hoje e não alteram nada.
  - **Evoluções:**
    - `GET` e `POST /api/clinic/patients/{patient}/evolutions` com paciente de A devolvem 404 e não criam nada;
    - em `/api/clinic/evolutions/{id}`, `GET`, `PUT`, `DELETE`, `POST .../sign`, `POST .../generate-text` e `GET .../pdf` com evolução de A devolvem o status de hoje e não alteram nem geram nada.
  - **Modelos de evolução:**
    - `GET /api/clinic/evolution-templates` de B não lista modelo próprio de A, mas lista os modelos de sistema;
    - `GET` de modelo próprio de A dá 404, enquanto `GET` de modelo de sistema funciona;
    - `PUT` e `DELETE` de modelo de A devolvem o status de hoje.
  - **Arquivos do paciente:** os testes que já existem continuam valendo como rede.
- **Migração:** Assessment, Evolution, EvolutionTemplate e PatientFile passam a estender o controller base e trocam todo acesso ao guard pelos métodos novos. A autoria (`clinic_user_id`) vem de `clinicUserId()`.
- A checagem de dono continua igual: buscar o paciente pelo `PatientServiceInterface`, comparar `clinic_id` e devolver 404. A comparação converte o lado do model para `int`.
- Guard `clinic`. Permissões pelas Policies atuais, que não mudam. Não tem migration nem frontend. A geração de texto e o PDF da evolução não mudam.

## Critérios de Aceite

- [ ] Os testes novos de outra clínica para avaliações, evoluções (incluindo assinatura, geração de texto e PDF) e modelos de evolução existem e passam **antes** da migração. O commit de teste vem antes do commit de refatoração.
- [ ] Nenhum `Auth::guard('clinic')` ou `auth('clinic')` sobra nos controllers de `ClinicalRecord`.
- [ ] Os testes atuais continuam verdes sem alteração: `PatientFileControllerTest`, `ClinicalRecordRouteCompatibilityTest` e o `ModuleBoundaryTest` de `ClinicalRecord`.
- [ ] Um usuário de outra clínica não vê, não altera, não assina e não gera PDF de nenhum registro clínico desta clínica.
- [ ] Os modelos de evolução de sistema continuam visíveis para todas as clínicas.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `001-controller-base-e-modulo-clinic` (Criar ClinicAuthenticatedController e migrar Patient, ClinicProfile e Exercise)

## Notas de Implementação

- **Branch:** `feat/clinic-base-controller-clinical-record`
- **Exemplo no código:** `modules/ClinicalRecord/tests/Feature/PatientFileControllerTest.php`, com o padrão de paciente de outra clínica neste módulo.
- **Skills:** `php-testing`, `security`, `architecture-paradigm-modular-monolith`.
- **Atenção:**
  - `generate-text` pode chamar integração externa. Use fake ou mock no teste, como já fazem outros testes do módulo, e confira que nenhuma chamada sai para registro de outra clínica.
  - A evidência do smoke test pode conter dado de paciente e não entra no git.

## Como testar na mão

1. Na clínica A, criar um paciente com uma avaliação, uma evolução assinada, um modelo de evolução próprio e um arquivo.
2. Como `physiotherapist` de A, abrir o prontuário do paciente: tudo aparece como antes.
3. Como usuário de B:
   - `GET /api/clinic/patients/{id do paciente de A}/assessments`: 404;
   - `GET /api/clinic/evolutions/{id da evolução de A}/pdf`: mesmo status de antes da mudança;
   - `GET /api/clinic/evolution-templates`: o modelo próprio de A não aparece, mas os de sistema aparecem.
