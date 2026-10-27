# Lista de usuários da clínica no design system v2

Data: 2026-10-20
Fonte: conversa de refinamento de 2026-10-19, a partir do protótipo C
(Funções e acessos) em `/clinica/usuarios?variant=C`, alinhado ao mock
aprovado. Pacote no mesmo espírito da lista de pacientes DS
(`.ai-workbench/005-clinic-pacientes-ds`).

## Problema

A lista de usuários da clínica (`/clinica/usuarios`) ainda é a tabela v1 em
shadcn. O administrador não vê, de um relance, o que cada função pode fazer,
nem quem está sem verificação em duas etapas. Para mudar a função de alguém,
precisa abrir a edição. O protótipo C no design system v2 já mostra a equipe em
cartões, as funções em sanfona e o arraste para mudar função — mas só aparece em
desenvolvimento, as mutações (mudar função, excluir, desativar) são stub, a
busca não sobrevive ao F5 nem ao voltar da edição, e a listagem da API não
manda os sinais de 2FA e Google Agenda.

## Solução

A variante C vira a lista de usuários de verdade, em todos os ambientes, e a v1
sai. De um lado ficam os cartões da equipe (foto ou inicial, nome, e-mail,
função, status, sinais de 2FA e Google Agenda). Do outro, as funções do sistema
em sanfona, cada uma com o que pode e o que não pode. Arrastar alguém para uma
função (ou "Mudar função" no celular) abre um modal com o que a pessoa ganha e
o que perde; confirmar grava na API. Clicar no cartão abre o drawer com
identidade, números de carga (pacientes, programas, agenda da semana),
capacidades da função e as ações Editar, Desativar/Reativar e Excluir, cada uma
com confirmação quando destrói ou muda situação.

Busca e filtros (função, status) ficam na URL. Sem paginação: a equipe cabe na
tela. Novo e Editar continuam v1. Mestre não muda de função, não desativa e não
exclui. O último administrador ativo também não perde o papel nem a conta
ativa, para a clínica não ficar sem quem gerencia a equipe.

## Histórias de Usuário

