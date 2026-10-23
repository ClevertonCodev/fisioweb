# Prontuário do paciente no design system v2

Data: 2026-10-21
Fonte: conversa de refinamento de 2026-10-21 (skill `refinar`). Protótipo B
aprovado (“Painel de acompanhamento”), ADR 018 e o modelo da lista de
pacientes (ADR 016).

## Problema

O prontuário (`/clinica/pacientes/:id`) em produção ainda é a v1. O painel B
já existe, mas só em desenvolvimento, atrás de `?variant=`, e não pode ir
para produção do jeito que está:

- consultas e programas são buscados da clínica inteira e filtrados pelo
  paciente no navegador, o que o ADR 018 proíbe;
- “Nova evolução”, “Enviar arquivo”, “Enviar questionário” e “Agendar” são
  stub, ou abrem outro protótipo que também não grava;
- o link público do questionário usa o id sequencial, sem token: quem testa
  os números lê e responde o envio de outro paciente;
- a v1 que ainda roda nos testes e em produção não tem o painel, o gráfico
  nem os próximos passos.

Quem abre o paciente não vê “como está esse acompanhamento?” e não consegue
registrar nem compartilhar pelo desenho aprovado.

## Solução

`/clinica/pacientes/:id` passa a ser só o painel B, em todos os ambientes.
A v1, o `?variant=` e a barra do protótipo saem desta rota.

O cabeçalho mostra foto, situação, idade, convênio, telefone, “Editar
cadastro”, WhatsApp e a próxima consulta. Abaixo vêm o alerta de faltas
seguidas, os quatro números, o gráfico dos últimos 12 meses, os próximos
passos e os registros em abas (Clínico, Consultas, Programas, Arquivos). A
aba fica na URL. Acima das abas há busca, só sobre evolução, avaliação,
questionário e arquivo.

Consultas e programas chegam da API já filtrados pelo paciente. Os números
do painel saem de uma função pura. O fisioterapeuta continua vendo só as
consultas dele; evoluções, avaliações, questionários, arquivos e programas
do paciente ele vê todos, mesmo que outro profissional tenha feito.

As ações que gravam reaproveitam os fluxos da v1 que já existem (evolução,
arquivo, questionário, avaliação). Agendar abre o modal da agenda v2 com o
paciente. Novo programa já nasce com este paciente. Depois de enviar um
questionário, a clínica copia o link, abre o WhatsApp ou o e-mail — o
endereço leva token, não id. A tela em que o paciente responde não entra
agora; o link já nasce no formato certo.

## Histórias de Usuário

