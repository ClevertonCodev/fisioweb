# Lista de pacientes no design system v2

Data: 2026-10-17
Fonte: conversa de refinamento de 2026-10-17, a partir do protótipo C2 aprovado
(commit c93122b, branch `feat/clinic-pacientes-ds`).

## Problema

A lista de pacientes da clínica (`/clinica/pacientes`) ainda é a tela v1 em
tabela shadcn. O protótipo C2 no design system v2 foi aprovado, mas só aparece
em desenvolvimento, tem a inativação como stub e não tem testes. Na tela atual:

- abrir um prontuário e voltar perde a busca, os filtros e a página;
- inativar um paciente acontece num clique, sem confirmação;
- o fisioterapeuta vê "Inativar paciente" e recebe 403 ao clicar;
- não dá para saber, pela lista, quem está inativo, e não há como reativar;
- pelo `PUT` de paciente, qualquer papel consegue mudar `is_active`, passando
  por cima da regra de que só admin e secretária inativam.

## Solução

A C2 vira a lista de pacientes de verdade, em todos os ambientes, e a v1 sai.
Cada paciente é um cartão com foto ou inicial, nome, profissional, status,
diagnóstico em até 3 linhas e uma faixa de atalhos no rodapé: Programas,
Agendamentos, Editar e Inativar ou Reativar. Clicar no cartão abre o
prontuário. Em cima dos cartões fica a barra com a busca, os filtros e os
itens por página. Os filtros aplicados viram chips. Tudo fica na URL, então
voltar do prontuário ou dar F5 mantém a tela como estava.

Inativar e reativar pedem confirmação num modal e só ficam habilitados para
admin e secretária. O fisioterapeuta vê o botão desabilitado, com a explicação
no tooltip. O cartão do paciente inativo aparece esmaecido, com o selo
"Inativo". O backend passa a ser o único caminho para ativar ou inativar: o
endpoint novo de reativar tem Policy e isolamento por clínica, e o `PUT` e o
`POST` de paciente deixam de aceitar `is_active`.

## Histórias de Usuário

