# Definição de Pronto (DoD)

Este é o mínimo para qualquer tarefa contar como pronta neste repositório.
Código que só "roda" não está pronto. Antes de dizer que terminou, passe por
cada item que se aplica e só afirme que está pronto quando todos passarem.

Se pular algum item, diga qual e por quê. Pular é dizer que o item não se aplica
a esta mudança (uma refatoração não precisa de smoke test). Isso é diferente de
adiar, que é dizer que o item se aplica mas vai ficar para depois: nada desta
lista pode ser adiado (veja "Trabalho adiado").

O `CLAUDE.md` aponta para este arquivo. Os comandos estão na seção "Commands" do
`CLAUDE.md`, e `bash bin/verificar.sh` roda os testes e as verificações na ordem
certa.

## Escopo

- A mudança faz o que foi pedido, por inteiro: sem caminho pela metade, sem
  `TODO` deixado para trás dentro do escopo. Se a tarefa vem de
  `.ai-workbench/<feature>/tasks/`, todos os critérios de aceite dela foram
  cumpridos.
- Nada a mais: sem arquivo que não tinha nada a ver, sem `dd`, `dump`,
  `var_dump`, `ray`, `Log::debug` de depuração ou `console.log` esquecido, sem
  código comentado.
- **Toda edição que você diz que fez foi conferida no arquivo.** Um script de
  troca de texto que não encontra o trecho (basta um espaço diferente) termina
  sem erro e não muda nada, e aí "eu atualizei" e "eu tentei atualizar" ficam
  iguais. Confira que o trecho existe antes de trocar e leia o arquivo depois.
  Para uma edição pontual, prefira a ferramenta que falha quando o trecho não
  bate. Um script que faz várias edições confere todas as condições antes de
  começar, para não deixar o código pela metade se uma delas falhar.
- Nenhum `git add`: liste os arquivos alterados e deixe o stage com quem pediu.

## Pasta de trabalho

Todo trabalho do ciclo vive em `.ai-workbench/`, uma pasta por feature:

```
.ai-workbench/
├── DEFERRED.md                 # adiado que não pertence a nenhuma feature
└── NNN-<slug>/                 # a feature: 001-agenda-recorrente, 002-...
    ├── README.md               # índice: objetivo, branch, status, tarefas
    ├── DEFERRED.md             # o que esta feature deixou de fora
    ├── spec.md                 # especificação, opcional (skill especificar)
    ├── checklists/requisitos.md # checklist de qualidade da spec
    ├── plans/<slug>.md         # plano (skill escrever-plano)
    ├── tasks/NNN-<slug>.md     # tarefas (skill criar-tarefas)
    ├── evidence/<tarefa>/      # smoke test
    └── review/<tarefa>/        # revisão adversária
```

- `<feature>` é o nome da pasta (`001-agenda-recorrente`). O número é o próximo
  depois do maior que já existe em `.ai-workbench/`.
- `<tarefa>` é o nome do arquivo da tarefa sem `.md` (`002-cancelar-sessao`).
  Trabalho sem arquivo de tarefa (correção pequena) usa `000-<slug>`.
- A feature nasce na skill `especificar` (quando o ciclo começa pela spec) ou
  na skill `escrever-plano`. Correção pequena que não passa pelo plano cria a
  pasta só com o `README.md`.
- Pastas de apoio (por exemplo `engenharia-reversa/`, com notas sobre o código
  que já existe) podem ser criadas na feature; cite cada uma no `README.md`.
- `README.md`, `spec.md`, `checklists/`, `plans/` e `tasks/` entram no git. `evidence/`, `review/` e os
  dois `DEFERRED.md` ficam no `.gitignore` e nunca entram num commit, numa PR,
  numa issue ou numa mensagem: podem ter dado de paciente.

## Regras do fisioweb

Estas regras repetem os "Princípios não-negociáveis" do `CLAUDE.md` e as skills
de `.claude/skills/`, escritas como itens para conferir no diff. Quem mudar uma
regra lá muda aqui também, na mesma PR.

### Isolamento e autorização (skill `security`)