1. Como administrador da clínica, quero ver a equipe em cartões com foto ou inicial, nome, e-mail, função, status e sinais de 2FA e Google Agenda, para reconhecer cada pessoa rápido.
2. Como administrador, quero um resumo no cabeçalho no formato "N pessoas na equipe · N ativas · N sem verificação em duas etapas", para saber o tamanho e o risco de segurança da equipe.
3. Como administrador, quero pesquisar por nome ou e-mail, para achar uma pessoa específica.
4. Como administrador, quero que a busca espere eu parar de digitar, para a lista não piscar a cada letra.
5. Como administrador, quero filtrar por uma ou mais funções (Administrador, Fisioterapeuta, Secretário(a)), para ver só um papel.
6. Como administrador, quero filtrar por status (Ativo, Inativo), para separar quem ainda acessa.
7. Como administrador, quero ver os filtros aplicados como chips, para saber o que está ligado.
8. Como administrador, quero remover um filtro pelo chip dele, para desligar só aquele.
9. Como administrador, quero um "Limpar" que zera os filtros (a busca continua no campo até eu apagar), para recomeçar o recorte.
10. Como administrador, quero ver "Nenhum filtro aplicado" quando não há chip, para não achar que algo está escondido.
11. Como administrador, quero voltar da edição e encontrar a lista com a mesma busca e os mesmos filtros, para continuar de onde parei.
12. Como administrador, quero dar F5 ou mandar o link da lista filtrada para um colega admin, para ele ver o mesmo recorte.
13. Como administrador, quero que um link com valor inválido (função desconhecida, status estranho) caia no padrão em vez de quebrar a tela.
14. Como administrador, quero ver um esqueleto de cartões enquanto a equipe carrega.
15. Como administrador, quero uma mensagem clara quando ninguém bate com os filtros, com um botão para limpar, para sair do beco sem saída.
16. Como administrador, quero uma mensagem de erro quando a lista não carrega, para não confundir erro com "não há usuários".
17. Como administrador de clínica sem ninguém além de mim, quero um convite para cadastrar a equipe, para saber o próximo passo.
18. Como administrador, quero um botão "Novo usuário" no cabeçalho (largura cheia no celular), para convidar sem procurar.
19. Como administrador no celular, quero abrir os filtros numa gaveta e ver quantas pessoas o recorte vai mostrar.
20. Como administrador num monitor grande, quero a lista à esquerda e as funções do sistema fixas à direita, até a largura do DS (1920px).
21. Como administrador no tema escuro, quero que a tela respeite o tema do DS v2.
22. Como administrador, quero abrir cada função do sistema numa sanfona e ver o que ela pode (agenda, prontuário, assinar, inativar paciente, excluir, gerenciar equipe, dados da clínica), para explicar o papel sem abrir documentação.
23. Como administrador, quero ver quantas pessoas filtradas estão em cada função, para bater com o recorte da lista.
24. Como administrador no desktop, quero arrastar uma pessoa (pelo puxador) para cima de uma função diferente, para mudar o papel sem abrir a edição.
25. Como administrador no celular, quero um "Mudar função" no cartão, porque arrastar não cabe no toque.
26. Como administrador, quero um modal de confirmação com o nome, a função de origem, a de destino e o que a pessoa ganha e perde, para não mudar o papel no escuro.
27. Como administrador, quero que confirmar a mudança grave de verdade e a lista atualize, para a tela refletir o papel novo.
28. Como administrador, quero que cancelar o modal não mude nada.
29. Como administrador, quero que o mestre não arraste, mostre a coroa no puxador e não tenha "Mudar função", para não rebaixar o dono da conta.
30. Como administrador, quero uma recusa clara (422) se eu tentar mudar a função do mestre ou do último administrador ativo pela API, para a clínica não ficar sem dono nem sem admin.
31. Como administrador, quero clicar no cartão e abrir o drawer da pessoa, para ver o detalhe sem sair da lista.
32. Como administrador, quero no drawer a foto, os selos (função, status, Mestre), o e-mail, o documento, os números de pacientes, programas e agenda da semana, os sinais de 2FA e Google Agenda e a lista do que a função pode fazer.
33. Como administrador, quero o atalho Editar no drawer, abrindo a tela v1 `/clinica/usuarios/:id/editar`, para alterar nome, e-mail, documento, foto e senha.
34. Como administrador, quero desativar ou reativar pelo drawer, com modal de confirmação com o nome da pessoa, para ela perder ou recuperar o login sem ser excluída.
35. Como administrador, quero um aviso de sucesso ou de erro depois de desativar, reativar, mudar função ou excluir.
36. Como administrador, quero o cartão da pessoa inativa esmaecido, com o selo "Inativo".
37. Como administrador, quero que o mestre não tenha Desativar habilitado, para o dono da conta não ser barrado no login.
38. Como administrador, quero excluir pelo drawer, com modal de confirmação, para tirar quem saiu da clínica.
39. Como administrador, quero que o mestre não tenha o botão Excluir.
40. Como administrador, quero que excluir o último administrador ativo seja recusado, como já é na API hoje.
41. Como fisioterapeuta ou secretária, quero ser redirecionado para o início da clínica se eu abrir `/clinica/usuarios`, porque gerenciar a equipe é só do administrador.
42. Como clínica, quero que ninguém de outra clínica liste, altere a função, desative ou exclua os meus usuários, nem chamando a API direto.

## Decisões de Implementação

**Donos e telas**

- O dado e a regra são do módulo `Clinic` (`ClinicUser`, `ClinicUserService`,
  `ClinicUserPolicy`, `ClinicUserController`). Não entra outro módulo. Os
  números de carga no drawer vêm de APIs que a clínica já tem (pacientes,
  programas, consultas da semana) e são agregados no front, como no protótipo.
