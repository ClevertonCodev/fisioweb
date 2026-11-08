# Registro do "entrar como" do operador

**Tipo:** História
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 26, 27, 28
**Issue:** ainda não criada

## Descrição

Hoje o "entrar como" do operador não deixa marca no token nem registro (reforço da auditoria). A abordagem é gravar cada entrada numa tabela do Admin e mostrar as últimas na tela da clínica do painel admin. A clínica não vê nada (decisão).

## O que construir

- Migration no módulo Admin: `admin_login_as_audits`, com `admin_user_id`, `clinic_id`, `clinic_user_id`, `ip`, `user_agent` e `created_at`.
- O `login-as` grava uma linha a cada entrada bem-sucedida, e o token emitido ganha a claim `impersonated_by` com o id do operador.
- O módulo Clinic, que hoje tem o `login-as`, grava por um contrato público do Admin (ou o Admin escuta um evento), sem importar model do outro módulo.
- `GET /api/admin/clinics/{id}` ganha `recent_login_as`, com as 10 últimas entradas, as mais recentes primeiro: o nome do operador, o nome do usuário assumido e a data.
- A tela de editar clínica do admin mostra a lista "Últimos acessos do suporte".
- Nada aparece para a clínica.

## Critérios de Aceite

- [ ] Cada `login-as` bem-sucedido grava uma linha com o operador, a clínica, o usuário, o IP e a data
- [ ] O `login-as` recusado (clínica cancelada ou sem admin) não grava
- [ ] O token traz `impersonated_by`
- [ ] `recent_login_as` traz no máximo 10, os mais recentes primeiro, e só da clínica pedida
- [ ] A tela mostra a lista (teste Vitest)
- [ ] Nenhuma rota da clínica devolve esse registro
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `006-clinica-cancelada-sem-acesso` (mexe no mesmo `login-as`; fazer depois para não conflitar).

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `modules/Clinic/app/Http/Controllers/Admin/ClinicController.php` (`loginAs`); `resources/js/pages/admin/clinic/ClinicEditPage.tsx`
- **Skills:** `architecture-paradigm-modular-monolith`, `laravel-eloquent`, `php-testing`, `forms-shadcn`, `frontend-testing`

## Como testar na mão

1. Como operador, use o "entrar como" em uma clínica pela lista de clínicas.
2. Volte para `/admin/clinicas/{id}/editar`: a entrada aparece em "Últimos acessos do suporte", com o seu nome e a hora.