1. Como usuário da clínica, quero abrir `/clinica/pacientes/:id` e ver o painel B, para trabalhar no prontuário novo em produção.
2. Como usuário da clínica, quero o mesmo painel no tema claro e no escuro, para usar o tema que escolhi.
3. Como usuário da clínica num monitor grande, quero a tela até 1920px, para o cabeçalho e o gráfico não ficarem estreitos.
4. Como usuário da clínica, quero voltar para a lista de pacientes pelo cabeçalho, para não perder o caminho.
5. Como usuário da clínica, quero ver foto, nome, situação, idade, convênio e telefone no cabeçalho, para reconhecer o paciente sem abrir o cadastro.
6. Como usuário da clínica, quero “Editar cadastro” no cabeçalho, para corrigir o paciente sem procurar o menu.
7. Como usuário da clínica, quero ligar para o telefone pelo cabeçalho, para falar com o paciente na hora.
8. Como usuário da clínica, quero “Chamar no WhatsApp” no cabeçalho abrindo o `wa.me` com o telefone dele, para mandar mensagem sem copiar o número.
9. Como usuário da clínica, quero o WhatsApp desabilitado, com o motivo no tooltip, quando o paciente não tem telefone, para entender por que não abre.
10. Como usuário da clínica, quero ver a próxima consulta no cabeçalho (dia, hora, profissional), para saber quando a pessoa volta.
11. Como usuário da clínica, quero um alerta quando há faltas seguidas, para não perder quem está abandonando.
12. Como usuário da clínica, quero os quatro números (sessões realizadas, comparecimento e faltas, tempo de acompanhamento, última sessão), para ver o acompanhamento de relance.
13. Como fisioterapeuta, quero um aviso de que esses números e o gráfico são das **minhas** consultas com este paciente, para não achar que estou vendo a clínica inteira.
14. Como admin ou secretária, quero que os números contem todas as consultas do paciente na janela, para ver o acompanhamento da clínica.
15. Como usuário da clínica, quero o gráfico de frequência dos últimos 12 meses, um ponto por consulta, para ver o ritmo do tratamento.
16. Como usuário da clínica, quero clicar num ponto do gráfico e abrir aquela consulta no drawer, para ir do gráfico ao registro.
17. Como usuário da clínica, quero os “Próximos passos” (rascunho pendente, reavaliar, sem programa, sem consulta), para saber o que falta fazer.
18. Como usuário da clínica, quero as abas Clínico, Consultas, Programas e Arquivos, para achar o tipo de registro sem uma lista só.
19. Como usuário da clínica, quero que a aba aberta fique na URL, para o F5 e o link mandado a um colega caírem na mesma aba.
20. Como usuário da clínica, quero um campo “Pesquisar registros” acima das abas, para achar evolução, avaliação, questionário ou arquivo pelo texto.
21. Como usuário da clínica, **não** quero que a busca mexa em Consultas nem em Programas, para o recorte da v1 continuar o mesmo.
22. Como usuário da clínica, quero clicar num registro e abrir o drawer de leitura com os dados reais, para ver o conteúdo sem sair do prontuário.
23. Como usuário da clínica, quero no drawer da evolução o texto, as condutas e o modelo, para reler a sessão.
24. Como admin ou como o fisioterapeuta dono do rascunho, quero editar o rascunho de evolução a partir do drawer, para terminar o que comecei.
25. Como admin, quero excluir o rascunho de evolução no drawer, com confirmação, para tirar o que não vale.
26. Como usuário da clínica, quero no drawer da avaliação um atalho para abrir ou continuar a avaliação na tela dela, para ver as seções do modelo.
27. Como usuário da clínica, quero no drawer do questionário as respostas de verdade (quando já respondido), para não precisar de outra tela só para ler.
28. Como usuário da clínica, **não** quero responder o questionário dentro da clínica, para quem responde ser o paciente, na área dele.
29. Como usuário da clínica, quero no drawer do arquivo a prévia (se for imagem) e o botão Baixar, para guardar o documento.
30. Como admin ou como o profissional que enviou o arquivo, quero excluir o arquivo no drawer, com confirmação, para remover o que foi por engano.
31. Como usuário da clínica, quero no drawer da consulta dia, horário, profissional, situação e “Ver na agenda”, para ir do prontuário ao calendário.
32. Como usuário da clínica, quero no drawer do programa os exercícios, o que o paciente fez e “Abrir programa”, para continuar a prescrição.
33. Como usuário da clínica, quero um esqueleto enquanto o paciente carrega, para não achar que a tela quebrou.
34. Como usuário da clínica, quero “Paciente não encontrado” quando o id não existe ou é de outra clínica, para voltar à lista sem dado vazado.
35. Como usuário da clínica, quero que o erro de uma lista (evoluções, consultas, etc.) não derrube o resto da tela, para eu continuar vendo o que veio.
36. Como usuário da clínica, quero os “Próximos passos” quando o paciente ainda não tem registro, para saber por onde começar.
37. Como admin ou fisioterapeuta, quero “Nova evolução” abrindo a gaveta da v1 que já grava, para registrar a sessão de verdade.
38. Como secretária, quero “Nova evolução” e “Nova avaliação” visíveis e desabilitadas, com o motivo no tooltip, para saber a quem pedir.
39. Como admin ou fisioterapeuta, quero “Nova avaliação” indo para a rota real de nova avaliação deste paciente, para não cadastrar no paciente errado.
40. Como usuário da clínica, quero “Enviar arquivo” abrindo o modal da v1 que já grava no R2, para o arquivo aparecer na aba.
41. Como usuário da clínica, quero “Enviar questionário” abrindo o fluxo da v1 que já cria o envio, para o paciente receber o pedido.
42. Como usuário da clínica, quero, depois de enviar o questionário, copiar o link, abrir o WhatsApp ou o e-mail, já com a URL de token no texto, para mandar ao paciente sem montar o endereço na mão.
43. Como usuário da clínica, quero o WhatsApp e o e-mail desabilitados quando o paciente não tem telefone ou e-mail, para entender por que não abre.
44. Como usuário da clínica, quero os mesmos três botões no drawer de um questionário ainda pendente, para reenviar o link depois.
45. Como clínica, quero que o link seja `/{slug da clínica}/paciente/questionarios/{token}`, para ninguém achar o envio pelo id 1, 2, 3.
46. Como clínica, quero que `GET /api/questionnaires/{id numérico}` deixe de devolver o questionário, para o furo do id sequencial fechar.
47. Como clínica, quero a API pública pronta para achar o envio pelo token, para a tela do paciente, quando existir, já ter o contrato.
48. Como usuário da clínica, quero “Agendar” abrindo a agenda v2 já no modal de nova consulta, com este paciente escolhido, para não achar o paciente de novo.
49. Como usuário da clínica, quero “Novo programa” e o passo “Prescrever” abrindo o cadastro de programa já com este paciente, para não escolher a pessoa outra vez.
50. Como usuário da clínica, quero que, depois de salvar evolução, arquivo, questionário ou voltar de avaliação e programa, o prontuário atualize sozinho, para eu ver o que acabei de criar.
51. Como fisioterapeuta, quero ver evoluções, avaliações, questionários, arquivos e programas feitos por outro profissional deste paciente, para o prontuário ser do paciente, não da minha agenda.
52. Como fisioterapeuta, **não** quero ver no painel as consultas que outro profissional agendou com este paciente, para a regra da agenda continuar valendo.
53. Como clínica, quero que ninguém de outra clínica veja este prontuário nem as consultas e programas deste paciente, nem chamando a API com o id, para proteger dado de saúde.
54. Como desenvolvedor, quero que produção, desenvolvimento e teste mostrem a mesma tela B, para não manter duas implementações.

