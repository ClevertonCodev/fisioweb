# Correções da auditoria de controle de acesso

Data: 2026-11-08
Fonte:
- `decisoes.md` da feature, sessão de 2026-11-08 (skill `refinar`);
- a auditoria `security-audit-skill/fisioweb/run-1`, nos arquivos `REPORT.md` e `FINDINGS-DETAIL.md`, feita no commit `114c0d6`.

Este plano substitui o de 2026-10-15, que está arquivado em `tasks/arquivo-2026-10-15/`.

## Problema

Uma auditoria de controle de acesso confirmou 12 falhas e deixou 1 ponto para validar. O isolamento entre clínicas está sólido na agenda, nas finanças, no prontuário e nos planos. O risco grave está na borda da autenticação, com mais alguns caminhos paralelos que esqueceram o filtro.

- **Qualquer pessoa na internet** abre `/log-viewer` em produção, lê e apaga os logs. Com o e-mail indo para o log, ela também pede "esqueci minha senha" para a conta de outro, lê o link no log e toma a conta de qualquer usuário de clínica ou do painel admin.
- **O mestre da clínica criada pelo operador nasce com a senha igual ao CNPJ/CPF.** Quem sabe o e-mail e o CNPJ da clínica, que costumam ser públicos, entra como dono dela.
- **A clínica dona de um exercício aprovado** troca a thumbnail e as imagens de referência sem nova revisão, e as outras clínicas e os PDFs dos pacientes delas passam a mostrar as imagens novas.
- **Uma clínica favorita um exercício pendente ou rejeitado de outra** e lê nome, descrição, vídeo e quem enviou.
- **Um usuário de uma clínica grava o e-mail de outra pessoa com outras maiúsculas.** O login e o "esqueci minha senha" da vítima passam a cair na conta dele, e a vítima fica sem acesso.
- **O gerador de texto da evolução** devolve o texto dos modelos de evolução privados de outra clínica.
- **O "conectar Google Agenda"** aceita o link gerado por outra pessoa. O atacante manda o link dele à vítima, e a agenda Google dela passa a cair na clínica dele.
- **Trocar a senha não derruba as sessões abertas**: quem roubou um token continua entrando.
- **A resposta de um questionário** aceita pergunta de outra clínica.
- **A sincronização do Google de um fisio** altera ou cancela consultas de outro fisio da mesma clínica.
- **O paciente desativado** continua usando e renovando o token.
- **Os arquivos do prontuário** (laudos e exames) ficam num endereço público e fixo, que continua abrindo sem login mesmo depois de o arquivo ser apagado.

A auditoria também apontou reforços:

- um admin comum troca o e-mail e a senha do mestre e entra como ele;
- a clínica cancelada continua logando e se reativa sozinha;
- o login do painel admin não tem limite de tentativas;
- o "entrar como" do operador não deixa rastro.

## Solução

- O `/log-viewer` passa a pedir usuário e senha (basic auth no nginx). Sem isso, a resposta é 403. Essa parte sai antes, numa PR própria.
- A clínica criada pelo operador nasce com o mestre **sem senha**. O operador gera um **link de primeiro acesso** de uso único, copia e manda à clínica. O mestre abre o link, cria a própria senha e entra.
- Só o próprio mestre troca o e-mail e a senha do mestre.
- Toda troca de senha derruba as outras sessões daquela pessoa.
- A clínica cancelada não entra e não se reativa sozinha.
- O painel admin limita as tentativas de login e de "esqueci minha senha".
- Cada "entrar como" fica registrado, e o operador vê os últimos na tela da clínica.
- Trocar a mídia de um exercício já aprovado vira uma **proposta**. As outras clínicas continuam vendo a mídia aprovada até o operador aprovar a troca.
- Favoritos, gerador de texto, questionário e sincronização do Google passam a respeitar o mesmo filtro que o resto do sistema já usa.
- O e-mail do usuário da clínica é único sem diferenciar maiúsculas.
- Conectar o Google exige que a mesma pessoa logada conclua a ligação.
- O paciente desativado perde o acesso na hora.
- O arquivo do prontuário abre por um link que vale 5 minutos, pedido por quem está logado na clínica, e some do armazenamento quando é apagado.

## Histórias de Usuário

### Log-viewer

1. Como dono do produto, quero que `/log-viewer` em produção peça usuário e senha antes de mostrar qualquer coisa, para que ninguém de fora leia ou apague os logs.
2. Como dono do produto, quero que um pedido ao log-viewer que não passou pelo basic auth do nginx receba 403 da aplicação, para que a proteção não dependa só do nginx.
3. Como dono do produto, quero que o log-viewer continue livre em desenvolvimento, para depurar sem fricção.
4. Como operador, quero que um servidor novo já nasça com o basic auth do log-viewer e com `LOG_LEVEL=info`, para não depender de lembrar de configurar.
5. Como operador, quero o passo a passo para pôr o basic auth no servidor que já existe, porque o provision só roda na criação.