1. Como usuário da clínica, quero ver meus pacientes em cartões com foto ou inicial, nome, profissional responsável, status e resumo do diagnóstico, para reconhecer cada um rápido.
2. Como usuário da clínica, quero clicar no cartão e abrir o prontuário do paciente, para chegar ao registro clínico com um clique.
3. Como usuário da clínica, quero atalhos no rodapé do cartão para Programas, Agendamentos e Editar perfil, para não precisar abrir o prontuário antes.
4. Como usuário da clínica, quero ver o nome de cada atalho num tooltip, para entender o ícone sem adivinhar.
5. Como usuário da clínica, quero pesquisar por nome, e-mail ou CPF (com ou sem máscara), para achar um paciente específico.
6. Como usuário da clínica, quero que a busca espere eu parar de digitar, para a lista não piscar a cada letra.
7. Como usuário da clínica, quero filtrar por data de cadastro (intervalo), para ver quem entrou num período.
8. Como usuário da clínica, quero filtrar por situação (ativos e inativos, só ativos, só inativos), para separar quem está em acompanhamento.
9. Como usuário da clínica, quero filtrar por um ou mais status (em tratamento, em treinamento, em prevenção, alta, cancelado, óbito), para trabalhar uma fase do cuidado.
10. Como usuário da clínica, quero filtrar por um ou mais profissionais, para ver os pacientes de cada fisioterapeuta.
11. Como usuário da clínica, quero escolher 15, 30 ou 50 pacientes por página, para ajustar a lista ao meu monitor.
12. Como usuário da clínica, quero ver os filtros aplicados como chips numa linha que não muda de altura, para saber o que está ligado sem a tela pular.
13. Como usuário da clínica, quero remover um filtro pelo chip dele, para desligar só aquele filtro.
14. Como usuário da clínica, quero ver vários profissionais num chip só, com o primeiro nome de cada um (sem "Dr." ou "Dra."), para a linha de chips não estourar.
15. Como usuário da clínica, quero um "Limpar" que zera todos os filtros e volta os itens por página ao padrão, para recomeçar do zero.
16. Como usuário da clínica, quero ver "N pacientes cadastrados" sem filtro e "N pacientes encontrados" com filtro ou busca, para entender o tamanho do resultado.
17. Como usuário da clínica, quero voltar do prontuário e encontrar a lista com a mesma busca, filtros, página e itens por página, para continuar de onde parei.
18. Como usuário da clínica, quero dar F5 ou mandar o link da lista filtrada para um colega, para ele ver o mesmo recorte.
19. Como usuário da clínica, quero que um link com valor inválido (página, itens por página, status ou data estranha) caia no padrão em vez de quebrar a tela, para nunca ver uma lista em branco por causa da URL.
20. Como usuário da clínica, quero ver um esqueleto de cartões enquanto carrega, para saber que a lista está vindo.
21. Como usuário da clínica, quero uma mensagem clara quando nenhum paciente bate com os filtros, com um botão para limpar os filtros, para sair do beco sem saída.
22. Como usuário da clínica, quero uma mensagem de erro quando a lista não carrega, para não confundir erro com "não há pacientes".
23. Como usuário de clínica sem nenhum paciente, quero um convite para cadastrar o primeiro paciente, para saber o próximo passo.
24. Como usuário da clínica, quero um botão "Novo paciente" sempre visível no cabeçalho (só o "+" no celular), para cadastrar sem procurar.
25. Como usuário da clínica no celular, quero abrir os filtros numa gaveta e ver quantos pacientes o filtro vai mostrar, para filtrar com uma mão.
26. Como usuário da clínica no celular, quero trocar os itens por página fora da gaveta, para não precisar abrir os filtros só para isso.
27. Como usuário da clínica num monitor grande, quero que a tela use a largura até 1920px, para ver mais cartões por linha.
28. Como usuário da clínica no tema escuro, quero que a tela respeite o tema do DS v2, para não ter um bloco claro no meio.
29. Como admin ou secretária, quero inativar um paciente pelo cartão, para tirá-lo do acompanhamento ativo.
30. Como admin ou secretária, quero confirmar a inativação num modal com o nome do paciente, para não inativar a pessoa errada com um clique.
31. Como admin ou secretária, quero um aviso de sucesso ou de erro depois de inativar, para saber se deu certo.
32. Como usuário da clínica, quero ver o cartão do paciente inativo esmaecido e com o selo "Inativo", para distinguir quem não está mais em acompanhamento.
33. Como admin ou secretária, quero reativar um paciente inativo pelo mesmo lugar do cartão, com confirmação, para trazê-lo de volta sem mexer no cadastro.
34. Como fisioterapeuta, quero ver o botão de inativar ou reativar desabilitado, com um tooltip dizendo que só admin ou secretária podem fazer isso, para entender por que não consigo.
35. Como fisioterapeuta, quero continuar usando Programas, Agendamentos, Editar e o prontuário de pacientes inativos, para consultar o histórico.
36. Como clínica, quero que ninguém de outra clínica consiga reativar, inativar ou ver os meus pacientes, nem chamando a API direto, para proteger dados de saúde.
37. Como clínica, quero que só admin e secretária consigam mudar a situação do paciente, mesmo pela API de edição, para a regra valer de verdade e não só na tela.

## Decisões de Implementação

**Donos e telas**

- O dado e a regra de ativação são do módulo `Patient` (Model, Repository,
  Service). A API da clínica fica no módulo `Clinic`: `PatientController`,
  `PatientPolicy`, FormRequests e rotas do guard `clinic`. Isso já é assim
  hoje; o `Clinic` usa o `PatientServiceInterface`, contrato público do
  `Patient`.
- Muda só a tela `/clinica/pacientes` do SPA (área da clínica). Prontuário,
  edição, cadastro, programas e agenda não mudam.
- A tela é v2: usa só componentes `Ds*` e tokens `--ds-*` (skill
  `design-system`), dentro do `ClinicLayout`, com o contêiner próprio de
  rolagem que o protótipo usa.