## Decisões de Implementação

**Donos e telas**

- O prontuário é tela da área da clínica. Não nasce módulo novo.
- Consultas: módulo `ClinicScheduling` (dono do `patient_id` no index). O
  prontuário não lê internals desse módulo; usa o endpoint que já é o
  contrato da agenda.
- Programas: módulo `TreatmentProgram`. O `patient_id` no list já existe; só
  o front passa a mandar.
- Evolução, avaliação e arquivo: módulo `ClinicalRecord`, pelos endpoints
  que o paciente já tem.
- Questionário: módulo `ClinicQuestionnaire` (token, URL pública, envio).
- Cadastro de programa: a tela `/clinica/programas/novo` (v1 em produção,
  builder em desenvolvimento) passa a ler o paciente da URL.
- A tela do prontuário é v2 pura (`Ds*` e tokens `--ds-*`) no
  `ClinicLayout`. Os fluxos que gravam nesta entrega são os da v1
  (gaveta de evolução, modal de arquivo, sheet de questionário). Ficam
  sobrepostos à tela v2; não misturam `components/ui` no layout do
  painel. Confirmação de exclusão usa `DsModal`.
- A B substitui a v1 em todos os ambientes, sem flag e sem rota paralela.
  Saem a v1 deste arquivo, o `PrototypeSwitcher` desta rota e o código do
  protótipo que virou tela. As pastas `new-evolution`, `new-file` e
  `new-questionnaire` **ficam** onde estão, como protótipo, até a feature
  de cada uma.
- Peças do B vão para uma pasta de tela de verdade (não “prototype”). O
  hook de “abaixo de sm” sai do protótipo da biblioteca de exercícios e
  vai para os hooks comuns; o `useIsMobile` de 768px (shadcn) não é este.

**Dados**