- Muda só a tela `/clinica/usuarios` do SPA. `/clinica/usuarios/novo` e
  `/clinica/usuarios/:id/editar` continuam v1, inclusive o `PrototypeSwitcher`
  da edição. A rota continua atrás de `RequireClinicAdmin`.
- A tela é v2: só componentes `Ds*` e tokens `--ds-*` (skill `design-system`),
  dentro do `ClinicLayout`, com o contêiner próprio de rolagem. Nunca misturar
  com `components/ui` nesta página.
- A C substitui a v1 em todos os ambientes. Saem a tabela v1, a pasta
  `user-list-prototype` e o uso do `PrototypeSwitcher` nessa rota. O
  `PrototypeSwitcher` continua no código porque outras telas usam. A página é
  reescrita com testes; o protótipo é referência visual, não base copiada. Os
  stubs de toast ("Protótipo: ninguém foi excluído") não entram.

**Dados**

- Sem migration: `role`, `status`, `mestre`, `two_factor_confirmed_at` e
  `google_connected_at` já existem em `clinic_users`. Não há dado antigo para
  converter. (Revisto em 2026-10-20 na revisão adversária: ADR 022.) Excluir virou soft delete: uma migration
  acrescenta `deleted_at` a `clinic_users`.
- A listagem hoje seleciona só `id, name, email, role, mestre, status,
  document, photo_url`. Passa a incluir `two_factor_confirmed_at` e
  `google_connected_at`. Segredos (`two_factor_secret`, códigos, tokens do
  Google) continuam no `$hidden` do Model e não saem.
- O domain `ClinicUserSummary` já tem `twoFactorEnabled` e `googleConnected`.
  O mapper da listagem passa a preenchê-los. Se o campo faltar, assume falso.
- É dado de equipe, não de saúde. Os números de carga no drawer são
  aproximados: pacientes batem pelo nome do profissional (a entidade Patient
  da listagem não traz o id), e programas/pacientes ficam limitados à primeira
  página de 200, como no protótipo. Contadores corretos no backend ficam fora.

**Endpoints**

Nenhum endpoint novo. Contratos que mudam:

- **Alterado:** `GET /api/clinic/users`, guard `clinic`.
  - Continua `{ data: ClinicUser[] }`, lista completa da clínica, sem
    paginação.
  - Cada item passa a trazer `two_factor_confirmed_at` e
    `google_connected_at` (timestamp ou null), além dos campos que já saem.
  - 403 para fisioterapeuta e secretária (`ClinicUserPolicy::viewAny` continua
    false; admin passa pelo `Gate::before`).
  - Continua filtrado por `clinic_id` no service.
- **Alterado:** `PUT /api/clinic/users/{id}`, guard `clinic`.
  - O FormRequest deixa de exigir `document` em todo update: `document` vira
    `sometimes`, como `name` e `email`. Assim a lista manda só `{ role }` ou
    só `{ status }` sem 422.
  - Entrada parcial já prevista: `role` (`admin` | `physiotherapist` |
    `secretary`), `status` (boolean/0/1). Envelope de saída `{ data }` igual
    ao `show`.
  - 422 se o alvo é mestre e `role` não é `admin` (já existe).
  - 422 se o alvo é mestre e `status` desativa.
  - 422 se o alvo é o último administrador **ativo** e `role` sai de `admin`,
    ou se `status` o desativa. A clínica não pode ficar sem um admin que
    consegue entrar.
  - 404 se o usuário é de outra clínica (a rota já usa `authorizeResource`; o
    isolamento de show/update/destroy de outra clínica precisa continuar
    coberto por teste — hoje três casos em `ClinicUserIsolationTest` estão
    `markTestIncomplete`).
  - 403 para não-admin alterando outra pessoa. Não-admin alterando a si mesmo
    continua sem poder mandar `role` nem `status` (o service já descarta).
- **Sem mudança de contrato:** `DELETE /api/clinic/users/{id}` (mestre e último
  admin já recusados). `POST /api/clinic/users` e as rotas de foto não entram.