- A C2 substitui a v1 em todos os ambientes. Saem a `PatientListOriginal`, a
  pasta do protótipo e o uso do `PrototypeSwitcher` nessa rota. O
  `PrototypeSwitcher` continua no código porque a agenda usa. A página é
  reescrita com testes; o código do protótipo é referência, não base copiada.
  O "Inativar" stub não é reaproveitado.

**Dados**

- Sem migration: a coluna `is_active` já existe e a listagem já devolve o
  campo (`patients.*`). Não há dado antigo para converter.
- O `Patient` do domain ganha `isActive: boolean`, mapeado do `is_active` da
  listagem. Se o campo faltar, o mapper assume ativo.
- É dado de saúde (diagnóstico aparece no cartão); nada novo sai do backend.

**Endpoints**

- **Novo:** `POST /api/clinic/patients/{id}/reactivate`, guard `clinic`.
  - Sem corpo.
  - 200 com `{ data: Patient }` (o mesmo formato do `show`) e `is_active: true`.
  - 404 se o paciente não existe ou é de outra clínica. O 404 é checado antes
    da Policy, no mesmo padrão do `update` e do `destroy`.
  - 403 se o papel não pode.
  - Reativar um paciente que já está ativo devolve 200 e não muda nada.
- **Sem mudança de contrato:** `POST /api/clinic/patients/bulk-inactivate`
  (`{ ids: number[] }` → `{ message, count }`). A tela chama com um id só.
- **Alterado:** `PUT /api/clinic/patients/{id}` e `POST /api/clinic/patients`
  deixam de aceitar `is_active`. O campo sai das regras dos dois FormRequests,
  e o que sai de `validated()` não tem mais a chave, então um `is_active`
  enviado é ignorado sem erro. Paciente novo nasce ativo pelo default da
  coluna. O payload do frontend (`toApiPayload` e o equivalente do update) e
  os DTOs de escrita da `application` também perdem o `isActive`.
- **Listagem:** `GET /api/clinic/patients` não muda. A tela manda `is_active`
  só quando a Situação não é "ativos e inativos".

**Permissões**

| Ação | admin | secretary | physiotherapist | Quem decide |
|---|---|---|---|---|
| Ver lista, filtrar, abrir atalhos | sim | sim | sim | `PatientPolicy::viewAny` (sem mudança) |
| Inativar | sim | sim | não (botão desabilitado) | `PatientPolicy::bulkInactivate` (sem mudança) |
| Reativar | sim | sim | não (botão desabilitado) | `PatientPolicy::reactivate` (novo, mesma regra; admin passa pelo `Gate::before`) |

- No frontend, o `permissions.ts` ganha `can.reactivate`, com a mesma regra do
  `can.bulkInactivate`. O cartão usa o `can` que corresponde à ação mostrada.
  O papel vem do `useAuth`, como nas outras telas. É só UX: quem protege é o
  backend.

**Isolamento**

- Reativar: o controller confere `clinic_id` do paciente contra
  `clinicId()` antes de autorizar, e o repository filtra por `clinic_id` no
  `update`, igual ao `bulkInactivate`. Defesa em duas camadas.
- Listagem e inativação já filtram por `clinic_id` no repository, e o teste de
  isolamento existente cobre os dois.

**Estado da tela na URL**

A tela lê e escreve o estado na query string, por funções puras na
`application/clinic` (ler os parâmetros da URL para um objeto de filtros e
escrever o objeto de volta). Qualquer valor inválido cai no padrão e não vira
chip:

```
?q=maria                    busca (vazia = ausente)
&situacao=ativos|inativos   ausente = ativos e inativos (padrão)
&status=alta,em_tratamento  só PatientStatus válidos
&prof=12,34                 ids de profissionais
&de=2026-01-01&ate=2026-03-31   ISO; "ate" sem "de" é ignorado
&page=2                     inteiro ≥ 1; padrão 1
&per_page=30                15 | 30 | 50; padrão 15
```