### Mestre e link de primeiro acesso

6. Como operador, quero criar uma clínica sem que o mestre ganhe uma senha previsível, para que ninguém entre só sabendo o e-mail e o CNPJ.
7. Como operador, quero gerar na tela da clínica um link de primeiro acesso para o mestre, para entregar o acesso pelo WhatsApp sem precisar de e-mail.
8. Como operador, quero copiar o link com um clique.
9. Como operador, quero que gerar um link novo invalide o anterior, para cortar um link que mandei para a pessoa errada.
10. Como operador, quero ver na tela da clínica se o mestre já definiu a senha. Se ele já definiu, quero gerar um "link de nova senha" para ele recuperar o acesso, porque o "esqueci minha senha" não chega sem e-mail.
11. Como mestre, quero abrir o link, criar a minha senha e já entrar no sistema.
12. Como mestre, quero que o link não funcione de novo depois que eu definir a senha.
13. Como mestre, quero uma mensagem clara quando o link for inválido ou já tiver sido usado, com a orientação de pedir um novo ao suporte.
14. Como dono do produto, quero que o login do mestre sem senha definida dê 401 com qualquer senha, inclusive com o documento.
15. Como clínica que se cadastrou sozinha, quero que nada mude no meu cadastro, que já cria a senha que eu escolhi.

### Conta do mestre, sessões e clínica cancelada

16. Como mestre, quero que nenhum outro administrador da minha clínica consiga trocar o meu e-mail ou a minha senha, para não perder a conta dona da clínica.
17. Como administrador comum, quero receber 403 com o motivo ao tentar trocar o e-mail ou a senha do mestre.
18. Como mestre, quero continuar trocando o meu próprio e-mail e a minha senha.
19. Como usuário da clínica, quero que trocar a minha senha (pelo perfil ou por "esqueci minha senha") derrube as minhas outras sessões, para cortar quem roubou o meu acesso.
20. Como usuário do painel admin, quero o mesmo: redefinir a senha derruba as sessões abertas.
21. Como usuário que trocou a própria senha pelo perfil, quero continuar logado na aba em que troquei.
22. Como dono do produto, quero que a clínica cancelada pelo operador não consiga entrar, e que as sessões já abertas dela parem de funcionar.
23. Como mestre de clínica cancelada, quero uma mensagem clara no login dizendo que a clínica está cancelada.
24. Como dono do produto, quero que a clínica não consiga mudar o próprio status pelo perfil, para que só o operador cancele ou reative.
25. Como operador, quero que o painel admin limite as tentativas de login, de "esqueci minha senha" e de redefinir senha, como a clínica já faz.
26. Como operador, quero que cada "entrar como" grave quem entrou, em qual clínica, como qual usuário, quando e de qual IP.
27. Como operador, quero ver na tela da clínica os últimos "entrar como".
28. Como clínica, não quero ver o registro do "entrar como" do operador.

### Mídia de exercício aprovado

29. Como clínica que enviou um exercício já aprovado, quero propor uma thumbnail ou imagens de referência novas, para corrigir o que ficou ruim.
30. Como clínica, quero ver que a minha troca ficou "em revisão" e não foi aplicada na hora.
31. Como outra clínica, quero continuar vendo a mídia aprovada no catálogo, nos meus planos e nos PDFs enquanto a proposta não for aprovada.
32. Como operador, quero ver as propostas de mídia na fila de revisão, com o antes e o depois.
33. Como operador, quero aprovar uma proposta e ter a mídia nova aplicada ao exercício e às imagens do PDF.
34. Como operador, quero rejeitar uma proposta e manter a mídia antiga.
35. Como clínica, quero que uma proposta nova substitua a minha proposta anterior ainda pendente.
36. Como clínica, quero continuar trocando a mídia na hora enquanto o meu exercício ainda não foi aprovado.
37. Como operador, quero que o seletor de vídeo do exercício global mostre só vídeos do catálogo, sem vídeo enviado por clínica.
54. Como admin da clínica, quero trocar a thumbnail e as imagens de referência de um exercício que a minha clínica enviou pelo botão "Trocar imagens" do modal da biblioteca, com o mesmo recorte do envio.
55. Como admin da clínica, quero que a troca num exercício pendente ou rejeitado valha na hora.
56. Como fisioterapeuta ou secretária, não quero ver o botão "Trocar imagens", porque a troca de mídia é só do admin.

### Favoritos, e-mail, gerador de texto e questionário

