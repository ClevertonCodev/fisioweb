# `Gate::before` nega o admin em recurso de outra clínica

**Tipo:** Tarefa
**Plano:** `../plans/isolamento-clinicas-e-papeis.md`
**Issue:** ainda não criada

## Descrição

O `Gate::before` do módulo Clinic aprova qualquer habilidade para quem tem papel admin antes de a Policy rodar. Por isso nenhuma Policy protege o isolamento entre clínicas para o admin, e uma Policy nova nasce aberta se o controller esquecer a checagem.

A abordagem é estreitar o `Gate::before`: ele continua liberando o admin, mas nega quando algum argumento da habilidade é um model com `clinic_id` diferente do do usuário. É a segunda barreira; a primeira é a checagem no controller (tarefa 001).

## O que construir

- `Gate::before` (módulo Clinic, guard `clinic`):
  - argumento com `clinic_id` de outra clínica → nega;
  - argumento da mesma clínica → libera o admin como hoje;
  - habilidade sem model, como `create` ou `viewAny` com nome de classe → libera o admin como hoje;
  - usuário que não é admin → não muda nada, a decisão fica com a Policy.
- Sem migration e sem mudança no SPA.

## Critérios de Aceite

- [ ] Teste unitário: admin da A com `Gate::allows('update', <model da B>)` é negado. As Policies de `ClinicUser`, `Patient`, `TreatmentPlan`, `PatientEvolution` e `Assessment` são exercitadas com model de outra clínica.
- [ ] Teste unitário: admin da A com model da A é liberado, mesmo quando a Policy devolveria false (por exemplo, `delete` de evolução).
- [ ] Teste unitário: habilidade sem model (`create`, `viewAny` com nome de classe) continua liberada para admin.
- [ ] Fisio e secretária continuam decididos só pela Policy.
- [ ] As suítes de isolamento e de Policies existentes continuam verdes.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `001-checagem-de-clinica-e-usuarios` (Checagem de clínica no controller base e usuários de outra clínica com 404)

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis`
- **Exemplo no código:**
  - o registro do `Gate::before` no service provider do módulo Clinic;
  - `modules/Clinic/tests/Unit/Policies/PatientPolicyTest.php` (testes diretos de Policy).
- **Skills:** `security`, `php-testing`
- Comparar `clinic_id` como inteiro. Models sem atributo `clinic_id` (por exemplo, `Exercise` do catálogo com `clinic_id` nulo) não negam.

## Como testar na mão

Não há tela nova. Rode a suíte de Policies e de isolamento (`php artisan test --filter=Policy` e `--filter=Isolation`). Depois tente, como admin da A, uma ação protegida só por Policy em recurso da B, por exemplo `DELETE` de evolução da B: deve devolver 404 ou 403, nunca 200.