- Valores iguais ao padrão não vão para a URL.
- Mudar a busca ou um filtro volta para a página 1.
- A busca atualiza a URL depois do debounce de 400ms, e a URL é atualizada com
  `replace`. Assim, o "voltar" do navegador sai da lista, sem desfazer filtro
  por filtro.
- O `per_page` diferente do padrão aparece como chip, como no protótipo.

**Inativar e reativar na tela**

- Um paciente por vez, por um `DsModal` de confirmação com o nome do paciente.
  O botão de confirmar é `danger` para inativar e primário para reativar, e
  fica em carregamento enquanto a mutation roda. O resultado aparece num toast
  do `sonner`. Depois de dar certo, as queries de `['patients']` são
  invalidadas.
- O texto do modal não promete que o paciente perde o acesso ao app: hoje o
  `is_active` não bloqueia o login do paciente (ver Notas).
- O cartão inativo fica esmaecido, com o selo `DsBadge` "Inativo" ao lado do
  status. Todos os atalhos continuam funcionando.

**Arquitetura**

- Não há fronteira nova entre módulos, nem evento ou job, então não precisa de
  ADR. O `reactivate` entra no contrato existente do `Patient`
  (`PatientServiceInterface` e `PatientRepositoryInterface`), no mesmo formato
  de `bulkInactivate(clinicId, ...)`.
- Fica um endpoint singular para reativar e o `bulk` para inativar. A troca: o
  `bulk-inactivate` já existe e é usado; reativar em massa não foi pedido, e a
  rota singular é a mais simples de proteger e testar.

## Fatias Verticais

1. **A lista v2 substitui a v1 (leitura).** Domain com `isActive` e mapper; as
   funções puras de filtros na URL; a página nova com cartões, barra de
   filtros, chips, gaveta no celular, itens por página, carregamento, vazio,
   erro e convite para o primeiro paciente; selo "Inativo" no cartão;
   atalhos Programas, Agendamentos e Editar. O rodapé ainda sem
   inativar/reativar. A v1, o protótipo e o uso do `PrototypeSwitcher` saem.
   Dá para mostrar sozinha: a lista real, filtrável, que sobrevive ao F5 e ao
   voltar do prontuário.
2. **Inativar pelo cartão.** O quarto atalho, o modal de confirmação, a
   mutation existente com um id, o toast e o botão desabilitado com tooltip
   para o fisioterapeuta. Usa o endpoint que já existe. Depende da fatia 1.
3. **Reativar ponta a ponta.** `reactivate` no contrato e no Repository do
   `Patient`, `PatientPolicy::reactivate`, a ação no `PatientController`, a
   rota, os testes de papel e de outra clínica; no frontend, o `reactivate` do
   Repository, `useReactivatePatient`, `can.reactivate` e o cartão inativo
   trocando o atalho para "Reativar", com modal e com a mesma regra de papel.
   Depende das fatias 1 e 2.
4. **Fechar o `is_active` no PUT e no POST de paciente.** O campo sai dos dois
   FormRequests, do payload e dos DTOs de escrita do frontend, com testes de
   que o `PUT` com `is_active=false` não inativa e o `POST` com
   `is_active=false` cria ativo. Não depende das outras e pode ir antes.

## Testes

**Como rodam**

- Backend: `php artisan test --filter=Patient` ou
  `vendor/bin/phpunit modules/Clinic/tests` e `vendor/bin/phpunit modules/Patient/tests`.
- Frontend: `npm run test`.
- Tudo o que mudou desde a `main`: `bash bin/verificar.sh`.

**Padrões que serão copiados**

- Isolamento: `PatientClinicIsolationTest` (duas clínicas com factory,
  `RefreshDatabase`, `actingAs($user, 'clinic')`, `assertDatabaseHas` no
  paciente da outra clínica intacto).
- Papel: `PatientPolicyTest` (secretária pode, fisioterapeuta não, admin
  pelo `Gate::before` externo) e um teste Feature com fisioterapeuta
  recebendo 403.
