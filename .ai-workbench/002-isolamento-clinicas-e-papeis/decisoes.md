# Decisões · 002 Isolamento entre clínicas e papéis

## Sessão 2026-11-08

Fonte: a auditoria de controle de acesso `security-audit-skill/fisioweb/run-1`, nos arquivos `REPORT.md` e `FINDINGS-DETAIL.md`, feita no commit `114c0d6`. Ela substitui o plano de 2026-10-15.

- **Qual é o recorte da 002?** → Os 12 achados confirmados da auditoria e o item "precisa validar" do R2 (o `cdn_url` permanente dos arquivos do prontuário). As regras de papel do plano antigo e a refatoração estrutural saem da 002 e ficam descritas em [`papeis-fora-do-escopo.md`](papeis-fora-do-escopo.md). As regras de papel são: secretária só lê o prontuário, responsável obrigatório, vínculo fisio-paciente, fisio vê só os pacientes dele. A refatoração estrutural é: checagem única de clínica, `Gate::before` mais estreito e trava de arquitetura. Os motivos: a auditoria mostrou que o isolamento está sólido, e as regras de papel mudam o produto, não fecham brecha. (Substitui o escopo do plano de 2026-10-15.)
- **Como entregar?** → A tarefa 001 é o `/log-viewer`, numa PR própria que sai antes. O resto vai na branch da feature, numa PR só. O motivo: o log-viewer é anônimo, a correção é pequena e não pode esperar o fim da feature. (Substitui a decisão de 2026-10-15 de uma PR só.)
- **O que fazer com o `/log-viewer` em produção?** → Ele continua ligado, atrás de basic auth no nginx. O `infra/provision.sh` gera o `htpasswd`, e o usuário e a senha não entram no git. O `LogViewer::auth` deixa de devolver `true`: em produção, ele só libera o pedido em que o nginx preencheu o `REMOTE_USER`, que o cliente não consegue forjar por cabeçalho. Sem isso, a resposta é 403. Fora de produção, ele continua liberando. O servidor que já existe precisa de um passo manual no nginx, porque o provision só roda na criação.
- **E o envio de e-mail (`MAIL_MAILER=log` no provision)?** → Hoje o sistema ainda não envia e-mail de verdade, e a 001 não mexe nisso. Com o basic auth, só o operador lê os links de redefinir senha que vão para o log. No provision, `LOG_LEVEL` passa de `debug` para `info`. Configurar um provedor de e-mail antes de ter clínica real usando o sistema vai para o `DEFERRED.md` da raiz. A aplicação não é travada em produção com o mailer de log, porque isso quebraria a produção de hoje.
- **Já existe cliente real em produção?** → Não, só dado de teste. As correções valem para o que for criado daqui para frente. Não há migration para converter dado antigo: nem senha de mestre ou de paciente que já existe, nem e-mail com maiúsculas. O dado de teste é ajustado à mão.
- **Como fica a senha inicial do mestre criado pelo operador?** → Não existe senha inicial. O mestre nasce sem senha utilizável, e o login dele dá 401 até ele definir uma. Na tela da clínica no painel admin, o operador gera um **link de primeiro acesso** (`/clinica/primeiro-acesso?token=...`), copia e manda à clínica por fora (WhatsApp). O mestre abre o link, cria a própria senha e entra. A ideia é do usuário: um acesso sem senha, como o `login-as`, em que o próprio mestre cria a senha. O `login-as` não é reaproveitado no link, porque ele gera um JWT de sessão. (Substitui a senha = documento do `ClinicObserver`.)
- **Quanto tempo vale o link de primeiro acesso?** → Ele não vence pelo tempo: vale até o mestre definir a senha, e é de uso único. Gerar um link novo invalida o anterior. Como o token não vence, ele não usa o broker de reset, que vence em 60 minutos. O link precisa de um token próprio, guardado só como hash. Risco aceito: um link vazado e não usado continua valendo até alguém usá-lo ou o operador gerar outro.
- **O link de primeiro acesso vale para quem?** → Só para o mestre de clínica criada pelo operador. Os usuários que o admin da clínica cadastra continuam com a senha digitada pelo admin. Usar o mesmo link para eles vai para o `DEFERRED.md` da feature.
- **Senha do paciente = CPF (Alto `patient/auth-login/default-password-equals-cpf`)?** → Fica para outra feature. A 002 não mexe na senha do paciente nem no `find-clinics`. É um **risco aceito**: quem sabe o CPF de um paciente entra no app dele e lê o cadastro e o diagnóstico. O item vai para o `DEFERRED.md` da raiz como Alto. Quando a feature nova vier, o caminho natural é o mesmo link de primeiro acesso do mestre, gerado pela clínica.
- **A clínica dona muda a mídia de um exercício já aprovado (Médio `admin/exercise-approval/owner-clinic-rewrites-approved-media`)?** → Aceita, mas a mídia nova vira uma **proposta** que passa por revisão. Ela não substitui a antiga até o operador aprovar.
- **O que as outras clínicas veem enquanto a proposta está pendente?** → A mídia antiga, já aprovada: no catálogo, nos planos que já usam o exercício e nos PDFs. O exercício continua aprovado e visível. A thumbnail e as imagens de referência novas ficam guardadas à parte e entram na fila de revisão do operador já existente, que mostra o antes e o depois. Se o operador aprova, a proposta substitui a mídia; se rejeita, ela é descartada. O motivo: gravar a mídia na hora deixaria os planos da clínica B com as imagens novas antes da revisão. (Substitui a ideia de "voltar para pendente" da pergunta anterior.)
- **E as variantes técnicas do mesmo achado?** → Também entram. O `ExerciseReferenceImageSyncService::syncFromVideo` deixa de regravar exercício aprovado ou global. Um vídeo ainda pendente na aprovação, que recebe a thumbnail depois, segue o mesmo caminho da proposta. O seletor de vídeo do operador (`VideoRepository::getAvailableForExercise`) deixa de listar vídeo de clínica para ligar a exercício global.
- **Arquivos do prontuário no R2 público (precisa validar `clinicalrecord/patient-files/public-permanent-cdn-url`)?** → Recebem o mesmo tratamento do comprovante de Finanças.
  - A API para de devolver e de gravar o `cdn_url`. Uma rota autenticada, com isolamento de clínica, dá um link assinado de 5 minutos.
  - Apagar o arquivo no sistema apaga o objeto no R2. Não existe rota de restaurar.
  - A regra de WAF do ADR 027 passa a cobrir `patients/files`, e o `r2.dev` fica desligado. Esse é um passo manual na Cloudflare, registrado como pendência de deploy no ADR.
  - As fotos de paciente e de usuário continuam públicas. Isso vai para o `DEFERRED.md` da feature.