38. Como clínica, quero receber 404 ao favoritar um exercício que eu não vejo (pendente ou rejeitado de outra clínica).
39. Como clínica, quero que a lista de favoritos mostre só exercícios que eu ainda vejo e não diga de qual clínica veio nem quem enviou.
40. Como usuário da clínica, quero que o meu e-mail seja só meu, sem diferenciar maiúsculas, para que ninguém trave o meu login gravando "Fulano@" no lugar de "fulano@".
41. Como admin da clínica, quero receber 422 ao cadastrar ou editar um usuário com um e-mail que já existe em outra caixa, inclusive de usuário excluído.
42. Como fisioterapeuta, quero que o gerador de texto da evolução use só modelos do sistema ou da minha clínica, e dê 422 com item de outra.
43. Como fisioterapeuta, quero que o texto continue saindo com um item arquivado que já estava marcado no meu rascunho (ADR 021).
44. Como clínica, quero que a resposta de um questionário só aceite perguntas do template daquele questionário, no link do paciente e na tela da clínica.

### Google Agenda

45. Como usuário da clínica, quero que só eu consiga concluir a ligação do meu Google Agenda, para que ninguém ligue a conta Google de outra pessoa à minha nem a minha à de outro.
46. Como usuário da clínica, quero que o link de autorização vença em 10 minutos e funcione uma vez só.
47. Como usuário da clínica, quero voltar do Google para a mesma tela e ver "conectado", como hoje.
48. Como fisioterapeuta, quero que a sincronização do Google de um colega nunca altere, reatribua ou cancele as minhas consultas.

### Paciente e arquivos do prontuário

49. Como clínica, quero que o paciente desativado perca o acesso ao app na hora, inclusive no refresh do token.
50. Como profissional da clínica, quero abrir um laudo ou exame do paciente por um link que vale 5 minutos, pedido com o meu login.
51. Como paciente, quero que o meu arquivo não tenha um endereço público e fixo que qualquer um abre sem login.
52. Como clínica, quero que apagar um arquivo do prontuário apague o arquivo guardado na nuvem.
53. Como usuário de outra clínica, quero receber 404 ao pedir o link de um arquivo que não é da minha clínica.

## Decisões de Implementação

### Entrega

- **Tarefa 001, o log-viewer**: branch e PR próprias (`fix/log-viewer-basic-auth`), que saem antes.
- O resto vai na branch `feat/isolamento-clinicas-e-papeis`, numa PR só.

### Log-viewer (núcleo + infraestrutura)

- O `LogViewer::auth` deixa de devolver `true`. Em produção, ele libera só o pedido que tem `REMOTE_USER` preenchido. Esse valor vem do servidor (o nginx o põe no FastCGI depois do basic auth), e o cliente não consegue forjá-lo por cabeçalho. Fora de produção, ele libera.
- O `config/log-viewer.php` continua com `enabled=true`.
- O `infra/provision.sh`:
  - gera o `htpasswd` com usuário e senha aleatórios, mostrados uma vez no fim do provision e nunca gravados no repositório;
  - põe `auth_basic` no `location` de `/log-viewer`, cobrindo a UI e a `api`;
  - grava `LOG_LEVEL=info`.
- O servidor que já existe segue um checklist manual, nas Notas.
- O `MAIL_MAILER=log` continua. Configurar o envio de e-mail está no `DEFERRED.md` da raiz.

### Mestre sem senha e link de primeiro acesso (Clinic + Admin)

- **Migration em `clinic_users`:**
  - `first_access_token_hash`: guarda o hash do token, nunca o token puro;
  - `first_access_token_created_at`;
  - `password_changed_at`, usada também na revogação de sessões.

  Sem migration de dado antigo: ainda não há cliente real.
- **O `ClinicObserver` cria o mestre** com uma senha aleatória longa que ninguém conhece e com `password_changed_at` nulo. Com isso, o login dá 401 até a senha ser definida.
- **A clínica do auto-cadastro não muda.** Ela já usa outro caminho (ADR 028), em que a pessoa escolhe a senha.
- **"Mestre sem senha definida"** é: mestre de clínica criada pelo operador com `password_changed_at` nulo.
- **Endpoints novos:**

  | Método | URL | Guard | Entrada | Saída |
  |---|---|---|---|---|
  | POST | `/api/admin/clinics/{id}/first-access-link` | `admin` | nada | `{data: {url, created_at}}`, com o token puro só aqui e só uma vez |
  | POST | `/api/clinic/auth/first-access` | público, `throttle:clinic-password` | `{token, password, password_confirmation}` | o mesmo envelope do login (`access_token`, `user`...) |