- Contrato HTTP: `PatientControllerTest` (envelope `data`, validação).
- Frontend: `ExercisesPage.test.tsx` (`vi.mock` do `react-router-dom`, do
  `useAuth` e dos repositórios); `api-clinic-patients.test.ts` para o mapper e
  o `reactivate` do Repository, com `vi.mock` do `apiClient`.

**O que será testado**

- Backend:
  - admin e secretária reativam o paciente da própria clínica, com 200,
    `data.is_active = true` e o banco atualizado;
  - fisioterapeuta recebe 403 e o paciente continua inativo;
  - paciente de outra clínica dá 404 e continua inativo no banco;
  - id inexistente dá 404; não autenticado dá 401;
  - reativar paciente ativo dá 200 sem mudança;
  - `PatientPolicy::reactivate`: secretária sim, fisioterapeuta não;
  - `PUT` com `is_active=false`, mesmo de admin, não inativa; `POST` com
    `is_active=false` cria ativo.
- Frontend, funções de filtros na URL:
  - ler e escrever cada parâmetro;
  - valores inválidos (`per_page=200`, `page=0`, status desconhecido, data
    malformada, `ate` sem `de`) caem no padrão;
  - valores padrão não vão para a URL.
- Frontend, chips:
  - cada filtro vira o chip certo, e vários profissionais viram um chip com os
    primeiros nomes, sem títulos;
  - remover um chip limpa só aquele filtro;
  - "Limpar" zera tudo e volta o `per_page` ao padrão.
- Frontend, página:
  - o estado da URL inicial aparece nos filtros e nos chips;
  - mudar um filtro volta para a página 1.
- Frontend, inativar e reativar:
  - o modal abre com o nome do paciente, confirmar chama a mutation com o id
    certo e mostra o toast, e cancelar não chama nada;
  - o cartão inativo mostra o selo "Inativo" e a ação "Reativar".
- Frontend, papel:
  - o fisioterapeuta vê inativar e reativar desabilitados, com o tooltip;
  - admin e secretária veem a ação habilitada.
- Mapper: `is_active` vira `isActive`, e a ausência do campo vira `true`.
- Smoke test com evidência: a lista, os filtros na URL, o voltar do prontuário,
  inativar e reativar como secretária, o botão desabilitado como
  fisioterapeuta e o reativar de um paciente de outra clínica pela API (404).

## Fora do Escopo

- **Inativação em massa** com seleção de vários pacientes. A v1 tinha; a C2 não
  tem. Vai para o `DEFERRED.md` da feature.
- **Reativação em massa.**
- **Limite de 50 por página no backend.** O item continua no `DEFERRED.md` da
  raiz: a agenda pede `per_page=200` para o seletor de paciente.
- **Busca que diferencia maiúsculas de minúsculas no Postgres.** O `like` do
  `PatientRepository` continua como na v1. Vai para o `DEFERRED.md` da feature.
- **Bloquear o login no app do paciente inativo.** Hoje o `is_active` não tem
  efeito no acesso. É uma regra de produto separada.
- **Monitoramento e Pagamentos** nos atalhos, já ocultos na v1.
- **A autorização do `PUT` de paciente** além do `is_active`: o `update` não
  chama `authorize`, mas a Policy libera todos os papéis. Não muda nada agora.
- Mudanças em prontuário, edição, cadastro, programas e agenda.

## Notas

- O protótipo C2 está no commit c93122b. É a referência visual, e as decisões
  dele estão na mensagem do commit. O `DsFilterChips` já entrou no DS (d56e645).
- Os atalhos mantêm os destinos da v1: prontuário em
  `/clinica/pacientes/{id}`, programas em `/clinica/programas/historico` com
  `patientId` e `search`, agenda em `/clinica/agenda?patientId=` e edição em
  `/clinica/pacientes/{id}/editar`.
- O frontend é servido compilado neste ambiente: `fisio-app build` antes do
  smoke test.
- Fatia 4: conferir que nenhum teste existente manda `is_active` no `PUT` ou no
  `POST` esperando efeito. A busca de 2026-10-17 não achou nenhum.