- Todo recurso da clínica é isolado por `clinic_id`: a query filtra pela clínica
  do usuário autenticado, e model carregado por id passa por Policy que compara
  `$user->clinic_id === $model->clinic_id`. Um usuário da clínica A nunca vê nem
  altera nada da clínica B.
- O paciente (guard `patient`) só enxerga os próprios dados.
- `clinic_id`, `clinic_user_id` ou `patient_id` vindos da requisição nunca são
  aceitos sem validar a posse.
- Toda rota não pública fica em grupo `auth:admin`, `auth:clinic` ou
  `auth:patient`. Controller de recurso usa `authorizeResource` ou
  `$this->authorize(...)`; ação fora do CRUD ganha método na Policy.
- Papéis da clínica (`admin`, `physiotherapist`, `secretary`) são decididos no
  backend. O frontend (`permissions.ts`, `RequireClinicAdmin`) só esconde para
  UX: botão escondido sem endpoint protegido é falha de segurança.

### Backend (skills `backend-clean-code`, `architecture-paradigm-modular-monolith`, `php-modern`)

- Camadas: Controller → FormRequest → Service/UseCase → Repository → Model.
  Controller não pensa; regra de negócio no Service; Repository só busca e
  salva; DTO `readonly` transporta. Dependência por interface ligada no
  ServiceProvider do módulo, nunca classe concreta de outra camada.
- Monólito modular (skill `architecture-paradigm-modular-monolith`): um módulo
  não importa Model, Repository ou tabela de outro módulo para regra de negócio;
  colabora por contrato público, DTO ou evento. Tabela tem dono único. Fronteira
  nova ou exceção ganha ADR em `docs/adr/`. Os testes de
  `tests/Architecture` passam.
- Migration no módulo dono, com o prefixo de tabela do módulo (`admin_`,
  `clinic_`, `media_`...), conferindo o case da pasta `Database/Migrations` vs
  `database/migrations` do módulo.
- Job que depende de dado gravado na mesma transação é despachado depois do
  commit (`afterCommit`). Upload para R2, PDF e envio de mensagem vão para a fila
  (skill `laravel-queues`).
- Sem N+1: relacionamento usado em listagem vem com `with()`. Listagem é
  paginada.
- Estilo PHP: Pint; `is_null()` / `!is_null()` para null; `empty()` /
  `!empty()` para string vazia; sem `declare(strict_types=1)` (convenção atual).

### Frontend (skills `frontend-ddd`, `api-client`, `forms-shadcn`, `frontend-ui-patterns`, `design-system`)

- Camadas: loader chama `application/`, nunca `infrastructure/`. Página não
  importa `apiClient`. `apiClient` é o único caminho HTTP: sem `fetch` nem
  `axios` direto.
- `domain/` é puro: entidade em camelCase, sem `_at`, sem `ApiXxx`, sem
  `WriteDto`, sem constante de UI. O mapeamento snake_case ↔ camelCase fica no
  mapper de `infrastructure/`.
- Formulário com 2 campos ou mais usa React Hook Form + Zod. Não copiar as
  páginas legadas com `useState`.
- Tela v1 (as que já existem): componentes shadcn/ui e os padrões de
  `frontend-ui-patterns` (sidebar, popover, cursor, tokens de cor). Tela v2:
  componentes de `@/components/ds` e os padrões de `design-system` (tokens
  `--ds-*`, `dsCn`, tema escuro por `data-theme`). Nunca as duas bibliotecas
  na mesma tela. Sem CSS reinventado em nenhuma das duas.
- TypeScript strict, sem `any` novo sem justificativa.

### Dados e segredos

- Dado de paciente é dado de saúde (LGPD): nome, CPF, telefone, e-mail,
  prontuário, evolução e questionário nunca aparecem em log, evidência,
  mensagem de commit, PR ou issue.
- Nenhuma senha, token JWT, chave de R2, Twilio ou Google no código ou no
  commit.
- Teste nunca usa data fixa como `'2026-10-01'`: use `now()->addDay()` (ou
  `$this->travelTo(...)`) e reaproveite o mesmo valor na requisição e no
  assert, senão o teste quebra sozinho quando o calendário passa daquela data.