- **Gerar o link** grava o hash e a data, o que invalida qualquer link anterior. Ele funciona também depois que o mestre já definiu a senha. Nesse caso, ele serve de "link de nova senha": é o único jeito de recuperar o acesso enquanto não há e-mail, e o operador já tem o `login-as`.
- **Definir a senha pelo link** confere o hash. Se der certo, grava a senha, preenche `password_changed_at` (o que derruba as sessões anteriores do mestre), apaga o hash e devolve o token de sessão. Um token inválido ou já usado dá 422 com mensagem genérica. O link não vence pelo tempo: ele vale até ser usado ou trocado por um novo.
- **As regras de senha** são as mesmas do reset da clínica.
- **A resposta do `GET /api/admin/clinics/{id}`** ganha dois campos: `master_password_defined` (bool) e `first_access_link_created_at`.
- **SPA admin:** a tela da clínica ganha o bloco "Acesso do mestre", com o estado (senha definida ou não), o botão "Gerar link de primeiro acesso" (ou "Gerar link de nova senha", quando o mestre já tem senha), o link exibido uma vez com botão de copiar e o aviso de que gerar outro invalida o anterior.
- **SPA clínica:** a página pública nova `/clinica/primeiro-acesso?token=...` tem o formulário de senha e confirmação. Ela é feita com RHF + Zod e o design system v2, e reaproveita a base da `ClinicResetPasswordPage`. Quando dá certo, a sessão abre e a pessoa vai para `/clinica`.

### Conta do mestre, sessões, clínica cancelada, throttle e `login-as`

- **Proteção do mestre**, a parte mínima do ADR 019:
  - O `ClinicUserService::update` recusa com 403 a mudança de `email` ou `password` do mestre feita por qualquer outra pessoa ("Só o mestre altera o e-mail e a senha dele.").
  - O `Gate::before` não interfere, porque a regra fica no service.
  - A tela de edição v2 desabilita os dois campos quando o alvo é o mestre e quem edita não é ele (`permissions.ts`, com teste).
- **Revogação de sessões** (clínica e admin):
  - O `users` ganha `password_changed_at`.
  - Toda troca de senha preenche `password_changed_at`: o reset, a edição pelo perfil ou pelo admin e o primeiro acesso.
  - Um token com `iat` anterior a `password_changed_at` é recusado em toda rota autenticada e no refresh, com 401. Isso vale para os guards `clinic` e `admin`.
  - Quem trocou a própria senha recebe um token novo na mesma resposta e continua logado. Na edição de usuário, a resposta ganha `access_token` só quando o alvo é a própria pessoa.
- **Clínica cancelada:**
  - O `canLogIn` recusa com 403 o usuário de clínica `STATUS_CANCELLED` ("A clínica está cancelada. Fale com o suporte.").
  - O provider do guard `clinic` também devolve nulo para o usuário de clínica cancelada, o que corta as sessões abertas e o refresh.
  - O `UpdateClinicProfileRequest` deixa de aceitar `status` (o campo é ignorado), e o SPA para de mandá-lo.
  - Só `STATUS_CANCELLED` bloqueia. A clínica `STATUS_INACTIVE` continua entrando, como hoje (decisão do usuário).
  - O `login-as` em clínica cancelada responde 422 ("A clínica está cancelada. Reative-a para entrar."), sem exceção para o token de impersonação.
- **Throttle do admin:** limitadores nomeados, iguais aos da clínica, nas rotas de login, forgot-password e reset-password do admin.
- **Auditoria do `login-as`:**
  - Tabela nova `admin_login_as_audits` no Admin: `admin_user_id`, `clinic_id`, `clinic_user_id`, `ip`, `user_agent` e `created_at`.
  - O token emitido ganha a claim `impersonated_by` (o id do operador).
  - A resposta de `GET /api/admin/clinics/{id}` ganha `recent_login_as`, com as 10 últimas entradas (operador, usuário assumido e data). A tela da clínica no admin mostra essa lista.
  - A clínica não vê nada.

### Proposta de mídia de exercício aprovado (Media + Admin) — fronteira nova, ADR

- **Vídeo travado** é um vídeo ligado a pelo menos um exercício `approved` ou global (`clinic_id` nulo). O Admin responde isso por um contrato público novo, sem que o Media importe model do Admin.
- **O Media guarda a proposta no próprio vídeo**, no `metadata`: `proposed_thumbnail_path`, `proposed_reference_images`, `proposed_at` e `proposed_by_clinic_user_id`. Sem migration de schema.
- **Nas 4 rotas de mídia da clínica:**
  - **vídeo não travado:** tudo continua como hoje;
  - **vídeo travado:** o `confirm-upload` de thumbnail e o `PUT reference-images` gravam a proposta em vez de aplicar. A resposta tem o mesmo envelope `data`, com `proposal_pending: true`. Os pedidos de URL pré-assinada continuam iguais, porque só emitem o caminho.
  - **Uma proposta nova substitui a anterior** ainda pendente.
- **A sincronização das imagens do PDF:**
  - O Media deixa de chamar o serviço do Admin pelo container.
  - Ele publica o evento `VideoReferenceImagesChanged`, e o Admin escuta e sincroniza só os exercícios não aprovados da mesma clínica dona do vídeo.
  - Aprovar a proposta faz a sincronização dos exercícios aprovados ligados ao vídeo de forma explícita.
