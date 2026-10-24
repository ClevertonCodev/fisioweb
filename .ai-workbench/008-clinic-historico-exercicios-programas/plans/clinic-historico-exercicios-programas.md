# Listagens v2 de Histórico, Exercícios e Modelos

Data: 2026-10-22
Fonte: conversa de refinamento de 2026-10-22 (skill `refinar`), a partir dos
protótipos aprovados em `docs/prototipos-v2.md` (Histórico A, Biblioteca D,
Modelos C) e da tela de demonstração em `/clinica/programas/historico`.

## Problema

O fisioterapeuta já escolheu o visual v2 das três listagens de Programas
(histórico em cartões, biblioteca de exercícios, modelos com mapa do corpo),
mas isso só aparece em desenvolvimento, atrás de `?variant=`. Em produção
continua a v1 (shadcn). Os atalhos do protótipo que alteram dado (duplicar,
virar modelo, excluir, usar exercício num programa novo) são stub. Quem usa
a clínica no dia a dia não vê o visual novo nem consegue fazer pela lista v2
o que a v1 já faz.

Há duas URLs para a mesma biblioteca de exercícios (aba Programas e item
Exercícios do menu de cima); hoje uma pode estar no protótipo e a outra na
v1, o que confunde.

## Solução

As três listagens viram telas v2 de verdade, em todos os ambientes, no
visual dos protótipos escolhidos, com dados reais da clínica. A v1 dessas
rotas sai. O seletor de variante e as pastas de protótipo dessas telas
saem. Filtros novos no backend ficam para depois: a tela filtra no
navegador o que a API ainda não filtra, como o protótipo.

Ações que a v1 já grava passam a gravar também nos cartões/menus v2.
“Usar em novo programa” e “Usar em novo modelo” abrem o assistente **v1**
já existente, com o exercício marcado; modelo = sem paciente, e ao salvar
a pessoa cai em Meus modelos.

## Histórias de Usuário

### Casca comum (Programas)

1. Como usuário da clínica, quero as abas Histórico, Exercícios e Programas no visual v2, para navegar entre as três listagens sem voltar ao menu.
2. Como usuário da clínica, quero que a aba Programas lembre se eu estava em Nossos modelos ou Meus modelos, para não perder o recorte ao trocar de aba e voltar.
3. Como usuário da clínica, quero o botão de criar programa no cabeçalho (só “+” no celular), para começar um programa de qualquer listagem.
4. Como usuário da clínica num monitor grande, quero a largura máxima do DS (1920px), para ver mais cartões por linha, igual à lista de pacientes.
5. Como usuário da clínica no tema escuro, quero tokens `--ds-*` e `ds-dark:`, para a tela não misturar com o shadcn da v1.
6. Como usuário da clínica, quero cair direto no visual novo ao abrir o link, sem barrinha de variante e sem `?variant=`.

### Histórico (`/clinica/programas/historico`)

7. Como usuário da clínica, quero ver os programas em cartões iguais aos da lista de pacientes (foto ou inicial, nome do paciente ou “sem paciente”, profissional, data, selo de situação, título, quantidade de exercícios e barra de validade na cor do selo), para reconhecer cada programa rápido.
8. Como usuário da clínica, quero clicar no cartão e abrir o detalhe do programa (tela de detalhe atual, fora desta entrega), para continuar o fluxo de hoje.
9. Como usuário da clínica, quero atalhos no rodapé do cartão para copiar o link, baixar o PDF e copiar o texto do prontuário, para as ações do dia a dia sem abrir o ⋯.
10. Como usuário da clínica, quero um ⋯ com Duplicar, Transformar em modelo e Excluir rascunho, para as ações que a v1 já faz.
11. Como usuário da clínica, quero que copiar link, PDF e texto do prontuário funcionem de verdade (mesmo backend de hoje), para não depender da v1.
12. Como usuário da clínica, quero duplicar um programa e ver a cópia na lista, para reusar um protocolo.
13. Como usuário da clínica, quero transformar um programa em modelo e encontrá-lo em Meus modelos, para reusar sem paciente.
14. Como admin da clínica, quero excluir um rascunho depois de confirmar num modal com o título, para não apagar o item errado.
15. Como fisioterapeuta ou secretária, quero ver Excluir desabilitado, com o motivo (só admin), para entender por que não consigo, no padrão da lista de pacientes.
16. Como usuário da clínica, quero que Excluir só apareça em rascunho, para não tentar apagar programa já enviado ao paciente pela lista.
17. Como usuário da clínica, quero pesquisar por paciente, título ou profissional, para achar um programa.
18. Como usuário da clínica, quero filtrar por situação derivada (não visualizado, visualizado, completou, rascunho), profissional, validade (vigente, termina em 7 dias, encerrado, sem término) e criado entre duas datas, para recortar o histórico como no protótipo.
19. Como usuário da clínica, quero os filtros aplicados em chips, com Limpar, para ver o que está ligado.
20. Como usuário da clínica no celular, quero os filtros numa gaveta, para filtrar com uma mão.
21. Como usuário da clínica, quero paginar (16, 32 ou 50 por página), para não ver uma parede de cartões.
22. Como usuário da clínica, quero o recorte de um paciente (`patientId` na URL, como o atalho do prontuário já manda), para ver só os programas daquela pessoa.
23. Como usuário da clínica, quero esqueleto enquanto carrega, estado vazio com Limpar quando o filtro não acha nada, e erro claro se a API falhar, para não confundir os três.
24. Como usuário de clínica sem nenhum programa, quero um convite para criar o primeiro, para saber o próximo passo.