## Testes

- Comportamento novo tem teste. Correção de bug tem um teste que reproduz o bug.
- **Você viu o teste falhar antes de passar.** Teste que nunca ficou vermelho
  pode estar passando por acaso.
- **Quebre o código de propósito.** Com o teste passando, estrague o código que
  ele protege, confirme que o teste fica vermelho e desfaça a quebra. Leva um
  minuto e é a única prova de que o teste protege alguma coisa. Confira também se
  os dados do teste chegam de verdade no caminho que ele diz testar.
- Endpoint da clínica tem teste de outra clínica (404 ou 403) e, quando houver
  regra de papel, de papel sem permissão. Siga a skill `php-testing`
  (`actingAs($user, 'clinic')`, factories, `RefreshDatabase`).
- Os testes **rodaram de verdade** e alguém olhou a saída:
  `php artisan test --filter=NomeDoTest` para o que você mexeu e a suíte do
  módulo (`vendor/bin/phpunit modules/<Modulo>/tests`) antes da PR. Se algum
  falhar, a tarefa não está pronta.
- **Confira quantos testes rodaram.** Se o filtro não pegar nenhum teste, o
  comando termina sem erro e parece que passou. Não passou: só não falhou.
- Frontend: `npm run test` (Vitest, roda e sai) e a skill `frontend-testing`.
  Não use `npm run test:watch` para conferir: ele nunca termina.

## Verificações

- `bash bin/verificar.sh` termina com tudo OK. Ele roda, só nos arquivos que
  mudaram desde a `main`: Pint em modo de conferência, a suíte de testes de
  cada módulo de `modules/` que mudou, os testes PHP alterados fora de
  `modules/`, a suíte `Architecture` quando mexeu em `modules/` ou `app/` e,
  se mexeu em `resources/js`, ESLint e Prettier nos arquivos alterados,
  `npm run types`, `npm run test` e `npm run build`. Ferramenta que não está instalada aparece
  como **NÃO VERIFICADO**, nunca como OK.
- O CI (`.github/workflows/`) roda `composer lint`, `npm run format`,
  `npm run lint`, `npm run build` e a suíte inteira do PHPUnit. O
  `bin/verificar.sh` não substitui o CI, só pega o erro antes dele.
- **Cuidado com `npm run lint` e `npm run format`:** eles corrigem arquivos
  (`--fix`, `--write`) em vez de só conferir, e podem mexer em arquivo fora do
  escopo. Para conferir, use o `bin/verificar.sh`.

## Smoke test com evidência

**Obrigatório para toda mudança de comportamento:** endpoint, tela,
funcionalidade ou correção de bug, novos ou alterados. O objetivo é **achar
erro**, não marcar um item.

**Quando pode pular.** Refatoração pura, documentação e configuração podem pular,
dizendo que pularam e por quê. Existe um quarto caso, mais estreito do que
parece: comportamento já coberto de ponta a ponta por testes que existiam
**antes** desta mudança. Um teste que você está criando agora não conta, e uma
funcionalidade nova nunca entra nesse caso. Na dúvida, faça o smoke test.

**Avise o revisor que pulou.** Diga o motivo no pedido para o subagente revisor,
não só no relatório final: ele não lê o relatório, então um pulo que ninguém
contou para ele parece uma etapa esquecida. No quarto caso, diga qual teste
antigo cobre o comportamento.

**O que cada mudança deixa em `.ai-workbench/<feature>/evidence/<tarefa>/`**
(diga no `SUMMARY.md` qual linha se aplica, para o revisor não cobrar um arquivo
que a sua mudança nunca produziria):

| Mudança | O que fica |
|---|---|
| Só tela | `frontend/<fluxo>/` por fluxo, mais `SUMMARY.md` |
| Só backend | `backend/<caso>.txt` por endpoint e por caso de permissão, mais `SUMMARY.md` |
| As duas | as duas coisas acima |
| Nenhuma das duas (job da fila, comando Artisan, PDF, mensagem) | `backend/<caso>.txt` com a chamada que disparou e a saída (o PDF gerado, a saída do comando, o log do job), mais `SUMMARY.md` |
| Smoke test pulado com motivo | nada: o motivo dito é o registro |