- **A fila de revisão do operador** mostra, além dos exercícios pendentes, os exercícios aprovados cujo vídeo tem proposta.

  | Método | URL | Guard | Efeito |
  |---|---|---|---|
  | GET | `/api/admin/exercises/media-proposals` | `admin` | `{data: [{exercise, video_id, current: {thumbnail_url, reference_images}, proposed: {...}, proposed_at}]}` |
  | PUT | `/api/admin/exercises/{id}/media-proposal/approve` | `admin` | aplica a proposta ao vídeo, sincroniza as imagens do PDF e limpa a proposta |
  | PUT | `/api/admin/exercises/{id}/media-proposal/reject` | `admin` | descarta a proposta e apaga os objetos propostos no R2 |

  O exercício continua `approved` o tempo todo.
- **O `pending-count` do admin** soma as propostas.
- **O seletor do operador** (`getAvailableForExercise`) lista só vídeos com `clinic_id` nulo.
- **SPA admin:** a revisão de exercício ganha a seção "Mídia proposta", com o antes e depois e os botões aprovar e rejeitar.
- **SPA clínica (tela nova, decidida em criar-tarefas):**
  - O modal do exercício da biblioteca v2 ganha o botão "Trocar imagens". Ele aparece quando o exercício é da própria clínica (`isOwnSubmission`) e quem está logado é admin (`permissions.ts`).
  - O botão abre a troca da thumbnail e das 2 imagens de referência, com o recorte do envio, e usa as rotas de mídia que já existem.
  - Exercício pendente ou rejeitado: a troca vale na hora.
  - Exercício aprovado: aparece o aviso "A troca vai para revisão do suporte; até lá, todos continuam vendo a mídia atual". Depois de salvar, o modal mostra o selo "em revisão" enquanto houver proposta. Para isso, a listagem de exercícios da clínica devolve `media_proposal_pending` só para os exercícios da própria clínica.
  - O vídeo, o nome e o texto não mudam nessa tela.
- **ADR novo:** "Proposta de mídia em exercício aprovado". Ele registra o dono da regra (Admin decide o que é "travado", Media guarda a proposta), o evento no lugar da chamada direta e por que o exercício não volta para pendente.

### Favoritos (Clinic)

- O `toggleFavorite` busca o exercício com o escopo `visibleToClinic` e dá 404 fora dele.
- O `favorites` aplica o mesmo escopo, o que esconde também o favorito antigo que deixou de ser visível. Ele remove os mesmos campos de origem que o index remove (`clinic_id`, `submitted_by_clinic_user_id`, `clinic` e `submittedByClinicUser`) e também o `review_status`.

### E-mail único sem diferenciar maiúsculas (Clinic)

- O `StoreClinicUserRequest` e o `UpdateClinicUserRequest` normalizam o e-mail no `prepareForValidation` (`trim` + minúsculas). A unicidade compara `LOWER(email)` com `withTrashed`, como o `RegisterClinicRequest`.
- O `ClinicObserver` e o cadastro da clínica pelo operador gravam o e-mail do mestre em minúsculas.
- Uma migration troca o índice único de `clinic_users.email` por um índice único em `LOWER(email)`. Funciona no Postgres e no SQLite dos testes. Sem conversão de dado: o ambiente só tem dado de teste, que é ajustado à mão antes do deploy.

### Gerador de texto da evolução (ClinicalRecord)

- O `generate-text` passa a receber a clínica e valida os `checked_item_ids` com a mesma regra do salvar:
  - modelo do sistema ou da clínica, ativo e não arquivado;
  - exceção do ADR 021: valem os itens que já estavam marcados no rascunho daquela evolução.
- Fora disso, a resposta é 422 com a mesma mensagem do update.

### Questionário (ClinicQuestionnaire)

- O `AnswerPatientQuestionnaireRequest` e o request do link público por token conferem que cada `answers.*.question_id` pertence ao template do questionário respondido. Fora disso, 422.

### Google Agenda (GoogleCalendar + ClinicScheduling + SPA)

- **O `connect`** gera um nonce aleatório e guarda `{uid, return}` no cache por 10 minutos. O `state` enviado ao Google é o nonce.
- **O `callback`** (público) consome o nonce com `pull`. Se ele não existe, já foi usado ou venceu, a resposta é um redirect com `?google=error`. Se está válido, o callback **não grava tokens**: ele guarda `{uid, code}` no cache por 5 minutos com um ticket aleatório e redireciona para a tela de origem com `?google_ticket=...`.
- **O endpoint novo `POST /api/clinic/google-calendar/complete`** (`auth:clinic`) recebe `{ticket}` e consome o ticket. Ele confere que o uid do ticket é o do JWT (403 se não for) e só então troca o code e grava os tokens. A saída é `{data: {connected: true}}`.
- **O formato legado** de `state` (uid puro cifrado) deixa de ser aceito.
- **SPA:** as duas telas que hoje tratam `?google=` (agenda e edição de usuário) passam a tratar `?google_ticket=`. Elas chamam o `complete`, mostram "conectado" ou "erro" como hoje e limpam a URL.
- **O pull:**
  - O `findIdByExternalEventId` e o `upsertFromExternalSource` passam a receber e filtrar o `clinic_user_id` do dono da conexão. Um evento cujo `google_event_id` já existe em consulta de outro profissional não é tocado.
  - O cancelamento vindo do Google só cancela consulta do mesmo profissional.
  - O contrato público muda de assinatura. Os dois módulos mudam juntos.

