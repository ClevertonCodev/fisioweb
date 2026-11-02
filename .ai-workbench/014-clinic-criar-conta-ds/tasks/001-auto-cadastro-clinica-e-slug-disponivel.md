# Auto-cadastro da clínica e consulta de disponibilidade de endereço

**Tipo:** História
**Plano:** `../plans/clinic-criar-conta-ds.md`
**Histórias:** 1, 2, 3, 4, 12
**Issue:** ainda não criada

## Descrição

Hoje não existe endpoint público para uma clínica criar a própria conta nem para consultar se o endereço dos links (`slug`) está livre. Além disso, o `ClinicObserver` cria o usuário mestre com senha igual ao CPF/CNPJ da clínica, o que sobrescreveria ou ignoraria a senha escolhida pela pessoa no cadastro.

Esta tarefa implementa no módulo `Clinic` a consulta pública de disponibilidade de endereço (`GET /api/clinic/auth/slug-availability`) e o auto-cadastro (`POST /api/clinic/auth/register`), criando a clínica ativa no plano `Premium` (consultado por contrato público do módulo `Admin`) e o usuário mestre com a senha escolhida, `email_verified_at = null` e envio do link de confirmação na fila após o commit.

## O que construir

No módulo `Admin`, expor um contrato público de leitura de planos para localizar o identificador do plano `Premium` pelo nome sem acoplar `Clinic` ao model interno de `Admin`. No módulo `Clinic`, extrair as regras compartilhadas de validação de documento e endereço (`slug`) entre o cadastro administrativo e o auto-cadastro, incluindo a lista de endereços reservados do sistema e da marca. Criar os endpoints públicos com rate limit próprio (`clinic-slug-check` e `clinic-register`): a consulta de slug devolve se está disponível ou o motivo (`taken`, `reserved`, `invalid`), e o auto-cadastro cria em transação a clínica e o usuário mestre com a senha informada (sem disparar criação duplicada no `ClinicObserver` nem usar o documento como senha), enfileirando o envio do e-mail de confirmação com `afterCommit` e respondendo `201` sem emitir token JWT.

## Critérios de Aceite

- [x] `GET /api/clinic/auth/slug-availability?slug=` responde `200` com `{ data: { available, reason } }` distinguindo endereço disponível (`null`), já usado por clínica ativa ou excluída (`taken`), reservado (`reserved`) e fora do formato (`invalid`).
- [x] `POST /api/clinic/auth/register` cria 1 clínica ativa (`status = 1`) vinculada ao plano `Premium` (quando existente) e 1 usuário mestre (`role = admin`, `mestre = 1`, `email_verified_at = null`), com `Hash::check` verdadeiro para a senha escolhida e falso para o CPF/CNPJ, respondendo `201` sem token e despachando o job de confirmação de e-mail na fila (`afterCommit`).
- [x] `POST /api/clinic/auth/register` responde `422` para e-mail já usado em `clinics` ou `clinic_users` (inclusive com soft delete), documento repetido, CPF/CNPJ inválido para o `type_person`, slug repetido, reservado ou fora do padrão, senha com menos de 8 caracteres ou confirmação divergente.
- [x] O rate limit bloqueia excesso de tentativas com `429`.
- [x] Uma clínica não consegue cadastrar e-mail, documento ou slug pertencente a outra clínica existente.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/clinic-criar-conta-ds`
- **Exemplo no código:** `modules/Clinic/app/Http/Requests/Admin/CreateClinicRequest.php`, `modules/Clinic/app/Observers/ClinicObserver.php`, `modules/Admin/app/Services/AssessmentTemplateReadService.php`
- **Skills:** `backend-clean-code`, `architecture-paradigm-modular-monolith`, `php-modern`, `laravel-queues`, `security`, `php-testing`

## Como testar na mão

1. Com o servidor local rodando, chamar `GET /api/clinic/auth/slug-availability?slug=admin` e conferir `{ "data": { "available": false, "reason": "reserved" } }`.
2. Chamar `GET /api/clinic/auth/slug-availability?slug=clinica-cleverton` (clínica do seeder) e conferir `reason: "taken"`.
3. Chamar `POST /api/clinic/auth/register` com dados válidos de uma nova clínica e conferir status `201`, ausência de `access_token` e registro do link de confirmação no log de e-mail.
