# Protótipos v2 a implementar

Telas do design system v2 já prototipadas e escolhidas na branch `feat/clinic-programas-historico-ds`. Cada protótipo fica na rota real da tela, só em desenvolvimento, e `?variant=O` mostra a tela v1.

Marque `[x]` na tela quando a v2 de verdade (com testes) substituir a v1 e a pasta `*-prototype` sair do código. Os subitens são o que a implementação precisa resolver além de copiar o visual; marque cada um quando estiver resolvido.

O protótipo é referência, não código de produção: a tela real é reescrita seguindo o ciclo do projeto (`refinar` → `escrever-plano` → `criar-tarefas` → `implementar-tarefa` → `revisao-adversaria`).

---

## Programas

- [ ] **Histórico de programas** — `/clinica/programas/historico`
  - Variante A, "Histórico v2": cartões iguais aos da lista de pacientes, progresso na cor do status.
  - Código: `resources/js/pages/clinic/program/program-history-prototype/` · commits `74b9990`, `ecf614a`, `e795b4f`
  - Dados de exemplo: `TreatmentPlanHistoryDemoSeeder` (módulo TreatmentProgram).
  - [ ] Levar os filtros para a API: status derivado (visualizado ou não), profissional, validade e "criado entre". Hoje a v1 filtra só dentro da página, e o protótipo busca 200 e filtra no navegador.
  - [ ] Criar um menu de ações (kebab) no DS (`DsActionsMenu`); o protótipo usa Radix com o estilo do menu "Opções" do `DsTable`.
  - [ ] Duplicar, transformar em modelo e excluir são stub no protótipo.

- [ ] **Biblioteca de exercícios** — `/clinica/programas/exercicios`
  - Variante D, "Biblioteca v2", com rolagem infinita; modal do exercício na variante A, "Ficha clínica".
  - Código: `resources/js/pages/clinic/program/exercise-library-prototype/` · commit `139748e`
  - [ ] Mandar os filtros para a API, que já aceita `search`, `physio_area_id`, `physio_subarea_id`, `body_region_id`, `difficulty_level` e `movement_form`; hoje o front filtra só o que já carregou.
  - [ ] Filtro de favoritos e de origem (catálogo × enviados pela clínica) na API.
  - [ ] "Usar em novo programa" e "Usar em novo modelo" são stub.

- [ ] **Enviar exercício** — `/clinica/exercicios/enviar`
  - Variante A, "Seções + prévia ao lado": vídeo, informações e fotos do PDF, com prévia da biblioteca e checklist.
  - Código: `resources/js/pages/clinic/exercise-submit-prototype/` · commit `e86ad97`
  - [ ] Levar as regras de vídeo para o backend: em pé (9:16), até 20 MB, qualidade mínima. Hoje o backend aceita até 500 MB e não confere orientação nem duração (sem ffprobe), então a validação do navegador é burlável.
  - [ ] O envio é simulado no protótipo; o recorte de imagem da v1 ficou de fora.

- [ ] **Modelos de programas** — `/clinica/programas/modelos` e `/clinica/programas/meus-modelos`
  - Variante C, "Mapa do corpo": clicar na região do corpo filtra; cada modelo aparece como uma sessão dividida pelos blocos.
  - Código: `resources/js/pages/clinic/program/program-models-prototype/` · commit `dcd91d3`
  - [ ] "Nossos modelos" × "Meus modelos" como seletor na linha dos filtros, sem linha extra na caixa.
  - [ ] Região do corpo vinda do modelo ou dos exercícios (hoje é deduzida por palavras do título).
  - [ ] Listagem da API trazendo o resumo dos blocos; filtros na API.

- [ ] **Assistente de programa** — `/clinica/programas/novo` (criar, usar modelo, cópia e edição)
  - Variante A, "Três etapas": Exercícios → Montar e dosar → Paciente e envio.
  - Código: `resources/js/pages/clinic/program/program-builder-prototype/` · commit `811f7a7`
  - [ ] A escolha de exercícios usa o mesmo componente da biblioteca (`selection`).
  - [ ] "Voltar" é um botão do mesmo tamanho, ao lado do "Avançar"; início e término em dois calendários separados.

## Pacientes

- [ ] **Prontuário do paciente** — `/clinica/pacientes/:id`
  - Variante B, "Painel de acompanhamento": próxima consulta, alerta de faltas seguidas, números do tratamento, frequência de 12 meses com as cores da agenda, próximos passos e registros em abas com os quatro botões de registro juntos.
  - Código: `resources/js/pages/clinic/patient/patient-record-prototype/` · commit `0077933`
  - Decisões: [ADR 018](adr/018-prontuario-v2-busca-consultas-e-programas-por-paciente.md).
  - [ ] Filtro `patient_id` na API de consultas (com teste de outra clínica e do fisioterapeuta).
  - [ ] Front repassando `patient_id` para a API de programas (o backend já filtra).
  - [ ] Números do painel numa função pura em `application/clinic`, com teste.
  - [ ] Para o fisioterapeuta, deixar claro que os números são das consultas dele com o paciente.
  - [ ] Agendar e WhatsApp são stub. Nova evolução, enviar arquivo e enviar questionário têm protótipo próprio (abaixo).