### Exercícios (`/clinica/programas/exercicios` e `/clinica/exercicios`)

25. Como usuário da clínica, quero a biblioteca em grade v2 (vídeo/capa, título, especialidade, região, estrela de favorito) nas **duas** URLs, para não ter v1 num lugar e v2 no outro.
26. Como usuário da clínica, quero a URL do menu de cima **sem** as abas de Programas, para a biblioteca ocupar a tela quando vim pelo menu Exercícios.
27. Como usuário da clínica, quero rolagem infinita, para ir passando a biblioteca sem paginar no pé da página.
28. Como usuário da clínica, quero pesquisar e filtrar por especialidade, região do corpo, dificuldade e favoritos, como no protótipo, para achar o exercício.
29. Como usuário da clínica, quero que busca, especialidade, região e dificuldade vão para a API quando ela já aceitar o parâmetro, e que favoritos (e origem, se o protótipo mostrar) recortem no navegador o que a API ainda não filtra, para a lista responder mesmo sem endpoint novo.
30. Como usuário da clínica, quero marcar e desmarcar favorito pela estrela, com persistência no usuário da clínica, para achar de novo o que uso sempre.
31. Como usuário da clínica, quero abrir a ficha clínica do exercício (modal A do protótipo: vídeo, passos, fatos, dose), para avaliar o movimento sem sair da lista.
32. Como usuário da clínica, quero **Usar em novo programa** na ficha: abrir o assistente v1 com esse exercício já no programa, para não montar a lista do zero.
33. Como usuário da clínica, quero **Usar em novo modelo** na ficha: o mesmo assistente v1, **sem passo de paciente**, e ao salvar ir para Meus modelos, para guardar um protocolo a partir de um exercício.
34. Como admin da clínica, quero o botão Enviar exercício (fluxo v1 atual, fora desta entrega de visual), para continuar submetendo exercício ao catálogo.
35. Como fisioterapeuta ou secretária, quero não ver Enviar exercício se o papel de hoje já esconde, para não tomar 403.
36. Como usuário da clínica, quero esqueleto, vazio e erro equivalentes aos do Histórico.

### Modelos (`/clinica/programas/modelos` e `/meus-modelos`)

37. Como usuário da clínica, quero o seletor Nossos modelos / Meus modelos na linha dos filtros, sem linha extra, para trocar a origem sem perder a busca.
38. Como usuário da clínica, quero o mapa do corpo com a contagem por região, para começar pela queixa do paciente.
39. Como usuário da clínica, quero clicar numa região e ver só os modelos daquela queixa, para reduzir a lista.
40. Como usuário da clínica, quero aceitar que a região ainda sai do título/descrição/exercícios como no protótipo, para esta noite não travar em migration de região no modelo.
41. Como usuário da clínica, quero cada modelo como sessão (especialidade, título, resumo, barra dos blocos, fila de exercícios, ver exercícios), para comparar protocolos.
42. Como usuário da clínica, quero **Usar modelo** carregando o detalhe (grupos e exercícios) e abrindo o assistente v1 com o modelo, igual à v1, para prescrever a partir do protocolo.
43. Como usuário da clínica em Meus modelos, quero o ⋯ com Editar, Duplicar e Excluir de verdade, para manter os modelos da clínica.
44. Como usuário da clínica, quero Editar abrir o assistente/edição v1 daquele modelo, para não inventar editor nesta entrega.
45. Como usuário da clínica, quero Duplicar gerar outro modelo da clínica (sem paciente), para variar um protocolo.
46. Como admin da clínica, quero Excluir o meu modelo com confirmação, para limpar o que não uso.
47. Como fisioterapeuta ou secretária, quero Excluir desabilitado com o motivo, igual ao Histórico.
48. Como usuário da clínica, quero busca e filtro de especialidade, chips e gaveta no celular, no mesmo padrão das outras duas listagens.
49. Como usuário da clínica, quero que Nossos modelos venham do catálogo compartilhado e Meus modelos só dos planos da **minha** clínica sem paciente, para não misturar origem.