- **Quais reforços da auditoria (que não são achado) entram?** → Os quatro sugeridos.
  - **Proteger a conta do mestre.** É a parte mínima do ADR 019, só no backend: só o próprio mestre muda o e-mail e a senha do mestre, e qualquer outro recebe 403. A troca de senha com código por e-mail do ADR 019 continua fora, porque o sistema não envia e-mail.
  - **Clínica cancelada não loga.** O login e cada requisição recusam o usuário de clínica cancelada, e o `PUT /clinic/profile` deixa de aceitar `status`.
  - **Throttle** no login, no forgot e no reset do painel admin, como já existe na clínica.
  - **Auditoria do `login-as`**: o token ganha a marca de impersonação, e o sistema grava quem entrou, quando e em qual clínica.

  Ficam fora (`DEFERRED.md` da feature): os brokers de reset de admin e de clínica dividem a mesma tabela, e a troca de e-mail de usuário da clínica não pede nova verificação. O pré-sequestro de conta no auto-cadastro fecha junto com o achado "o reset não derruba tokens".
- **Onde fica o registro do `login-as`?** → Numa tabela de auditoria no módulo Admin, que grava o operador, a clínica, o usuário assumido, a data e o IP. A tela da clínica no painel admin mostra os últimos acessos, e só o operador vê. A clínica não vê nada.
- **Correções técnicas dos outros 8 achados?** → Seguem a auditoria, com os ajustes do código atual:
  - **Favoritos** (Médio): o `toggleFavorite` dá 404 fora do `visibleToClinic`. A lista reaplica o escopo, inclusive para favorito antigo, e esconde `clinic_id`, `review_status` e `submitted_by_clinic_user_id`.
  - **E-mail com maiúsculas** (Médio): o e-mail do usuário da clínica é gravado em minúsculas no cadastro e na edição. A unicidade compara `LOWER(email)` com `withTrashed`, e entra um índice único em `LOWER(email)`.
  - **`generate-text`** (Médio): usa a mesma regra do salvar (modelo do sistema ou da clínica, ativo e não arquivado). A exceção do ADR 021 para itens já marcados no rascunho continua. Fora disso, 422. Na implementação (tarefa 011, 2026-11-09), o `generate-text` não exige que o item seja do modelo salvo na evolução, como o salvar exige: o rascunho pode trocar de modelo antes de salvar, e o isolamento entre clínicas não depende disso. O salvar continua recusando item de outro modelo.
  - **OAuth do Google** (Médio): o `state` vira um nonce aleatório no cache, de uso único e com validade de 10 minutos, e o formato legado de uid puro sai. O callback não conclui a ligação: ele redireciona ao SPA com um ticket de uso único, e um POST autenticado conclui só se o uid do JWT for o do ticket.
  - **O reset não derruba o token** (Baixo): qualquer troca de senha (reset, perfil ou admin) invalida os JWT e os refresh emitidos antes, na clínica e no admin.
  - **Questionário** (Baixo): cada `answers.*.question_id` precisa ser do template do questionário (422), no link público e no lado da clínica. Na implementação (tarefa 012, 2026-11-09), a pergunta arquivada do mesmo template continua aceita: ela ainda é do template, e o paciente que abriu o link antes de a clínica editar o modelo não perde a resposta. O `exists` do `question_id` saiu do FormRequest: a pergunta que não existe recebe a mesma mensagem da pergunta de outro template, e o link público, sem login, deixa de revelar quais ids existem.
  - **Pull do Google** (Baixo): o pull de um fisio só cria, altera ou cancela consultas dele mesmo. Na implementação (tarefa 013, 2026-11-09), um evento cujo `google_event_id` já está na consulta de outro profissional da mesma clínica é ignorado: o pull do A não mexe na consulta do B e também não cria uma cópia para o A (agenda compartilhada viraria consulta duplicada sem paciente). O upsert devolve `null` nesse caso.
  - **Paciente desativado** (Baixo): o guard do paciente confere a elegibilidade a cada requisição e no refresh, como o `ActiveClinicUserProvider`.