### Paciente desativado (Patient)

- O guard `patient` passa a usar um provider próprio do Patient, no molde do `ActiveClinicUserProvider`. O `retrieveById` devolve nulo quando o paciente não é elegível, pela mesma regra do `isEligible` do login.
- Isso corta as rotas autenticadas e o refresh.

### Arquivos do prontuário (ClinicalRecord + Cloudflare + SPA)

- **O upload** passa a usar o caminho privado do serviço de arquivos, como o comprovante, e deixa de gravar e devolver `cdn_url`. A coluna fica nula para os novos. Os arquivos de teste antigos são apagados à mão.
- **Endpoint novo:** `GET /api/clinic/patients/{patient}/files/{file}/url` (`auth:clinic`). Ele busca o paciente e o arquivo da clínica, e responde 404 se forem de outra clínica. A saída é `{data: {url, expires_at}}`, com link assinado de 5 minutos e nome de download pelo tipo gravado.
- **O DELETE** apaga o objeto no R2 depois do soft delete da linha. Uma falha ao apagar o objeto é reportada e não desfaz a exclusão.
- **SPA:** a entidade `PatientFile` perde `cdnUrl`. O repository ganha `getUrl`, e as telas do prontuário (aba de arquivos e "tudo") pedem o link ao clicar em abrir ou baixar.
- **O ADR 027** ganha o item: a regra de WAF também cobre `patients` + `files`, e o `r2.dev` fica desligado. Esse é um passo manual, que vai para o checklist de deploy.

### Permissões resumidas

| Ação | Quem pode | Quem decide |
|---|---|---|
| Gerar o link de primeiro acesso | Operador (guard `admin`) | `auth:admin` |
| Definir senha pelo link | Quem tem o token válido | Hash do token |
| Trocar o e-mail ou a senha do mestre | Só o próprio mestre | `ClinicUserService` |
| Aprovar ou rejeitar a proposta de mídia | Operador | `auth:admin` |
| Propor mídia nova | Admin da clínica dona do vídeo | `clinic.admin` + posse do vídeo |
| Pedir o link do arquivo do prontuário | Qualquer papel da clínica dona | Busca com `clinic_id` (a regra de papel no prontuário está fora, em `papeis-fora-do-escopo.md`) |
| Concluir a ligação com o Google | Só quem iniciou | Ticket com uid igual ao do JWT |

## Fatias Verticais

Estão em ordem de dependência. A 1 sai numa PR própria; da 2 em diante, tudo vai na mesma branch.

1. **Log-viewer atrás de basic auth.**
   - O que muda: o callback por `REMOTE_USER` em produção, o provision com `htpasswd`, `auth_basic` e `LOG_LEVEL=info`, e o checklist do servidor atual.
   - Demonstração: em `env=production`, `GET /log-viewer/api/files` sem `REMOTE_USER` dá 403, e com ele dá 200; fora de produção, dá 200.
2. **Sessões derrubadas na troca de senha** (clínica e admin).
   - O que muda: `password_changed_at` nas duas tabelas, recusa do token antigo nas rotas e no refresh, e token novo para quem trocou a própria senha.
   - Vem antes do mestre porque o primeiro acesso usa `password_changed_at`.
   - Demonstração: depois do reset, o token antigo dá 401 em `/me` e em `/refresh`.
3. **Mestre sem senha e link de primeiro acesso.**
   - O que muda: o observer, os dois endpoints, o bloco no admin, a página `/clinica/primeiro-acesso` e o smoke de ponta a ponta.
   - Demonstração: o operador cria a clínica, o login com o CNPJ dá 401, o operador gera o link, o mestre define a senha e entra, e o link usado dá 422.
4. **Conta do mestre protegida e clínica cancelada.**
   - O que muda: o 403 na troca de e-mail e senha do mestre (com a tela desabilitando os campos), a clínica cancelada sem login e sem sessão, e o perfil sem `status`.
   - Demonstração: o admin comum leva 403 no PUT do mestre; o usuário de clínica cancelada leva 403 no login e 401 com o token antigo.
5. **Throttle e auditoria do `login-as` no admin.**
   - O que muda: os limitadores, a tabela de auditoria, a claim e a lista na tela da clínica.
   - Demonstração: a sexta tentativa de login no admin dá 429; depois de um `login-as`, a tela da clínica mostra a entrada.
6. **E-mail único sem diferenciar maiúsculas.**
   - O que muda: a normalização, a unicidade com `LOWER` e o índice.
   - Demonstração: gravar `Vitima@` com `vitima@` já existente dá 422, e o login da vítima continua 200.