**Permissões**

A tela de listagem é só do administrador (`RequireClinicAdmin` /
`can.manageUsers`). Fisioterapeuta e secretária nem veem a rota.

| Ação | admin | secretary | physiotherapist | Quem decide |
|---|---|---|---|---|
| Ver a lista | sim | não (redirect) | não (redirect) | `ClinicUserPolicy::viewAny` + `Gate::before` |
| Criar | sim | não | não | `create` |
| Mudar função de outro | sim | não | não | `update` + service (mestre / último admin) |
| Desativar / reativar outro | sim | não | não | `update` + service (mestre / último admin ativo) |
| Excluir | sim, menos mestre e último admin | não | não | `delete` + service |
| Editar o próprio perfil | sim | sim (só a si) | sim (só a si) | `update` (id igual); fora desta tela |

No frontend, `can.manageUsers` e `can.delete` já existem. A tela não precisa
liberar ação por papel além do admin: quem não é admin não chega nela. O
mestre e o último admin ativo aparecem com as ações destrutivas ausentes ou
desabilitadas (coroa no puxador, sem Excluir, Desativar desabilitado), no
espírito do ADR 017. Quem protege de verdade é o backend.

**Isolamento**

- `listForClinic($clinicId)` continua filtrando por `clinic_id`.
- `update` e `delete` atuam no Model resolvido pela rota; o teste de outra
  clínica precisa deixar de ser `incomplete` e passar a exigir 404 (ou 403
  sem vazar o nome), com o banco da outra clínica intacto.
- Agregação de carga no front só usa as APIs da clínica logada (já isoladas).

**Estado da tela na URL**

A tela lê e escreve o estado na query string, por funções puras na
`application/clinic` (mesmo padrão do ADR 015, parâmetros desta lista):

```
?q=maria                         busca (vazia = ausente)
&funcao=admin,physiotherapist    só papéis válidos, sem repetição; ausente = todos
&status=ativos|inativos          um valor; ausente = ativos e inativos
```

- Valores iguais ao padrão não vão para a URL.
- Valor inválido cai no padrão e não vira chip.
- Sem `page` nem `per_page`.
- A busca atualiza a URL depois do debounce de 400ms, com `replace`. O
  "voltar" do navegador sai da lista, sem desfazer filtro por filtro.
- O campo de busca só é reescrito pela URL quando ela muda por fora e traz um
  valor diferente do digitado, ignorando os espaços das pontas (igual à lista
  de pacientes).

**Mudar função na tela**

- Desktop: puxador com `@dnd-kit/core` (já é dependência). Mestre não arrasta.
- Celular: dropdown "Mudar função" no cartão, ausente no mestre.
- Soltar na mesma função, ou cancelar o modal, não chama a API.
- O diff do modal é estático, tirado das capacidades que o protótipo já
  alinha com `permissions.ts` e com a regra da agenda (FR-012). Não vem da
  API. Admin assina "Com CREFITO"; fisioterapeuta assina; secretária não.
