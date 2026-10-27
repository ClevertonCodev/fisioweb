# Edição no mesmo layout, sem regressão

**Tipo:** História
**Plano:** `../plans/clinic-user-form-ds.md`
**Issue:** ainda não criada

## Descrição

A fatia 001 põe o cadastro no Crachá ao vivo compartilhando o layout da
edição. Depois dessa extração, a edição tem que continuar exatamente como
foi aprovada: dados reais, barra “Nada alterado”, senha opcional, modal de
código na troca, trava do ADR 019 e Google Agenda só no próprio perfil.
Esta fatia é a conferência e os testes desse modo, não uma tela nova.

## O que construir

- **Tela:** a rota de edição de usuário da clínica, ainda no protótipo A
  em desenvolvimento (`?variant=O` = v1). Nenhum endpoint novo.
- **Modo editar** no layout compartilhado: carrega o usuário da API da
  própria clínica; título “Editar usuário” ou “Meu perfil”; voltar para a
  lista (admin) ou para o painel (os outros); CTA “Salvar” desabilitado
  enquanto não houver alteração.
- **Senha:** em branco = manter a atual. Com senha nova, o modal de código
  visual (nenhum e-mail sai) continua; o código vai para quem está
  logado. A tabela do ADR 019 permanece no protótipo: própria senha
  liberada; senha de outra pessoa só administrador; de outro
  administrador só o mestre; do mestre só ele mesmo. Quem não pode vê o
  motivo no lugar do campo. A tabela **não** vai para `permissions` nem
  para o backend nesta fatia.
- **Prévia com nome vazio:** decisão do usuário (2026-10-20): os
  placeholders do cadastro valem também na edição. Apagar o nome mostra
  “Nome do profissional” e o avatar genérico, no lugar de “Sem nome”,
  “—” e “?”.
- **Sessão sem e-mail:** sem o e-mail de quem está logado, a troca da
  senha de outra pessoa trava (“Sua sessão não tem e-mail para receber o
  código da troca.”), porque o código nunca vai ao alvo (ADR 019). No
  próprio perfil o alvo é quem está logado, então segue liberada.
- **Mestre:** função travada em administrador; a conta não se desativa
  pelo switch.
- **Google Agenda:** só no modo editar. No próprio perfil, status real e
  botões stub. Em outra pessoa, o texto de que só ela conecta.
- **Permissão:** administrador edita qualquer um da clínica;
  fisioterapeuta e secretário(a) só o próprio perfil (já é a rota). O
  protótipo só lê o hook existente e não inventa dado.
- **Isolamento (falha conhecida, fora desta fatia):** o GET e o PUT de
  usuário **não** são isolados por clínica hoje: `ClinicUserController`
  (`show`, `update`) não confere `clinic_id` e o `Gate::before` libera
  todo administrador, então o admin da clínica A abre (e conseguiria
  salvar) um usuário da B. A correção é do backend, em `.ai-workbench/002-isolamento-clinicas-e-papeis/tasks/001-checagem-de-clinica-e-usuarios.md`. A
  edição não pode virar tela de produção antes dela.

## Critérios de Aceite

- [x] Em desenvolvimento, `/clinica/usuarios/:id/editar` continua no Crachá ao vivo com os dados reais do usuário (variante A; `?variant=O` = v1).
- [x] Sem alteração, a barra diz “Nada alterado” e Salvar fica desabilitado; mudar nome ou foto habilita.
- [x] Senha vazia não entra nas alterações e não abre o modal de código; senha preenchida (quem pode) abre o passo de código e o toast de stub, sem PUT (teste).
- [x] `passwordLockReason` bate com a tabela do ADR 019: própria senha liberada; não-admin não troca a de outra pessoa; outro admin só o mestre; mestre só ele mesmo (teste da função pura).
- [x] No próprio perfil aparece Google Agenda com o status real; na edição de outra pessoa, o texto de que só ela conecta (teste).
- [x] Função e situação só para quem gerencia usuários; no mestre a função permanece administrador.
- [x] Fisioterapeuta abre só o próprio perfil; tentar o id de um colega continua redirecionando (rota já existente).
- [x] Na edição de um id de outra clínica, o protótipo só mostra o que o GET devolve: não inventa dado nem id (smoke). O 404 para outra clínica é do backend e ficou em “Depende de”.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `001-novo-usuario-crachá` (o layout compartilhado com modo create | edit).
- Para a edição ir a produção (não para fechar esta fatia): `.ai-workbench/002-isolamento-clinicas-e-papeis/tasks/001-checagem-de-clinica-e-usuarios.md`, que faz o GET e o PUT de usuário de outra clínica darem 404 (hoje dão 200, ver “Isolamento”).

## Notas de Implementação

- **Branch:** `feat/user-editar-cadastro`
- **Exemplo no código:** `passwordLockReason` e o modal de código do protótipo da edição; `permissions.test.ts` para o estilo do teste da tabela de senha.
- **Skills:** `design-system`, `frontend-testing`, `frontend-react`
- Não implementar o ADR 019 de verdade (endpoint, fila, Policy). Se o compartilhamento da fatia 001 tiver quebrado o modo editar, o conserto é desta fatia.
- Testes do modo `edit` no hook/protótipo direto (o interruptor desliga em `MODE=test`).

## Como testar na mão

1. Como admin da Clínica Cleverton, abrir a edição de um fisioterapeuta: dados reais, Google com o texto de “só a própria pessoa”.
2. Mudar o nome: a prévia muda e Salvar habilita. Salvar sem senha: stub, sem código.
3. Preencher senha nova: modal de código; o toast do protótipo mostra o código; confirmar: stub, a senha real não muda.
4. Abrir a edição de outro administrador (não sendo mestre): o campo de senha dá lugar ao motivo da trava.
5. Como mestre, abrir outro administrador: a senha pode ser trocada (modal de código).
6. Como fisioterapeuta, abrir o próprio perfil (“Meu perfil”); tentar o id de um colega: volta para o próprio.
7. Como admin da Clínica Start, abrir o id de um usuário da Cleverton: hoje a tela mostra o que o GET devolve (200, falha conhecida do backend, ver “Isolamento”); conferir que o protótipo não inventa dado nem id. O “não encontrado” vem com a tarefa de “Depende de”.
8. Conferir celular e tema escuro.