- **Como saber que funcionou?** → Cada teste que a auditoria usou para provar um achado (em `run-1/agents/*/artifacts/evidence/`) volta como teste de regressão, com o resultado esperado invertido. Cada endpoint tocado tem o caso de outra clínica. O `/log-viewer` em `env=production` sem basic auth dá 403. Os passos que ficam fora do repositório viram checklist de deploy: o nginx com basic auth no servidor que já existe, a regra de WAF para `patients/files` e o `r2.dev` desligado.
- **Onde vive cada parte?**
  - **Núcleo** (`app/Providers`, `config/log-viewer.php`, `infra/provision.sh`): o log-viewer.
  - **Clinic**: o mestre sem senha e o link de primeiro acesso, o e-mail em minúsculas, a proteção do mestre, a clínica cancelada, os favoritos e a revogação de token.
  - **Admin**: o throttle, a auditoria do `login-as`, a revisão da proposta de mídia e a revogação de token do admin.
  - **Media**: a proposta de mídia e o seletor do operador.
  - **ClinicalRecord**: o `generate-text` e o link assinado do arquivo.
  - **ClinicQuestionnaire**: a validação do `question_id`.
  - **GoogleCalendar** e **ClinicScheduling**: o OAuth e o pull.
  - **Patient**: o guard do paciente desativado.
  - **SPA**:
    - painel admin, na tela da clínica: gerar o link de primeiro acesso e ver os últimos `login-as`;
    - painel admin, na revisão de exercício: o antes e depois da mídia;
    - tela nova `/clinica/primeiro-acesso`;
    - envio de exercício: o aviso de "proposta em revisão";
    - prontuário: abrir o arquivo pelo link assinado;
    - volta do Google com o ticket.
  - Os módulos falam entre si por contrato público, sem importar model de outro módulo. Dado de saúde (LGPD): só os arquivos do prontuário, que ficam mais protegidos.