- [ ] **Nova avaliação** — `/clinica/pacientes/:id/avaliacoes/nova`
  - Variante B, "Prévia para experimentar": lista de modelos por área, já aberta no modelo indicado pelo diagnóstico; a prévia é o formulário de verdade (escala, texto, opções) para mexer antes de começar; índice das seções ao lado.
  - Código: `resources/js/pages/clinic/patient/assessment-new-prototype/`
  - [ ] Área (especialidade) e indicação pelo diagnóstico vindas do cadastro do modelo; hoje são deduzidas do nome.
  - [ ] Decidir o "Enviar link": a avaliação respondida pelo paciente não existe no backend (só o questionário tem link).
  - [ ] "Responder agora" é stub no protótipo (na v1, cria a avaliação e abre o formulário).

- [ ] **Nova evolução** — no prontuário, botão "Nova evolução" (`?nova=evolucao`)
  - Variante B, "Folha da evolução": o modelo de um lado e, do outro, a folha como fica no prontuário (cabeçalho, texto montado ao vivo, notas e linha de assinatura); "Com modelo" e "Texto livre" num seletor; "Repetir a sessão" reaproveita a anterior.
  - Código: `resources/js/pages/clinic/patient/patient-record-prototype/new-evolution/`
  - [ ] O texto do modelo é montado no front no mesmo formato do backend (`EvolutionService::generateText`); na tela real, usar o endpoint de gerar texto ou manter as duas regras iguais.
  - [ ] Salvar rascunho e assinar são stub.

- [ ] **Enviar arquivo** — no prontuário, botão "Enviar arquivo" (`?nova=arquivo`)
  - Variante B, "Foto do documento": "Fotografar" (câmera traseira no celular) ou "Escolher arquivo"; prévia grande e o tipo em chips (Exame, Laudo, Receita…), que monta o nome.
  - Código: `resources/js/pages/clinic/patient/patient-record-prototype/new-file/`
  - [ ] O tipo vai no nome do arquivo, porque a API só guarda o nome; se virar filtro, precisa de campo próprio.
  - [ ] Envio simulado; ligar no `useUploadPatientFile`.

- [ ] **Enviar questionário** — no prontuário, botão "Enviar questionário" (`?nova=questionario`)
  - Variante A, "Escolher e prever": questionários em cartões com o último envio a este paciente, prévia das perguntas, "Pelo celular" ou "Aqui na clínica" e prazo em chips; depois de enviar, "Enviar pelo WhatsApp" e "Copiar link".
  - Código: `resources/js/pages/clinic/patient/patient-record-prototype/new-questionnaire/` (questionários de exemplo em `demo-data.ts`, só para ver a lista cheia; apagar na implementação).
  - [ ] **Segurança:** `GET` e `POST /api/questionnaires/{id}` são públicas e usam o id sequencial, sem token: qualquer pessoa responde o questionário pendente de outro paciente trocando o número. O link precisa de um token aleatório por envio.
  - [ ] Página para o paciente responder pelo link (não existe no front).
  - [ ] Enviar, WhatsApp e copiar link são stub.

- [ ] **Criar questionário** — `/clinica/questionarios/novo` (com `?returnTo=` do prontuário)
  - Variante C, "Banco de perguntas": perguntas prontas da clínica para montar com cliques, o roteiro no meio e a pergunta escolhida à direita para ajustar.
  - Código: `resources/js/pages/clinic/questionnaire-template/questionnaire-new-prototype/`
  - [ ] Banco de perguntas da clínica no backend (hoje está fixo no código); não usar escalas validadas sem o texto oficial.
  - [ ] Salvar é stub; ao salvar, voltar ao `returnTo` com a gaveta de envio aberta.

## Equipe

- [ ] **Lista de usuários** — `/clinica/usuarios`
  - Variante C, "Funções e acessos": usuários de um lado, funções em sanfona do outro; arrastar a pessoa para uma função muda a função dela.
  - Código: `resources/js/pages/clinic/user/user-list-prototype/` · commit `033fb22`
  - [ ] Tirar os sinais de verificação em duas etapas: o sistema não tem esse recurso.
  - [ ] Números de carga (pacientes, programas, agenda da semana) vindos da API de usuários.
  - [ ] Mudar função, desativar e excluir são stub.

- [ ] **Edição de usuário** — `/clinica/usuarios/:id/editar`
  - Variante A, "Crachá ao vivo": formulário e, ao lado, como a pessoa aparece no sistema (crachá, agenda, cartão do paciente e assinatura do PDF).
  - Código: `resources/js/pages/clinic/user/user-edit-prototype/` · commit `a3c0731`
  - Decisões: [ADR 019](adr/019-troca-de-senha-de-usuario-da-clinica.md).
  - [ ] Regras de senha no backend: só administrador troca a de outra pessoa, só o mestre a de outro administrador, e a do mestre ninguém além dele (no service, porque o `Gate::before` libera tudo para administrador).
  - [ ] Código de 6 dígitos por e-mail para trocar a senha, mandado a quem está logado.
  - [ ] Assinatura só para fisioterapeuta ou administrador com CREFITO.
  - [ ] Corrigir o CPF inválido da Dra. Ana Paula no seed (trava o salvar na v1 também).
