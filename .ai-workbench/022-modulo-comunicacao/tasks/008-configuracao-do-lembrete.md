# Configuração do lembrete: chave da clínica e do paciente

**Tipo:** História
**Plano:** `../plans/modulo-comunicacao.md`
**Histórias:** 28, 31, 33
**Issue:** ainda não criada

## Descrição

O lembrete automático de consulta (tarefa 009) precisa de duas chaves:

- uma da clínica, que liga o lembrete (desligada por padrão);
- uma do paciente, que diz se ele recebe (ligada por padrão).

Esta tarefa cria as duas, com as telas para mudar, e corrige a dica do celular no cadastro do paciente, que promete lembretes que ninguém manda.

## O que construir

- **Clínica (módulo `Clinic`):**
  - Migration em `clinics` com o booleano do lembrete por e-mail, desligado por padrão.
  - O `GET` e o `PUT /api/clinic/profile` devolvem e aceitam o campo, e a regra de quem edita continua a de hoje (admin mestre).
  - Em Dados da clínica (`/clinica/dados`), uma chave "Lembrar o paciente por e-mail antes da consulta (24 h)", desabilitada para quem não é mestre, como os outros campos.
- **Paciente (módulo `Patient`):**
  - Migration em `patients` com o booleano "recebe lembrete de consulta por e-mail", ligado por padrão.
  - Cadastro e edição aceitam e devolvem o campo, opcional.
  - No formulário do paciente, na parte de contato, uma chave "Receber lembrete de consulta por e-mail".
  - A dica do celular troca "Recebe os lembretes da clínica" por "Usado para enviar programas e avisos pelo WhatsApp".
- **Contratos públicos de contato** (criados na 002, se já existirem): passam a devolver o campo da clínica e o do paciente, para a tarefa 009 ler. Se a 002 ainda não estiver pronta, os campos entram quando os contratos forem criados.
- **Dado antigo:** os padrões cobrem as clínicas e os pacientes que já existem; não há conversão.
- **Isolamento:** o `clinic_id` vem do usuário autenticado, como nos endpoints de hoje.

## Critérios de Aceite

- [x] Depois da migration, as clínicas existentes ficam com o lembrete desligado e os pacientes existentes com o lembrete ligado (teste).
- [x] O mestre liga e desliga o lembrete pelo `PUT /api/clinic/profile`; um admin que não é mestre recebe o mesmo bloqueio de hoje (teste).
- [x] Cadastrar e editar paciente gravam e devolvem o campo do lembrete; sem o campo, o padrão é ligado (teste).
- [x] Editar paciente de outra clínica continua dando 404 (teste).
- [x] Em Dados da clínica, a chave aparece e fica desabilitada para quem não é mestre (Vitest).
- [x] No formulário do paciente, a chave aparece, e a dica do celular tem o texto novo (Vitest).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já. Se a tarefa 002 já estiver pronta, inclua os campos nos contratos de contato.

## Notas de Implementação

- **Branch:** `feat/modulo-comunicacao`
- **Exemplo no código:**
  - `ClinicProfileController` e `UpdateClinicProfileRequest` (regra do mestre).
  - Os booleanos `use_apelido` e `is_foreign` do paciente (migration, casts, `DsSwitch` no formulário).
  - `application/clinic/patient-form.ts`.
- **Skills:** `laravel-eloquent`, `php-testing`, `frontend-ddd`, `design-system`, `forms-shadcn` (RHF + Zod), `frontend-testing`.

## Como testar na mão

1. Como admin mestre da clínica A, abra `/clinica/dados`, ligue "Lembrar o paciente por e-mail antes da consulta" e salve. Recarregue: continua ligada.
2. Como admin que não é mestre, a chave aparece desabilitada.
3. Abra o cadastro de um paciente: a chave "Receber lembrete de consulta por e-mail" vem ligada. Desligue, salve e reabra.
4. Confira a dica nova do celular.