- Consultas e programas: sem migration. Sem conversão de dado antigo.
- Questionário: migration no `ClinicQuestionnaire` com `public_token`
  (UUID, único). Envio novo já nasce com token. Envio antigo ganha token
  na própria migration (backfill). É dado de saúde; o token não é o id.
- A URL de compartilhar segue o programa:

  `{APP_URL}/{slug}/paciente/questionarios/{public_token}`

- A página atrás dessa URL **não** é desta feature. O endereço já nasce
  pronto.

**Endpoints**

- **Alterado:** `GET /api/clinic/appointments`, guard `clinic`.
  - Ganha `patient_id` (inteiro positivo).
  - Continua com `from`, `to`, `clinic_user_id`, `status`.
  - O `to` comparado com `starts_at <= to` exige meia-noite do dia
    seguinte ao último dia da janela (ADR 018).
  - `patient_id` de outra clínica, ou inexistente: lista vazia, nunca 403
    nem 404.
  - Fisioterapeuta: o service continua forçando o `clinic_user_id` dele.
- **Alterado no front só:** `GET /api/clinic/treatment-plans` já filtra
  `patient_id`. O front passa a mandar. Sem inflar `per_page` para
  contornar. Se o paciente tiver mais de uma página, o hook pede as
  páginas seguintes; o tamanho da resposta depende do paciente.
- **Alterado:** envio e leitura de questionário da clínica passam a
  devolver `public_token` e `share_url` no envelope `data`.
- **Alterado:** `GET /api/questionnaires/{token}` e
  `POST /api/questionnaires/{token}/answer` (rotas públicas, sem guard).
  - A busca é pelo token, não pelo id.
  - Id numérico, token inexistente ou envio de outra forma inválida: 404.
  - O POST público continua existindo para a tela futura; esta feature
    não constrói essa tela. O GET por token já responde o contrato, para
    o link não nascer morto no backend.

**Permissões (Policy que já existe; o front espelha, ADR 017)**

- Ver o prontuário: qualquer papel da clínica. Paciente de outra clínica:
  404.
- Nova evolução e nova avaliação: admin (`Gate::before`) e fisioterapeuta.
  Secretária vê o botão desabilitado.
- Enviar arquivo, enviar questionário, agendar, novo programa, editar
  cadastro: os três papéis, como hoje.
- Excluir rascunho de evolução: só admin.
- Excluir questionário ou arquivo: admin, ou o fisioterapeuta dono.
  Sem permissão: botão visível, desabilitado, com o motivo.
- Responder questionário pela rota autenticada da clínica **não** ganha
  botão no prontuário novo. Quem responde é o paciente, na área dele.

**Isolamento**

- Paciente: o `show` da clínica já isola; 404 para outra clínica.
- Consultas: `forClinic` + `patient_id` no `listForCalendar`. Lista vazia
  para id de outra clínica.
- Programas: filtro de `patient_id` que o `TreatmentPlan` já aplica com
  a clínica do usuário.
- Questionário público: só o token acha o envio. Sem token não há
  enumeração.

**Colaboração entre módulos**

- Sem contrato novo entre Clinic e ClinicScheduling. O filtro fica no
  dono das consultas (alternativa descartada no ADR 018: rota aninhada
  `/patients/:id/appointments` no Clinic).
- Sem endpoint de resumo (`care-summary`). Os números são função pura no
  `application/clinic`, a partir da lista já filtrada.
- Token e URL do questionário ficam no `ClinicQuestionnaire`. O front só
  mostra o `share_url` que a API devolve.

**Fila e integrações**

- Sem job novo. WhatsApp do cabeçalho e do questionário: `wa.me`. E-mail
  do questionário: `mailto`. Sem Twilio e sem e-mail pelo servidor.
- Upload de arquivo continua o fluxo que já manda para o R2.

**Arquitetura e ADRs**

- ADR 018 (já existe): cumprir inteiro. Não filtrar paciente no
  navegador, nem aumentar `per_page` ou a janela para contornar.
- ADR novo (próximo número livre): o painel B substitui a v1 de vez, no
  mesmo espírito do ADR 016. Sem flag, sem rota paralela.