`<feature>` e `<tarefa>` seguem a seção "Pasta de trabalho".

**Passo a passo:**

1. Suba o ambiente local (`composer run dev`, ou o Sail descrito em `SAIL.md`)
   e confirme que o sistema abre em `APP_URL`. Use dados do seeder
   (`php artisan db:seed`) e garanta **duas clínicas** com usuários próprios,
   para poder testar o isolamento.
2. **Tela:** abra o fluxo alterado num navegador de verdade (MCP do Playwright
   ou do Chrome DevTools), faça o que o usuário faria e fique de olho em erro
   no console, na rede e na tela. Salve cada print em `frontend/<fluxo>/`, uma
   pasta por fluxo, para que refazer um fluxo não apague a evidência dos outros.
3. **Backend:** chame o endpoint por HTTP de verdade, com um token de verdade
   (`POST /api/clinic/auth/login`, `/api/admin/auth/login` ou
   `/api/patient/auth/login`). Confira status, formato da resposta (envelope
   `data`), papel e **isolamento por clínica**: um usuário da clínica A não pode
   ver nem mexer em nada da clínica B, e um paciente não vê dado de outro
   paciente. Esses casos são os mais importantes, porque são justamente os que
   um resumo do agente pula. Um arquivo por endpoint e por caso de permissão,
   com a requisição e a resposta, cabeçalhos incluídos (`curl -sv`).
4. **Apague a credencial antes de salvar.** O cabeçalho `Authorization: Bearer`
   é uma credencial que funciona. Troque o valor por `[removido]` e mantenha o
   nome do cabeçalho, porque mostrar que ele foi enviado faz parte da prova.
   Nunca salve a resposta do login nem a do refresh.
5. Escreva o `SUMMARY.md`, que é o primeiro arquivo que o revisor lê: qual linha
   da tabela se aplica, uma linha por arquivo dizendo o que ele cobre, o fluxo
   testado, com qual papel e qual clínica, o resultado e cada erro encontrado e
   corrigido. Sem nome de paciente, CPF, e-mail, telefone, dado clínico ou
   senha: só o `SUMMARY.md` pode sair da sua máquina.
6. Fluxo **novo** sai com teste commitado. Para fluxo que já existia, transformar
   o caminho feliz num teste é recomendado, mas opcional.
7. Se uma correção da revisão mudou comportamento, refaça o smoke test só dos
   fluxos afetados e atualize a evidência antes da rodada seguinte.

A pasta `evidence/` fica no `.gitignore` e nunca entra num commit, numa PR ou
numa mensagem. Apague `evidence/<tarefa>/` e `review/<tarefa>/` depois do
merge.

## Revisão adversária

Rode a skill `revisao-adversaria`. Ela chama o subagente `revisor-adversario` e
depois o `verificador-de-achados`, e repete até passar.

- O subagente revisor ataca o diff com uma regra: **o trabalho dele é achar
  problema, não aprovar.** Cada problema sai classificado como **Crítico**,
  **Major** ou **Minor**.
- **Um segundo subagente confere cada achado** antes de alguém corrigir: o
  problema é real, está no escopo, a gravidade está certa? Quem escreveu o código
  nunca descarta um achado por conta própria. Pode contestar **uma vez**, levando
  a saída de um comando que rodou e que o verificador não tinha visto. Se o
  achado for confirmado de novo, uma pessoa decide, olhando as provas lado a
  lado.
- O revisor olha por cinco ângulos e diz qual ângulo achou cada problema:
  **segurança**, **casos de borda**, **lacuna de verificação** (afirmação sem
  prova, evidência faltando, teste que não testa), **estrutura e arquitetura**
  e **regras do fisioweb**.