7. **Favoritos e gerador de texto.**
   - Demonstração: favoritar um exercício rejeitado de outra clínica dá 404, e a lista não o traz; o `generate-text` com item privado de outra clínica dá 422, com item do sistema dá 200, e com item arquivado já marcado no rascunho dá 200.
8. **Questionário e pull do Google.**
   - Demonstração: uma resposta com `question_id` de outro template dá 422; o pull do fisio A não altera nem cancela a consulta do fisio B com o mesmo `google_event_id`.
9. **OAuth do Google com nonce e ticket.**
   - O que muda: o connect, o callback, o `complete`, o fim do formato legado e as duas telas do SPA.
   - Demonstração: o `state` de A concluído sem JWT ou com o JWT de B não grava tokens; um nonce reusado ou com mais de 10 minutos dá `?google=error`; o fluxo normal conecta.
10. **Paciente desativado sem sessão.**
    - Demonstração: o paciente desativado leva 401 em `me`, em `programs` e em `refresh` com o token antigo.
11. **Arquivos do prontuário com link assinado.**
    - O que muda: o upload privado, a rota de link, o DELETE que apaga o objeto, o SPA e o ADR 027.
    - Demonstração: abrir o arquivo na tela usa o link de 5 minutos; o link de um arquivo de outra clínica dá 404; apagar remove o objeto.
12. **Proposta de mídia de exercício aprovado e a tela "Trocar imagens".**
    - O que muda: o contrato de vídeo travado, a proposta no Media, o evento no lugar da chamada direta, as rotas de revisão, o seletor do operador, as duas telas e o ADR.
    - O que muda também: o botão "Trocar imagens" no modal da biblioteca.
    - Demonstração: depois da aprovação, a clínica A troca as imagens pelo modal e vê o selo "em revisão"; a clínica B continua vendo as antigas, e o PDF também; o operador aprova e a B passa a ver as novas.

## Testes

- **Como rodar:**
  - `php artisan test --filter=<Nome>`
  - `vendor/bin/phpunit modules/<Modulo>/tests`
  - `vendor/bin/phpunit tests/Architecture`
  - `npm run test`
  - `bash bin/verificar.sh` antes de cada revisão
- **Padrões a copiar:**
  - `modules/Clinic/tests/Feature/ClinicUserIsolationTest.php` e `modules/ClinicalRecord/tests/Feature/ClinicalRecordIsolationTest.php`: duas clínicas, `actingAs($user, 'clinic')`, `RefreshDatabase` e factories.
  - `modules/Clinic/tests/Feature/PasswordResetTest.php` e o do Admin: o broker e o token de reset.
  - Os testes de comprovante em `modules/ClinicFinance/tests/`: o link assinado com o `FileServiceInterface` mockado.
  - `Event::fake` só onde o listener não importa. A sincronização da proposta usa o evento real.
  - Frontend: `resources/js/test/` com `vi.mock` do repository e `userEvent` (skill `frontend-testing`).