### Isolamento e papéis

50. Como clínica, quero que outra clínica não veja nem altere meus programas, modelos ou favoritos, nem pela API, para proteger dado de saúde.
51. Como clínica, quero que o catálogo Nossos modelos continue sendo o catálogo do sistema (igual hoje), sem vazar plano de paciente de outra clínica.
52. Como secretária, quero ver as três listagens e usar o que a Policy já libera (ver, duplicar, usar modelo, favoritar), para apoiar a rotina sem ganhar exclusão.

## Decisões de Implementação

**Donos e telas**

- Dono do programa/modelo da clínica: módulo `TreatmentProgram` (`TreatmentPlan`,
  listagem, duplicar, virar modelo, excluir, PDF). Não muda de dono.
- Catálogo Nossos modelos: contrato público já existente do Admin
  (`ProgramCatalogReadServiceInterface`), consumido pelo `TreatmentProgram`.
  Sem injetar Model interno do Admin.
- Biblioteca de exercícios: módulo `Admin` (catálogo) via
  `ExerciseServiceInterface`; favorito e visibilidade da clínica no módulo
  `Clinic` (`ExerciseController`, `ExerciseFavorite`), como hoje.
- SPA: área da clínica. Três listagens + a rota do menu Exercícios. Assistente
  novo/editar, detalhe do programa e enviar exercício **não** ganham visual v2
  nesta entrega; só recebem o estado de navegação necessário (“já vem este
  exercício”, “salvar como modelo”).
- Tela v2 pura: só `Ds*` e tokens `--ds-*`, dentro do `ClinicLayout`, com
  rolagem própria. Nada de `components/ui` na mesma tela.
- Um componente de casca (cabeçalho + abas) compartilhado pelas três rotas
  de Programas; a rota do menu Exercícios reusa a biblioteca **sem** essa casca.

**Dados**

- Sem migration. Sem conversão de dado antigo. Listagens já existem.
- Filtros extras do protótipo (situação derivada, validade, criado entre,
  favoritos, região do modelo pelo texto) ficam no cliente nesta entrega.
  Levar filtro para a API entra no `DEFERRED.md` da feature.
- Região do corpo no modelo continua heurística do protótipo (palavras do
  título/descrição/exercícios). Campo de região no modelo fica de fora.
- Dado de saúde: nome de paciente, título de programa, exercício. Nada novo
  sai do backend; o cartão só mostra o que a listagem já devolve.

**Endpoints (sem contrato novo; reuso)**

Guard `clinic` em todos. Envelope `data` como hoje.

- `GET /api/clinic/treatment-plans` — histórico (`search`, `status`,
  `patient_id`, `per_page`, `page`). Meus modelos: `without_patient=1`.
- `GET /api/clinic/treatment-plans/{id}` — detalhe para copiar texto, PDF
  interno, usar modelo, editar.
- `GET /api/clinic/treatment-plans/{id}/pdf` — download do PDF.
- `POST /api/clinic/treatment-plans/{id}/duplicate`
- `POST /api/clinic/treatment-plans/{id}/to-model`
- `DELETE /api/clinic/treatment-plans/{id}` — 403 se não for admin; 404 se
  outra clínica.
- `POST /api/clinic/treatment-plans` — criar (programa com paciente ou
  modelo sem paciente / rascunho).
- `PUT /api/clinic/treatment-plans/{id}` — editar modelo/programa.
- `GET /api/clinic/programs` e `GET /api/clinic/programs/{id}` — Nossos
  modelos (catálogo Admin).
- `GET /api/clinic/exercises` — `search`, `physio_area_id`,
  `physio_subarea_id`, `body_region_id`, `difficulty_level`, `movement_form`.
- `POST /api/clinic/exercises/{id}/favorite`
- `GET /api/clinic/users/professionals` — filtro de profissional no Histórico.