- A primeira rodada usa os cinco. As seguintes podem ser mais focadas, mas
  **segurança e regras do fisioweb nunca saem**: uma correção pode abrir uma
  brecha de `clinic_id` enquanto conserta outra coisa. Volte a incluir lacuna de
  verificação quando a correção mudou comportamento, e estrutura quando mexeu em
  migration, model, fronteira de módulo ou listagem. Na dúvida, use os cinco.
  Diga os ângulos da rodada no pedido ao revisor, toda vez.
- Diga no pedido também contra qual branch comparar. Sem isso, ele revisa de novo
  o que já foi revisado.
- Crítico e Major travam: corrija e rode a revisão de novo. Minor vai na
  descrição da PR e não trava.
- **No máximo 3 rodadas** (as conferências e a contestação não contam). Se ainda
  sobrar Crítico ou Major, uma pessoa decide. Não esconda e não siga em frente
  sozinho.
- **Se a correção de uma rodada criou o problema da seguinte, duas vezes
  seguidas, pare antes do limite.** As rodadas estão correndo atrás de um defeito
  que ninguém nomeou. Dê nome ao tipo de erro, procure no seu diff todos os
  lugares onde ele aparece e, se a solução certa mudar o escopo, leve a decisão
  para uma pessoa agora.
- **Corrija o tipo de erro, não só a linha.** Depois de um problema grave,
  pergunte qual é o formato geral dele e onde mais esse formato aparece no diff,
  antes de corrigir.
- **Quebre o código de propósito antes de chamar o revisor**, não depois de ele
  dizer que o teste não testa nada.
- **Releia o que você escreveu.** Comentários, docblocks, mensagem de commit,
  critérios de aceite marcados como feitos e descrição da PR batem com o código como ele
  está agora? Texto que descreve um código que já mudou é um dos erros mais
  comuns.

## Trabalho adiado

- **Nada desta lista pode ser adiado.** Teste que faltou, `TODO` ou tela pela
  metade dentro do escopo não é trabalho adiado, é tarefa não terminada.
- O que você decidiu deixar fora do escopo da feature vai para
  `.ai-workbench/<feature>/DEFERRED.md` **na hora em que decidiu**, não
  reconstruído depois: data, tarefa de origem e uma frase simples.
- Problema real que a revisão achou em código que esta feature não criou
  (`REAL-FORA-DO-ESCOPO`) não pertence à feature: vai para o
  `.ai-workbench/DEFERRED.md` da raiz, com data, feature de origem e
  `(revisão adversária)`.
- Melhorias opcionais vão para a lista de Minor na descrição da PR, não para os
  arquivos.
- **A PR só abre com destino decidido para cada item aberto da tarefa:**
  - **Vira issue no GitHub** (ou tarefa nova em `tasks/`). Use sempre que o
    trabalho deve mesmo acontecer depois: é o único registro que dura, tem dono e aparece em busca. Escreva o texto e peça
    aprovação antes da PR; crie depois que a PR existir, para que uma PR
    abandonada não deixe issue órfã.
  - **Aparece na descrição da PR** como algo deixado de fora de propósito. Serve
    para o que o revisor precisa ver mas não vale uma issue. Depois do merge, a
    descrição da PR é o único rastro, então escolha isso de propósito.
- Os `DEFERRED.md` são rascunhos locais, fora do git, na pasta onde o trabalho
  aconteceu. Não trate como registro. Se ele não existe, diga que não
  existe; não leia isso como "nada foi adiado".

## Documentação

- Se mudou arquitetura, interface pública, convenção ou comando, atualize na
  mesma PR o `CLAUDE.md` (e o `AGENTS.md`, que espelha ele), a skill em
  `.claude/skills/`, o ADR em `docs/adr/` ou o doc em `docs/`.
- Critério de aceite da tarefa em `.ai-workbench/<feature>/tasks/` é marcado
  `[x]` só depois que a Definição de Pronto passou, e o status da tarefa é
  atualizado no `README.md` da feature.

## Relatório final

- O resumo final diz: o que foi feito, o que foi provado e com qual comando (ou
  o que se viu no smoke test), o resultado da revisão adversária e o que ficou
  de fora ou sem conferir.
- Não enrole sobre o que foi verificado, e não exagere sobre o que não foi.