- **Regressão da auditoria:** cada teste `Audit*`/`Verifier*` em `run-1/agents/*/artifacts/evidence/` vira um teste do módulo, com o resultado esperado invertido. Por exemplo, "login com CNPJ dá 200" passa a ser "dá 401". Os nomes seguem o padrão do projeto.
- **O que será testado:**
  - **Log-viewer:** em produção, sem `REMOTE_USER`, 403 na UI e na API; com `REMOTE_USER`, 200; em `local`, 200.
  - **Primeiro acesso:**
    - o login do mestre recém-criado com o documento dá 401;
    - o link gerado define a senha e abre a sessão;
    - o link reusado dá 422;
    - o link anterior a um novo dá 422;
    - o link gerado para o mestre que já tem senha troca a senha e derruba o token antigo;
    - o guard `clinic` não gera link (401);
    - o auto-cadastro continua igual.
  - **Mestre:** o admin comum leva 403 ao trocar o e-mail e a senha do mestre; o mestre troca os dele; o admin troca a senha de um fisio (continua como hoje).
  - **Sessões:** o reset, a edição da própria senha e a edição pelo admin derrubam os tokens antigos (401 em rota e em refresh); quem trocou a própria senha recebe um token novo que funciona; o mesmo vale no admin.
  - **Clínica cancelada:** login 403, token antigo 401 e refresh 401; o `login-as` dá 422; a clínica inativa continua entrando; o `PUT profile` com `status` não muda o status.
  - **Throttle admin:** 429 depois do limite em login, forgot e reset.
  - **`login-as`:** grava a auditoria; o token traz `impersonated_by`; o `GET` da clínica traz no máximo 10 entradas, as mais recentes primeiro.
  - **E-mail:** a variante com maiúsculas dá 422 no store e no update; o e-mail de usuário excluído também dá 422; o e-mail é gravado em minúsculas.
  - **Favoritos:** 404 para exercício pendente ou rejeitado de outra clínica; o favorito antigo que ficou invisível some da lista; sem campos de origem.
  - **`generate-text`:** 422 com item de outra clínica; 200 com item do sistema; 200 com item arquivado já marcado.
  - **Questionário:** 422 com `question_id` de outro template, no link público e na clínica.
  - **Pull:** a consulta de outro profissional com o mesmo `google_event_id` não muda; o cancelamento vindo do Google não cancela consulta de outro profissional.
  - **OAuth:** state sem JWT ou com JWT de outro usuário não grava tokens; nonce reusado, vencido ou legado é recusado; o fluxo completo conecta.
  - **Paciente desativado:** 401 em `me`, `programs` e `refresh`.
  - **Arquivos:**
    - a resposta não traz `cdn_url`;
    - o link de 5 minutos funciona;
    - o link de um arquivo de outra clínica dá 404;
    - o link de um paciente de outra clínica dá 404;
    - o DELETE chama a remoção do objeto.
  - **Proposta de mídia:**
    - vídeo travado grava a proposta e não muda o que a clínica B vê nem as imagens do PDF;
    - aprovar aplica, e rejeitar descarta;
    - vídeo não travado continua aplicando na hora;
    - a clínica B leva 404 nas rotas de mídia do vídeo de A;
    - o seletor do operador não lista vídeo de clínica.
  - **Telas (Vitest):**
    - o bloco "Acesso do mestre" (gerar, copiar e estado);
    - a página `/clinica/primeiro-acesso` (validação, sucesso e link inválido);
    - os campos de e-mail e senha do mestre desabilitados para o admin comum;
    - a seção "Mídia proposta" na revisão admin;
    - o botão "Trocar imagens" (só para admin, só em exercício da própria clínica), com a troca na hora e o aviso e o selo "em revisão" no aprovado;
    - abrir o arquivo do prontuário pelo link;
    - a volta do Google com `google_ticket`.
- **Smoke de ponta a ponta** (skill `qa-navegador`, Chromium headless): o operador cria a clínica, gera o link, o mestre abre o link, define a senha e cai em `/clinica`. Depois, o login com o CNPJ dá erro. A evidência vai em `evidence/`.

## Fora do Escopo

- **As regras de papel** (secretária só lê, responsável obrigatório, vínculo fisio-paciente, fisio só vê os dele) e a refatoração estrutural (checagem única de clínica, `Gate::before` mais estreito, trava de arquitetura). O detalhe está em `papeis-fora-do-escopo.md`.
- **A senha do paciente = CPF e o `find-clinics` que revela a clínica:** Alto, risco aceito, no `DEFERRED.md` da raiz.
- **O envio de e-mail de verdade** e a troca de senha com código do ADR 019. Nesta feature, só a proteção do mestre.
- **O link de primeiro acesso** para os usuários que o admin da clínica cadastra.
- **As fotos de paciente e de usuário**, que continuam públicas no R2.
- **Os brokers de reset** de admin e clínica na mesma tabela, e a troca de e-mail sem nova verificação.
- **A conversão de dado antigo**: não há cliente real, e o dado de teste é ajustado à mão.
- **A unicidade de e-mail sem diferenciar maiúsculas** no `users` (admin) e em `patients`: a auditoria não achou exploração ali.

## Notas

- **Checklist de deploy** (fora do repositório):
  1. Servidor atual: gerar o `htpasswd` e pôr `auth_basic` no `location /log-viewer` do nginx, conferir que o `fastcgi_params` repassa `REMOTE_USER` e recarregar o nginx. Conferir com `curl` sem credencial (401) e com credencial (200).
  2. Cloudflare: incluir `patients` + `files` na regra de WAF do ADR 027 e desligar o `r2.dev`.
  3. Banco de teste: apagar os mestres e os arquivos de prontuário antigos, e passar os e-mails duplicados por maiúsculas para minúsculas antes da migration do índice.
- **A fatia 1 sai antes.** A ordem das outras segue a dependência. A 2 precisa vir antes da 3 por causa do `password_changed_at`.
- **O contrato público de ClinicScheduling muda de assinatura** na fatia 8. Os dois módulos (ClinicScheduling e GoogleCalendar) mudam no mesmo commit.
- **A chamada do Media ao Admin pelo container** é uma violação de fronteira que já existe hoje. A fatia 12 a troca por um evento.
- **Dado de saúde (LGPD):** os arquivos do prontuário ficam mais protegidos, e nenhuma fatia copia dado clínico. A auditoria do `login-as` guarda só ids, IP e user agent.
- **Itens do `DEFERRED.md` da raiz que esta feature resolve:**
  - o Major de 2026-11-02 sobre a mídia de exercício aprovado;
  - a pendência de 2026-10-30 sobre o `cdn_url` dos arquivos do prontuário.

  Marcar os dois como resolvidos quando a fatia correspondente fechar.