- Confirmar chama `PUT` só com `{ role }`. Toast de sucesso/erro da mutation
  existente (hoje fala "Usuário atualizado"; pode ficar específico: "Função
  alterada."). A query `['clinic-users']` é invalidada.

**Desativar, reativar e excluir**

- Um usuário por vez, por `DsModal` com o nome. Confirmar desativar/reativar
  manda `PUT { status }`. Excluir manda `DELETE`.
- O texto do desativar pode dizer que a pessoa perde o acesso: o login da
  clínica já barra usuário inativo (feature `006-clinic-login-ds`). (Revisto em 2026-10-20 na revisão adversária: ADR 022.)
  Só o login barrava; a sessão aberta continuava. O provider do guard `clinic`
  passou a recusar inativo em toda requisição.
- Cartão inativo esmaecido, selo "Inativo".
- Mestre: sem Excluir, Desativar desabilitado, puxador com coroa.
- Último admin ativo: as mesmas travas na tela, com 422 se a API for chamada
  direto.

**Arquitetura**

- Não há fronteira nova, evento, job nem cache. Sem ADR novo. A URL segue o
  ADR 015; a v2 no lugar da v1 segue o espírito do ADR 016; ação bloqueada
  visível segue o ADR 017.
- A troca: o `PUT` genérico já muda `role` e `status`. Não abre endpoint
  singular (`POST .../role`) porque a Policy e o service já concentram as
  recusas, e a lista só precisa de update parcial. O FormRequest alinhado ao
  `sometimes` é o que faltava para isso ser seguro de chamar.
- Capacidades da sanfona e do modal ficam no frontend (constantes da feature,
  derivadas de `permissions.ts`), não no backend: são texto de produto, não
  regra de autorização.

## Fatias Verticais

1. **Listagem com 2FA/Google e update parcial.** `listForClinic` passa a
   devolver os dois timestamps; o FormRequest de update aceita `document`
   opcional; o service recusa desativar mestre, rebaixar ou desativar o
   último admin ativo; testes de papel, de outra clínica (os três
   `incomplete` deixam de ser incomplete) e de 422. No front, o mapper da
   listagem preenche `twoFactorEnabled` e `googleConnected`. Dá para mostrar
   sozinha via API: a lista traz os sinais, e um `PUT` só com `role` funciona.
2. **A lista v2 substitui a v1 (leitura).** Funções puras de filtros na URL;
   a página nova com cartões, barra de busca/filtros, chips, gaveta no
   celular, sanfona de funções, carregamento, vazio, erro e convite para o
   primeiro colega; sinais de 2FA/Google; cartão inativo esmaecido; drawer de
   leitura com KPIs agregados no front e Editar real. Sem arrastar, sem
   desativar, sem excluir ainda. A v1, o `user-list-prototype` e o
   `PrototypeSwitcher` dessa rota saem. Dá para mostrar sozinha: a equipe
   real, filtrável, que sobrevive ao F5 e ao voltar da edição.
3. **Mudar função de verdade.** Arraste no desktop, dropdown no celular,
   modal com o diff, mutation `PUT { role }`, toast, mestre travado, último
   admin ativo travado. Depende das fatias 1 e 2.
4. **Desativar, reativar e excluir pelo drawer.** Modais, `PUT { status }` e
   `DELETE` reais, toasts, travas de mestre e de último admin ativo, cartão
   inativo com a ação virando Reativar. Depende das fatias 1 e 2.

## Testes

**Como rodam**

- Backend: `php artisan test --filter=ClinicUser` ou
  `vendor/bin/phpunit modules/Clinic/tests`.
- Frontend: `npm run test`.
- Tudo o que mudou desde a `main`: `bash bin/verificar.sh`.

**Padrões que serão copiados**

- Isolamento: `ClinicUserIsolationTest` (duas clínicas com factory,
  `RefreshDatabase`, `actingAs($user, 'clinic')`).
- Papel: `ClinicUserPolicyTest` (não-admin não lista, não cria, não apaga;
  admin pelo `Gate::before` externo) e Feature com fisioterapeuta/secretária
  recebendo 403 no `GET /api/clinic/users`.
- Service: recusas de mestre e de último admin já testáveis no Feature do
  `PUT`/`DELETE`.
- Frontend: lista de pacientes (`patient-list-filters`, chips, URL) e
  `ExercisesPage.test.tsx` (`vi.mock` do `react-router-dom`, do `useAuth` e
  dos repositórios). Repository com `vi.mock` do `apiClient`.

**O que será testado**

- Backend:
  - `GET /api/clinic/users` do admin da clínica A traz só a clínica A e inclui
    `two_factor_confirmed_at` e `google_connected_at`;
  - fisioterapeuta e secretária recebem 403 no index;
  - `PUT` só com `{ role }` (sem `document`) muda a função de um não-mestre;
  - `PUT` só com `{ status: false }` desativa um não-mestre que não é o último
    admin ativo;
  - mestre: `role` diferente de admin → 422; `status` inativo → 422; `DELETE`
    → 422;
  - último admin ativo: `role` diferente de admin → 422; `status` inativo →
    422; `DELETE` → 422 (já existe para delete);
  - com dois admins, rebaixar ou desativar um deles é 200;
  - usuário de outra clínica: `GET`/`PUT`/`DELETE` em id alheio não vazam o
    nome e não alteram o banco (os `markTestIncomplete` saem);
  - não autenticado → 401.
- Frontend, funções de filtros na URL:
  - ler e escrever `q`, `funcao`, `status`;
  - valores inválidos caem no padrão;
  - valores padrão não vão para a URL.
- Frontend, chips: cada filtro vira o chip certo; remover um chip limpa só
  aquele; "Limpar" zera função e status.
- Frontend, página: URL inicial aparece nos filtros; busca com debounce não é
  obrigatória de testar com fake timer se o parse/serialize já cobre o valor.
- Frontend, mudar função: modal abre com origem e destino; confirmar chama
  `update` com `{ role }`; cancelar não chama; mestre não tem controle de
  mudar função.
- Frontend, drawer: Editar navega para a rota v1; desativar/reativar e
  excluir abrem modal com o nome; mestre sem Excluir e com Desativar
  desabilitado.
- Mapper: timestamps viram booleanos; ausência vira `false`.
- Smoke test com evidência: a lista v2, os filtros na URL, o voltar da
  edição, mudar função com o modal, desativar e excluir como admin, o mestre
  travado, e o `PUT`/`GET` de um usuário de outra clínica pela API.

## Fora do Escopo

- **Telas Novo e Editar no DS v2.** Continuam v1. O `user-edit-prototype`
  permanece como protótipo descartável da edição, fora desta feature.
- **Pedir para ativar as duas etapas / reenviar acesso por e-mail.** Não há
  endpoint. O botão do protótipo não entra. Vai para o `DEFERRED.md` da
  feature.
- **Contadores de carga no backend** (pacientes, programas, agenda da semana
  por usuário). A agregação no front, com o limite de 200 e o match de
  paciente pelo nome, fica como está no protótipo.
- **Paginação da lista de usuários.** Equipes são pequenas; a API continua
  devolvendo a lista completa.
- **Filtro Mestre** da tabela v1. A C não tem; o mestre se reconhece pela
  coroa.
- **Endpoint singular de função ou de status** (`POST .../role`). O `PUT`
  parcial cobre.
- **Mudar o `Gate::before` que libera o admin em todas as abilities.** Fora;
  a Policy de não-admin permanece como está. (Revisto em 2026-10-20 na revisão adversária: ADR 022.) O `Gate::before`
  continua liberando o admin, mas só o admin **ativo**.
- **Capacidades calculadas no backend.** Continuam texto de produto no front.

## Notas

- O protótipo C está em `resources/js/pages/clinic/user/user-list-prototype/`
  e é a referência visual (cartões, sanfona, modal de diff, drawer). As
  variantes A (crachás) e B (quadro do dia) já tinham sido descartadas sem
  commit.
- `@dnd-kit/core` já está no `package.json`.
- O frontend é servido compilado neste ambiente: `fisio-app build` antes do
  smoke test.
- `UpdateClinicUserRequest` hoje exige `document` em qualquer `PUT`. Sem a
  fatia 1, o arraste quebra com 422 mesmo com o resto da tela pronta.
- Três testes de isolamento (`show`/`update`/`destroy` de outra clínica)
  estão `markTestIncomplete` desde a feature 001. Esta feature os fecha,
  porque passar a mudar função e status pela lista sem 404/403 de outra
  clínica seria regressão grave.
- Login de usuário inativo já é recusado (`006-clinic-login-ds`); o texto do
  modal de desativar pode afirmar que a pessoa perde o acesso. (Revisto em 2026-10-20 na revisão adversária: ADR 022.)