- ADR novo: o link público do questionário passa a ser token, não id.
  Isso atualiza a decisão da feature de isolamento, que ia **apagar**
  a rota pública: a rota fica, mas só responde a token.
- `permissions.ts` ganha só o que faltar para espelhar exclusão de
  arquivo e questionário (dono ou admin). Evolução já cabe no `can.delete`
  (admin).

**Front: dados e ações**

- Hook `usePatientAppointments(patientId, janela)`: 12 meses para trás e
  6 para frente; `to` = meia-noite do dia seguinte.
- Hook de programas do paciente manda `patientId` e junta as páginas.
- `toStats` (comparecimento, faltas seguidas, próxima, última, tempo de
  acompanhamento, programa ativo) vira função pura testada. Não calcula
  dentro do componente.
- Página não importa `apiClient`. Só hooks de `application/`.
- Agendar: `navigate('/clinica/agenda?patientId=:id', { state: { openNewAppointment: true } })`.
  A agenda v2 já abre o modal com `initialPatientId`.
- WhatsApp do cabeçalho: `wa.me` com os dígitos do telefone.
- Novo programa: `/clinica/programas/novo?patientId=:id`. A v1 passa
  `initialPatientId` para o passo de detalhes (já aceita). O builder em
  desenvolvimento lê o mesmo parâmetro.
- Depois de gravar: invalidar as queries daquele paciente (evoluções,
  arquivos, questionários, programas, consultas).
- Questionário remoto, depois do POST e no drawer pendente: Copiar,
  WhatsApp e E-mail, iguais ao compartilhar programa.

## Fatias Verticais

1. **Consultas e programas por paciente, e os números.** `patient_id` no
   index de consultas (validação, `listForCalendar`, `forClinic`),
   `AppointmentListParams` / `ProgramListParams` no front, os dois
   repositórios mandando o query param, hook do prontuário, função pura
   dos números com teste. Dá para mostrar sozinha: a API devolve só as
   consultas daquele paciente, e os números batem com um fixture.
2. **Token do questionário.** Migration com backfill, token no envio,
   `share_url` na resposta da clínica, API pública só por token (id
   numérico = 404). Dá para mostrar sozinha: o POST de envio devolve a
   URL com token, e o GET público com `1` não lê mais o envio.
3. **O painel B vira a tela de verdade (leitura).** Pasta de tela real,
   sem `?variant=` e sem v1 nesta rota. Cabeçalho, números, gráfico,
   próximos passos, abas na URL, busca dos quatro tipos, drawer de
   leitura (respostas e download), esqueleto, 404, erro parcial, vazio.
   Usa a fatia 1. Dá para mostrar sozinha: abrir o paciente e ler o
   prontuário B em qualquer ambiente.
4. **Ações que gravam e o link.** Gaveta/modal/sheet da v1, invalidar
   queries, Agendar, WhatsApp do cabeçalho, programa com paciente,
   Copiar / WhatsApp / E-mail com o `share_url` da fatia 2, editar
   rascunho e excluir no drawer (ADR 017). Depende das fatias 2 e 3.

A fatia 2 não depende da 1. A 3 depende da 1. A 4 depende da 2 e da 3.

## Testes

**Como rodam**

- Backend: `php artisan test --filter=Appointment` e
  `--filter=Questionnaire`; ou
  `vendor/bin/phpunit modules/ClinicScheduling/tests` e
  `vendor/bin/phpunit modules/ClinicQuestionnaire/tests`.
- Frontend: `npm run test`.
- O que mudou desde a `main`: `bash bin/verificar.sh`.

**Padrões que serão copiados**

- Consultas: `AppointmentIndexVisibilityTest` (`RefreshDatabase`,
  `actingAs($user, 'clinic')`, duas clínicas, admin vs fisioterapeuta).
- Questionário: `PatientQuestionnaireControllerTest` e
  `PatientQuestionnaireIsolationTest` (envelope `data`, 404 de outra
  clínica).