Nenhum endpoint novo nesta entrega. Se no meio do caminho um parâmetro da
API já existir e a tela ainda não mandar, a fatia passa a mandar (busca e
filtros que o `index` já aceita).

**Permissões**

- Ver listagens, duplicar, virar modelo, criar, editar, favoritar: qualquer
  papel da clínica autenticado (`TreatmentPlanPolicy` devolve true;
  `Gate::before` do admin da clínica não muda isso).
- Excluir: só admin da clínica (`delete` da Policy é false; admin passa no
  `Gate::before`). A tela mostra o item desabilitado com tooltip para os
  outros papéis (ADR 017).
- Enviar exercício: segue `can.manageUsers` já usado na v1 (admin da clínica).
- Backend continua fonte de verdade: esconder no front não substitui 403/404.

**Isolamento**

- `TreatmentPlan`: `clinic_id` do usuário autenticado na listagem; `show` /
  mutações comparam `clinic_id` e respondem 404 para outra clínica (padrão
  já no controller).
- Favorito: por `clinic_user_id`, não compartilhado entre clínicas.
- Exercícios visíveis: globais aprovados + envios da própria clínica
  (`visible_to_clinic_id`).
- Paciente de um programa nunca aparece na lista de outra clínica.

**Colaboração entre módulos**

- Sem fronteira nova. Clinic/TreatmentProgram/Admin continuam pelos
  contratos públicos já usados. Sem ADR de extração. Um ADR curto no estilo
  do 016: as três listagens v2 substituem a v1, sem flag e sem rota paralela.

**Fila e integrações**

- PDF: job/serviço já existente; a lista só dispara o download autenticado
  de hoje. Sem WhatsApp, R2 novo ou e-mail nesta entrega.

**Arquitetura de front**

- Domain continua `Program` e `Exercise` (camelCase). Sem `ApiXxx`.
- Hooks React Query já existentes (`useClinicPrograms`,
  `useInfiniteExercises`, `useInfiniteMyPrograms`,
  `useInfiniteClinicProgramsLibrary`, mutações de duplicar/modelo/excluir/
  favorito). Ajustar params só se a tela passar a enviar o que a API já
  aceita.
- Página reescrita com testes; protótipo é referência visual, não base
  copiada (igual à lista de pacientes).
- Menu ⋯: um `DsActionsMenu` no DS (hoje o protótipo duplica Radix). Entra
  na primeira fatia, porque Histórico e Meus modelos usam.
- Navegação para o assistente v1:
  - Usar modelo / usar em novo programa: `state.program` (já suportado).
  - Usar em novo modelo: o mesmo `state.program` mais um sinal `asModel`
    (nome a fechar na implementação). O assistente pula paciente, grava
    `patient_id` nulo e `status` rascunho, redireciona para Meus modelos.
- Filtros do Histórico: estado local + `patientId` na URL (já usado pelo
  prontuário). Persistência completa na URL (estilo ADR 015) fica no
  `DEFERRED.md`, salvo o `patientId` que já existe.
- `PrototypeSwitcher` permanece no código enquanto outras telas (agenda,
  prontuário, etc.) ainda o usam; some só destas três rotas.

## Fatias Verticais

Ordem de dependência. Cada uma dá para demonstrar sozinha.

1. **Casca v2 + menu ⋯ do DS + Histórico real**
   Abas e cabeçalho v2 nas rotas de Programas. Lista de histórico em cartões
   com dados da API, filtros locais do protótipo, paginação, `patientId` na
   URL, atalhos reais (link, PDF, texto) e ⋯ real (duplicar, virar modelo,
   excluir rascunho com Policy). Testes da página e, no backend, só se algum
   404/403 de exclusão ainda não estiver coberto. Demonstração: abrir
   `/clinica/programas/historico` sem variante, filtrar, baixar PDF, duplicar.

2. **Biblioteca de exercícios v2 nas duas URLs**
   Grade D, infinite scroll, filtros (API + favorito no cliente), ficha A,
   estrela persistida, Enviar exercício no papel certo. “Usar em novo
   programa/modelo” abre o assistente v1 com o exercício e, no caso modelo,
   sem paciente + redirect para Meus modelos. Demonstração: as duas URLs
   iguais no visual; favoritar; abrir assistente já com o exercício.

3. **Modelos com mapa do corpo**
   Seletor Nossos / Meus na linha dos filtros. Mapa + sessões com dados reais
   (catálogo vs `without_patient`). Usar modelo real. ⋯ nos Meus: editar,
   duplicar, excluir (admin). Demonstração: filtrar pelo mapa, usar um modelo
   do sistema, excluir um modelo da clínica (admin) e falhar com outro papel.

