# ADR: Desativar usuário da clínica corta a sessão, e excluir é soft delete

## Contexto

A lista de usuários v2 (feature `007-clinic-usuarios-ds`) trouxe Desativar e Excluir para o drawer de cada pessoa. A revisão adversária mostrou que as duas ações não faziam o que a tela prometia:

- **Desativar** (`status = 0`) só era conferido no login (`AuthController::canLogIn`). Quem já estava logado continuava usando a API com o token que tinha e renovava pelo refresh por até `refresh_ttl` (14 dias). O `Gate::before` liberava qualquer administrador, ativo ou não, então um admin desativado conseguia se reativar sozinho.
- **Excluir** apagava a linha de `clinic_users`. As FKs com `cascadeOnDelete` levavam junto a agenda (`clinic_appointments`) e os rascunhos de programa da pessoa, e a FK `restrictOnDelete` do financeiro (`created_by_user_id`) fazia o DELETE estourar 500.

O usuário quis que desativar deixe tudo como está e só tire o acesso, e que excluir tire a pessoa da equipe sem apagar o que ela fez.

## Decisão

### Desativar corta a sessão aberta

- O provider do guard `clinic` passa a ser `clinic_active_eloquent` (`Modules\Clinic\Auth\ActiveClinicUserProvider`, registrado no `ClinicServiceProvider` e ligado em `config/auth.php`). O `retrieveById` devolve `null` para usuário inativo, então o token emitido antes deixa de valer em toda rota `auth:clinic` de todos os módulos, inclusive `POST /api/clinic/auth/refresh`: a resposta é 401 e o SPA volta para o login.
- O login continua usando `retrieveByCredentials`, que acha o inativo, para responder "Seu acesso está desativado" (403) em vez de "credenciais inválidas".
- O `Gate::before` só libera administrador **ativo**.
- Desativar (passagem de ativo para inativo) também apaga as credenciais do Google da pessoa: o pull e o push do Google Agenda param para ela. Ao reativar, ela conecta o Google de novo.
- Quem emite token para `ClinicUser` escolhe usuário ativo: o "entrar como" do admin do sistema (`Admin\ClinicController::loginAs`) pega o administrador ativo da clínica, o mestre primeiro e em ordem fixa, e responde 422 se não houver nenhum.

### Excluir é soft delete

- `clinic_users` ganha `deleted_at` (migration no módulo `Clinic`), e `ClinicUser` usa `SoftDeletes`. O `ClinicUserService::delete` continua recusando o mestre e o último administrador ativo.
- A pessoa excluída some da equipe, da lista de profissionais e do login (as consultas padrão ignoram excluídos), e o token dela deixa de valer.
- Excluir também grava `status = 0` e apaga as credenciais do Google da pessoa. Assim um rollback da migration (que, no `down()`, também desativa os excluídos antes de tirar a coluna) não devolve o acesso, e a credencial de terceiro não fica guardada sem uso.
- Os seeders fazem o upsert de usuário com `withTrashed()` e restauram, para o seed voltar ao estado conhecido.
- No PDF do programa, o responsável excluído continua com o nome, mas o e-mail de contato passa a ser o da clínica.
- As relações de outros módulos que apontam para `ClinicUser` como registro histórico (agenda, programas e rascunhos, prontuário, avaliações, arquivos, questionários, financeiro, exercício enviado, paciente responsável, atividades da clínica) usam `->withTrashed()`: o nome de quem atendeu, criou ou assinou continua aparecendo.
- Nada é apagado em cascata e o DELETE não esbarra mais na FK do financeiro.
- Uma relação nova `belongsTo(ClinicUser)` sem `withTrashed()` quebra `tests/Architecture/ClinicUserHistoryRelationTest` (a exceção é `ExerciseFavorite`, pessoal).

## Consequências

- Benefícios:
  - "Desativar" e "Excluir" fazem o que a tela diz: a pessoa perde o acesso na hora e o histórico fica.
  - A regra vale para qualquer tela ou rota da clínica, sem depender de middleware em cada grupo de rotas.
- Custos:
  - Cada requisição autenticada já carregava o usuário; agora também confere o status (sem consulta a mais).
  - O e-mail de quem foi excluído continua ocupado no índice único de `clinic_users`: não dá para cadastrar a mesma pessoa de novo com o mesmo e-mail, nem restaurar pela tela. Está no `DEFERRED.md` da feature.
  - Relação nova que aponte para `ClinicUser` como histórico precisa do `withTrashed()` (o teste de arquitetura cobra).
  - O token não é revogado: o provider só recusa o usuário enquanto ele está inativo. Se a pessoa for reativada antes de o token expirar, o token antigo volta a valer. Está no `DEFERRED.md` da feature.
  - A consulta futura de quem foi excluído continua na agenda e pode ser remarcada trocando o profissional ou cancelada; remarcar mantendo o excluído dá 422 (o `UpdateAppointmentRequest` exige profissional ativo). Está no `DEFERRED.md` da raiz.
- Regras que agentes devem preservar:
  - Não voltar o provider `clinic_users` para `eloquent` puro, nem checar status só no login.
  - Não fazer hard delete de `ClinicUser`; não criar FK com `cascadeOnDelete` para `clinic_users` em tabela de histórico.
  - Relação de histórico para `ClinicUser` usa `->withTrashed()`; lista de "quem está na equipe" (profissionais, seletores) não.
  - Teste de sessão usa o token de verdade (`auth('clinic')->login($user)` + `withToken`), porque `actingAs` não passa pelo provider.

## Alternativas descartadas

- Middleware próprio em cada grupo `auth:clinic`: são vários módulos com rotas próprias, e uma rota esquecida reabriria a brecha.
- Lista de tokens revogados (blacklist do JWT) ao desativar: corta só os tokens conhecidos e precisa de armazenamento; o provider resolve sem estado.
- Recusar excluir quem tem histórico (422): deixaria o administrador sem como tirar da equipe alguém que já atendeu; desativar resolveria o acesso, mas a pessoa continuaria aparecendo como membro.
- Só trocar os textos dos modais: deixaria a sessão aberta e a perda de agenda como estavam.