- Front, função pura: o teste de formatação / stats que já existe no
  SPA (Vitest sem render).
- Front, página: `PatientListPage.test.tsx` (`vi.mock` de hooks e
  `useAuth`, papel, `aria-disabled`).
- Front, mapper: `api-clinic-appointments.test.ts` e
  `api-clinic-patient-questionnaires.test.ts`.
- Compartilhar: o diálogo de programa (wa.me / mailto / copiar).

**O que será testado**

- Backend, `patient_id` das consultas (ADR 018):
  - paciente da própria clínica: só as consultas dele;
  - paciente de outra clínica: lista vazia, 200, sem 403/404;
  - fisioterapeuta: só as consultas dele com aquele paciente;
  - `patient_id` inválido: 422.
- Backend, questionário:
  - envio novo nasce com `public_token` e `share_url` no `data`;
  - envio antigo, depois da migration, tem token;
  - `GET /api/questionnaires/1` (id) → 404;
  - `GET /api/questionnaires/{token}` do envio pendente → 200;
  - token inexistente → 404;
  - usuário de outra clínica não lê o envio pela API da clínica.
- Frontend, números:
  - comparecimento, faltas, faltas seguidas, próxima, última, tempo de
    acompanhamento e programa ativo, com lista já filtrada (incluindo
    lista vazia e só canceladas).
- Frontend, repositórios:
  - `list` de consultas manda `patient_id`;
  - `list` de programas manda `patient_id`;
  - questionário mapeia `public_token` e `share_url`.
- Frontend, página:
  - 404 quando o paciente não vem;
  - esqueleto no carregamento;
  - erro de uma lista não esconde o resto;
  - aba na URL (`?tab=arquivos` abre Arquivos);
  - busca filtra os quatro tipos e não some com consulta;
  - secretária vê evolução e avaliação `aria-disabled`;
  - WhatsApp do cabeçalho sem telefone não abre `wa.me`;
  - Agendar navega com `patientId` e `openNewAppointment`;
  - Novo programa navega com `patientId`;
  - depois de “enviar questionário”, os três botões usam o `share_url`
    (e não um id).
- Isolamento no smoke: clínica B não vê o paciente da A (404) e a lista
  de consultas da B com o id da A vem vazia.

## Fora do Escopo

- Os **desenhos v2** de nova evolução (B, “Folha da evolução”), enviar
  arquivo (B) e enviar questionário (A). Os botões entram; o visual novo
  desses três formulários não. Cada um vira feature própria. As pastas
  de protótipo ficam.
- A **tela do paciente** responder o questionário (área do paciente /
  rota pública). O link com token nasce; a página não.
- Fisioterapeuta ver no painel as **consultas** que outro profissional
  agendou com o mesmo paciente. Evoluções, avaliações, questionários,
  arquivos e programas do paciente ele já vê.
- Envio real de WhatsApp (Twilio) ou de e-mail pelo servidor.
- Endpoint de resumo (`/patients/:id/care-summary`).
- Persistência de mais estado na URL além da aba (busca, drawer aberto).
- Trocar a avaliação e o cadastro de programa para v2. Só o paciente
  pré-selecionado no cadastro de programa.

## Notas

- O protótipo B é a referência visual. A página é reescrita com testes;
  o protótipo não é base copiada linha a linha.
- Exceção consciente à regra “v2 não mistura v1”: as ações que gravam
  nesta entrega são os overlays da v1. Os desenhos v2 deles estão no
  `DEFERRED.md`.
- O `historyForPatient` da agenda (modal) já mostra ao fisioterapeuta as
  consultas dos colegas de quem ele atende. O painel do prontuário **não**
  usa esse endpoint; usa o index com `patient_id`. Não mudar o histórico
  do modal nesta feature.
- A v1 da busca e das abas usava `?tab=questionnaires` etc. Os nomes
  novos são os do B (`clinico`, `agenda`, `programas`, `arquivos`). Link
  antigo da v1 cai na aba Clínico (padrão), sem mapa de compatibilidade.
- `bin/verificar.sh` precisa passar antes de chamar a revisão.