### Fora do escopo

- As regras de papel e a refatoração estrutural do plano de 2026-10-15. O detalhe está em [`papeis-fora-do-escopo.md`](papeis-fora-do-escopo.md).
- A senha do paciente = CPF e o `find-clinics` que revela a clínica: Alto, risco aceito, no `DEFERRED.md` da raiz.
- Configurar o envio de e-mail de verdade (`DEFERRED.md` da raiz) e a troca de senha com código por e-mail do ADR 019.
- O link de primeiro acesso para os usuários que o admin da clínica cadastra.
- As fotos de paciente e de usuário, que continuam públicas no R2.
- Os brokers de reset de admin e de clínica na mesma tabela, e a troca de e-mail do usuário da clínica sem nova verificação.
- Migration de conversão de dado antigo: ainda não há cliente real.

## Sessão 2026-11-08 (escrever-plano, "Ataque o plano")

- **A clínica com status "Inativo" (0) continua entrando?** → Sim. Só a clínica "Cancelado" (-1) perde o login e as sessões. O "Inativo" continua sem efeito, como hoje.
- **O operador pode fazer "entrar como" numa clínica cancelada?** → Não. A resposta é 422 com o motivo ("A clínica está cancelada. Reative-a para entrar."). Para olhar a conta, o operador reativa a clínica antes. A regra é uma só, sem exceção para o token de impersonação.
- **O operador pode gerar o link de novo depois que o mestre já definiu a senha?** → Sim. Nesse caso o botão vira "Gerar link de nova senha", e usar o link troca a senha e derruba as sessões do mestre. O motivo: sem e-mail, é o único jeito de o mestre recuperar o acesso, e o operador já tem o "entrar como", então não ganha poder novo. (Ajusta a decisão "vale até o mestre definir a senha": o link continua de uso único e invalidado por um novo.)

## Sessão 2026-11-08 (criar-tarefas)

- **Não existe tela para a clínica trocar a mídia de um exercício já enviado: o que fazer com a proposta?** → Criar a tela. Hoje as rotas de mídia da clínica só são usadas no envio novo, então a proposta só aconteceria por chamada direta à API.
- **Como fica a tela?** → Fica no modal do exercício da biblioteca v2. Ela aparece só quando o exercício foi enviado pela própria clínica e quem está logado é admin da clínica (as rotas de mídia são `clinic.admin`). O botão "Trocar imagens" abre a troca da thumbnail e das 2 imagens de referência, com o mesmo recorte do envio. Se o exercício está pendente ou rejeitado, a troca vale na hora. Se está aprovado, vira proposta: aparece o aviso "em revisão" e o modal mostra um selo até o operador decidir. O vídeo, o nome e o texto não mudam nessa tela.

## Sessão 2026-11-08 (implementar-tarefa 003)

- **O mestre da clínica que se cadastrou sozinha aparece como "senha definida" no admin?** → Sim. O auto-cadastro passa a gravar `password_changed_at` no mestre ao criar, e `master_password_defined` é só `password_changed_at` não nulo, sem deduzir pela origem da clínica. Para a clínica nada muda: o token do login sai depois.
- **Link de primeiro acesso para mestre inativo?** → Não. Gerar o link pede um mestre ativo (422 sem ele), porque o guard recusa o token de usuário inativo e a sessão devolvida não funcionaria.
- **O mestre que se cadastrou sozinho e não confirmou o e-mail pode usar o link?** → Sim, e o link confirma o e-mail: definir a senha pelo link grava `email_verified_at` quando ele está nulo. O operador entregou o link e responde pela pessoa, e sem envio de e-mail real é o único caminho para ela entrar (revisão adversária da 003, ACHADO-001).
- **O link já gerado funciona em clínica cancelada?** → Não deve, mas isso fica na tarefa 006, junto com o login, o provider e o `login-as`: o `first-access` passa a recusar o mestre de clínica cancelada (revisão adversária da 003, ACHADO-008).
