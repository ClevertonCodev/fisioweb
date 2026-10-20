# Preferências do usuário: visão e fim de semana salvos na conta

**Tipo:** História
**Plano:** `../plans/agenda-v2.md`
**Issue:** ainda não criada

## Descrição

Toda vez que o usuário volta para a agenda, ela abre em "Semana" com fim de
semana, mesmo que ele sempre escolha outra coisa. Esta fatia cria uma tabela
genérica de preferências do usuário da clínica (chave-valor, com chaves
registradas no backend), que outras telas v2 vão usar depois, e faz a agenda
lembrar a visão e o fim de semana em qualquer aparelho.

## O que construir

- **Módulo dono:** Clinic. Migration nova `clinic_user_preferences`
  (`clinic_id`, `clinic_user_id`, `key`, `value` json, única por usuário +
  chave). Não há dado antigo.
- **Registro de chaves:** um enum no backend, em que cada caso valida o
  próprio valor. Nesta fatia são duas chaves: `agenda.view` (listWeek,
  timeGridDay, timeGridThreeDay, timeGridWeek, dayGridMonth) e
  `agenda.show_weekends` (booleano).
- **Endpoints** no guard `clinic`, com envelope `data`:
  - `GET /api/clinic/me/preferences?keys=agenda.view,agenda.show_weekends`
    devolve um objeto chave → valor só com as chaves que têm valor salvo;
  - `PUT /api/clinic/me/preferences/{key}` com `{ value }` faz upsert e
    devolve `{ key, value }`;
  - chave fora da lista ou valor inválido dá 422.
- **Permissão e isolamento:** sem Policy, porque o dono é sempre o usuário
  autenticado. `clinic_user_id` e `clinic_id` vêm do token, nunca da
  requisição, e não existe rota que receba o id de outro usuário. Os três
  papéis podem usar.
- **ADR:** "Preferências do usuário da clínica: chave-valor com chaves
  registradas". Cria a pasta `docs/adr/`.
- **Front:** entidade `AgendaPreferences` no `domain`, port + hooks React Query
  (ler e salvar) e repositório com mapper. A agenda abre na visão e no fim de
  semana salvos e grava ao trocar. Se não há valor salvo, usa o padrão (Semana,
  com fim de semana). Se gravar falhar, a tela continua na escolha nova, sem
  travar.

## Critérios de Aceite

- [ ] Escolher "Dia" e esconder o fim de semana, sair e voltar (ou abrir em
      outro navegador): a agenda abre em "Dia", sem fim de semana.
- [ ] Teste: o usuário grava `agenda.view` e lê de volta. Um segundo `PUT`
      atualiza, sem criar outra linha.
- [ ] Teste: uma chave fora da lista dá 422 no `GET` e no `PUT`. Um valor
      inválido de `agenda.view` e um valor não booleano de
      `agenda.show_weekends` dão 422.
- [ ] Teste: o usuário A não vê a preferência do usuário B da mesma clínica.
- [ ] Teste: um usuário da clínica B não vê nem altera as preferências dos
      usuários da clínica A.
- [ ] Teste: sem token, 401.
- [ ] O ADR está em `docs/adr/`.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-tela-da-agenda-v2` (Tela da agenda v2 em produção).

## Notas de Implementação

- **Branch:** `feat/clinic-agenda-ds`
- **Exemplo no código:** as rotas `profile` do módulo Clinic (recurso do
  próprio usuário, sem id na URL) e `AppointmentIndexVisibilityTest` para o
  formato dos testes de feature.
- **Skills:** `backend-clean-code`, `php-modern` (enum com validação),
  `laravel-eloquent`, `php-testing`, `architecture-paradigm-modular-monolith`
  (ADR), `api-client`, `frontend-ddd`.

## Como testar na mão

1. `fisio-app migrate`.
2. Fazer login como fisioterapeuta da clínica A
   (`POST /api/clinic/auth/login`). Chamar o `PUT` de `agenda.view` com
   `timeGridDay` e o `GET`.
3. Repetir com `agenda.view` = `xyz` e com a chave `foo.bar`: 422.
4. Com um usuário da clínica B, chamar o `GET`: não vem o valor do usuário da
   A.
5. No navegador, escolher "Dia", recarregar e abrir numa janela anônima com o
   mesmo usuário.