4. **Corte: v1 e protótipos saem**
   Remover `?variant=`, pastas `program-history-prototype`,
   `exercise-library-prototype`, `program-models-prototype` destas telas,
   código morto da v1 das três listagens, marcar os itens em
   `docs/prototipos-v2.md`, ADR de substituição. `bash bin/verificar.sh`
   verde. Demonstração: produção/build sem PrototypeSwitcher nessas rotas.

## Testes

**Como rodam**

- Front: `npm run test` (Vitest). Filtro pelo nome da página/hook.
- Back: `vendor/bin/phpunit modules/TreatmentProgram/tests` e
  `modules/Clinic/tests` se tocar favorito/exercício. Filtro pelo caso.
- Fecha a entrega: `bash bin/verificar.sh`.

**Padrões a copiar**

- Front: `ProgramsAndExercisesPage.test.tsx` (histórico v1, mock dos hooks),
  `ProgramasTab.test.tsx` (nossos/meus), `ExercisesPage.test.tsx` (repositório
  mockado), lista de pacientes v2 (`PatientListPage` + chips) para casca,
  chips, gaveta e ação desabilitada.
- Back: `TreatmentPlanControllerTest` (`actingAs` no guard `clinic`,
  `RefreshDatabase`, outra clínica no `to-model` e no `show`). Favorito:
  testes do `ExerciseController` da clínica, se existirem; senão o da
  listagem com `visible_to_clinic_id`.

**Comportamentos (incluindo outra clínica e papel)**

- Histórico renderiza cartões com nome, selo e não mistura shadcn.
- Filtro local esconde cartão que não casa; chip remove o filtro.
- `patientId` na URL restringe a lista.
- Duplicar e virar modelo chamam as mutações já mockáveis; excluir pede
  modal e só dispara para admin; outros papéis veem desabilitado.
- Exercícios: as duas rotas; favorito chama o toggle; ficha abre; os dois
  “Usar em…” navegam com o estado combinado (programa vs modelo).
- Modelos: troca Nossos/Meus muda a origem dos dados; Usar modelo navega
  com o detalhe; ⋯ ausente em Nossos modelos.
- Backend (se a fatia tocar o PHP): usuário da clínica B recebe 404 ao
  duplicar, virar modelo, excluir ou baixar PDF do plano da clínica A.
  Fisioterapeuta recebe 403 no `DELETE`.
- Sem teste de “região do mapa perfeita”: a heurística é provisória e
  documentada como fora de contrato rígido.

**Smoke**

- Chromium headless (`qa-navegador`) nas três URLs + `/clinica/exercicios`,
  login clínica Cleverton e um recorte na clínica Start (isolamento visual:
  não aparecer paciente/programa da outra). Evidência em
  `.ai-workbench/008-clinic-historico-exercicios-programas/evidence/<tarefa>/`.

## Fora do Escopo

- Assistente de programa v2, detalhe do programa v2, enviar exercício v2.
- Filtros novos no backend (situação derivada, validade, criado entre,
  favoritos, origem catálogo vs clínica, região persistida no modelo).
- Persistência de todos os filtros do Histórico/Exercícios/Modelos na URL
  (além de `patientId`).
- Campo `body_region` de verdade no modelo; mapa continua por texto.
- WhatsApp, copiar link mágico novo, push, PWA, app nativo.
- Área do paciente.
- Painel admin (`/admin/...`).
- Feature flag, rota `-v2` paralela, manter `?variant=O`.
- Seleção em massa da v1 do histórico, se existir.
- `DsActionsMenu` com todas as variantes de catálogo além do que Histórico
  e Meus modelos precisam (o catálogo `/design-system` ganha o mínimo para
  não ficar componente órfão).

## Notas

- Branch pedida: `feat/clinic-historico-exercicios-programas`.
- Referência visual: protótipos A / D / C; lista de pacientes v2 para casca
  (chips, gaveta, empty, skeleton, largura, tema).
- Seed: `DatabaseSeeder` + `TreatmentPlanHistoryDemoSeeder` + catálogo de
  exercícios. Clínica Start para o caso de outra clínica.
- O `PrototypeSwitcher` de outras features (agenda, prontuário, finanças)
  não se remove nesta entrega.
- Marcar os checkboxes das três listagens em `docs/prototipos-v2.md` na
  fatia 4; deixar os subitens de API/região como abertos apontando para o
  `DEFERRED.md`.
