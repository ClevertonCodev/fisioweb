# Bloco "Acesso do mestre" na tela da clínica do admin, com smoke de ponta a ponta

**Tipo:** História
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 7, 8, 9, 10
**Issue:** ainda não criada

## Descrição

O operador precisa de um jeito de gerar e copiar o link de primeiro acesso sem chamar a API na mão, e de saber se o mestre já definiu a senha. Esta tarefa leva o endpoint da 003 para a tela de editar clínica do painel admin (v1, shadcn) e fecha com o smoke de ponta a ponta que o usuário pediu.

## O que construir

- A tela de editar clínica do admin ganha o bloco "Acesso do mestre":
  - o estado: "Senha definida" ou "Aguardando o primeiro acesso", com a data do último link gerado;
  - o botão "Gerar link de primeiro acesso", ou "Gerar link de nova senha" quando a senha já foi definida;
  - o link aparece uma vez só, com o botão de copiar e o aviso de que gerar outro invalida o anterior.
- O SPA ganha o método no repository e na port do admin e um hook de mutation (camadas `infrastructure` → `application` → página).
- Smoke de ponta a ponta (skill `qa-navegador`): o operador cria a clínica, gera o link, o mestre abre o link, define a senha e cai em `/clinica`; o login com o CNPJ dá erro. A evidência vai em `evidence/004-.../`.

## Critérios de Aceite

- [ ] O bloco mostra o estado certo para o mestre com e sem senha (teste Vitest)
- [ ] Gerar mostra o link, e o botão de copiar copia (teste Vitest com o clipboard mockado)
- [ ] O texto do botão muda para "Gerar link de nova senha" quando `master_password_defined` é verdadeiro
- [ ] Smoke de ponta a ponta com evidência e `SUMMARY.md`
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `003-mestre-sem-senha-e-primeiro-acesso` (Mestre nasce sem senha e define a senha pelo link de primeiro acesso).

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `resources/js/pages/admin/clinic/ClinicEditPage.tsx`; o `useLoginAsClinic` em `resources/js/application/admin/use-clinics.ts`
- **Skills:** `forms-shadcn`, `frontend-ui-patterns`, `frontend-ddd`, `frontend-testing`, `qa-navegador`

## Como testar na mão

1. Como operador, abra `/admin/clinicas/{id}/editar` de uma clínica nova.
2. Veja "Aguardando o primeiro acesso" e gere o link. Copie o link e abra-o numa aba anônima.
3. Defina a senha e volte à tela do admin: o estado mudou para "Senha definida", e o botão virou "Gerar link de nova senha".
