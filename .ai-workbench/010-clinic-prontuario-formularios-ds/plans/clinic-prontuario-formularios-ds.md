# Formulários do prontuário no DS v2

Data: 2026-10-23
Fonte: `decisoes.md` desta feature + conversa. Os desenhos vêm dos
protótipos escolhidos em `docs/prototipos-v2.md`. A 009 ligou as ações
nos overlays da v1 e deixou estes visuais de fora de propósito.

## Problema

Quem registra no prontuário v2 ainda cai na gaveta, no modal e no sheet
da v1, ou num protótipo que não grava. Nova avaliação e ficha ainda
têm a barra `?variant=`. O desenho aprovado (folha da evolução, prévia
da avaliação, ficha e laudo, escolher e prever, foto do documento) não
substitui a produção.

## Solução

As quatro ações do prontuário passam a ser as telas v2 escolhidas, em
todos os ambientes, gravando pelas APIs que já existem. A v1 desses
fluxos, a barra de protótipo e as pastas `*-prototype` de cada um saem.
Criar questionário, PDF da avaliação e avaliação por link ficam fora.

## Histórias de Usuário

1. Como admin ou fisioterapeuta, quero “Nova evolução” abrindo a Folha da evolução (modelo à esquerda, folha à direita), para registrar a sessão no desenho aprovado.
2. Como quem registra, quero escolher “Com modelo” ou “Texto livre” sem uma tela extra de escolha, para começar a escrever na hora.
3. Como quem usa modelo, quero marcar os itens e ver o texto montado ao vivo na folha, no mesmo formato que o prontuário guarda, para saber o que vou assinar.
4. Como quem usa texto livre, quero escrever direto na folha, para sessões que não cabem no modelo.
5. Como quem atende de novo, quero “Repetir a sessão” copiando os itens (ou o texto) da última evolução deste paciente, para só ajustar o que mudou.
6. Como quem ainda não terminou, quero “Salvar rascunho” gravando de verdade, para a evolução aparecer na aba Clínico sem recarregar à mão.
7. Como quem concluiu a sessão, quero “Assinar e salvar” gravando e assinando, para a evolução não mudar mais.
8. Como admin ou dono do rascunho, quero “Editar rascunho” abrindo a mesma folha preenchida, para terminar o que comecei.
9. Como secretária, quero “Nova evolução” visível e desabilitada, com o motivo no tooltip, para saber a quem pedir.
10. Como admin ou fisioterapeuta, quero “Nova avaliação” na Prévia para experimentar (lista por área, modelo indicado pelo diagnóstico, campos de verdade para mexer), para escolher o modelo mexendo nele antes de começar.
11. Como quem escolhe o modelo, quero que a prévia não grave nada, para experimentar sem criar avaliação.
12. Como quem escolheu, quero “Responder agora” criando a avaliação e abrindo a ficha, para preencher de verdade.
13. Como quem avalia, **não** quero “Enviar link”: avaliação remota não existe; só o questionário tem link.
14. Como secretária, quero “Nova avaliação” visível e desabilitada, com o motivo no tooltip.
15. Como admin ou fisioterapeuta, quero responder a avaliação na Ficha e laudo (formulário de um lado, folha do outro, abas no celular), para ver o laudo enquanto preencho.
16. Como quem preenche, quero salvar rascunho e assinar de verdade, para não perder o que marquei.
17. Como quem assinou, quero a tela virar só a folha, para reler o laudo.
18. Como quem avalia, **não** quero “Baixar PDF”: o backend não gera PDF de avaliação.
19. Como usuário da clínica, quero “Enviar questionário” na gaveta Escolher e prever (cartões com o último envio a este paciente, prévia das perguntas, prazo em chips), para mandar o pedido certo.
20. Como quem envia, quero só “Pelo celular” (`remoto`), para quem responde ser o paciente no link.
21. Como quem acabou de enviar, quero Copiar, WhatsApp e E-mail com o `share_url` de token, para mandar ao paciente sem montar o endereço.
22. Como quem não achou o modelo, quero “Criar novo” indo para `/clinica/questionarios/novo?returnTo=`, mesmo essa tela ainda sendo protótipo.
23. Como secretária, quero enviar questionário (os três papéis), como hoje.
24. Como usuário da clínica, quero “Enviar arquivo” no modal Foto do documento (fotografar ou escolher, prévia grande, tipo em chips no nome), para o exame de papel ir para o prontuário.
25. Como quem envia, quero o arquivo gravando de verdade no R2 e aparecendo na aba Arquivos, para não achar que o envio foi de mentira.
26. Como quem envia, quero recusa antes de mandar se o arquivo não for JPEG, PNG, PDF ou DOCX até 20 MB, com o motivo na tela.
27. Como usuário da clínica, quero tema claro e escuro nessas telas, só com `Ds*` e tokens `--ds-*`.
28. Como clínica A, não quero que a clínica B veja ou grave evolução, avaliação, questionário ou arquivo deste paciente.
29. Como desenvolvedor, quero as pastas de protótipo e a v1 desses fluxos fora do código, para não manter duas implementações.

## Decisões de Implementação

**Donos e telas**

- Sem módulo novo. Evolução, avaliação e arquivo: `ClinicalRecord`.
  Questionário: `ClinicQuestionnaire`. SPA na área da clínica, pastas
  de tela real (não `*-prototype`).
- Tela v2 pura: só `Ds*` e tokens `--ds-*`. Os overlays v1
  (`EvolutionFormDrawer`, `PatientFileUploadModal`, `QuestionnaireFormSheet`)
  saem do prontuário quando a fatia correspondente entregar. Confirmação
  de exclusão do prontuário continua `DsModal` (já é da 009).
- Variantes: evolução B, nova avaliação B, ficha C, questionário A,
  arquivo B. Sem `?variant=` e sem `PrototypeSwitcher` nessas rotas.

**Dados**

- Sem migration. Tipo do arquivo vai no nome (`Laudo: raio x`), porque
  a API só guarda o nome.
- Área da avaliação e indicação pelo diagnóstico continuam deduzidas
  do nome do modelo e do diagnóstico do paciente (o cadastro do modelo
  não tem especialidade).
- Texto da evolução: prévia no front no formato de
  `EvolutionService::generateText` (`**Seção:**` e uma linha por item,
  com ` — ` quando pede complemento). O POST manda `generated_text` e
  os itens marcados. Não depende do `POST .../generate-text` para a
  folha ao vivo (esse endpoint exige evolução já criada).
- Sem conversão de dado antigo.

**Endpoints** (já existem; o front passa a usá-los nestas telas)

- Evolução: `POST /api/clinic/patients/{id}/evolutions`,
  `PUT /api/clinic/evolutions/{id}`, `POST .../sign`. Guard `clinic`.
- Avaliação: `POST /api/clinic/patients/{id}/assessments`,
  `PUT /api/clinic/assessments/{id}`, `POST .../sign`.
- Questionário: `POST /api/clinic/patients/{id}/questionnaires` com
  `modality=remoto` e `share_url` no `data` (feature 009 / tarefa 002).
- Arquivo: `POST /api/clinic/patients/{id}/files` (R2, um por vez).

**Permissões (Policy que já existe; ADR 017)**

- Nova evolução e nova avaliação: admin e fisioterapeuta. Secretária
  vê o botão desabilitado (já no prontuário da 009).
- Enviar arquivo e enviar questionário: os três papéis.
- Assinar evolução ou avaliação: fisioterapeuta dono (e admin via
  `Gate::before`), como hoje.
- Isolamento: paciente de outra clínica 404 no `show`; store nasce na
  clínica de quem está logado. Sem `clinic_id` vindo da requisição.

**Fila e integrações**

- Sem job novo. WhatsApp e e-mail do questionário: `wa.me` / `mailto`.
- Upload de arquivo continua o fluxo que já manda para o R2.

**Arquitetura**

- Página / overlay não importa `apiClient`. Hooks de `application/`.
- Formulário de avaliação (muitos campos dinâmicos): estado das
  respostas como na v1, persistido pelo DTO que já existe. Título da
  evolução é um campo; o restante da folha não vira um Zod de 2+ campos
  estáticos — o modelo é dinâmico. A escolha do questionário e o arquivo
  (nome + tipo) usam estado local do overlay, como o protótipo.
- Depois de gravar: invalidar as queries daquele paciente (os hooks
  já invalidam as keys certas).
- “Criar novo” no envio de questionário aponta para a rota de criar,
  que permanece protótipo até outra feature.

## Fatias Verticais

1. **Nova evolução (Folha B).** Overlay v2 no prontuário, grava e
   assina, edita rascunho, secretária desabilitada. Sai a gaveta v1 e
   a pasta `new-evolution`. Dá para mostrar sozinha: abrir o paciente,
   registrar, ver na aba Clínico.
2. **Nova avaliação (Prévia B).** Rota `/avaliacoes/nova` vira a B em
   todos os ambientes. “Responder agora” cria e navega para a ficha
   (ainda v1/protótipo até a fatia 3). Sem “Enviar link”. Sai a v1 e
   a pasta `assessment-new-prototype`.
3. **Responder avaliação (Ficha e laudo C).** A rota de editar vira a
   C, grava rascunho e assina. Sem PDF e sem `?rascunho=`. Sai a v1 e
   a pasta `assessment-answer-prototype`.
4. **Enviar questionário (Escolher e prever A).** Overlay v2, só
   remoto, Copiar / WhatsApp / E-mail com `share_url`. Sem
   `demo-data`. Sai o sheet v1 e a pasta `new-questionnaire`.
5. **Enviar arquivo (Foto do documento B).** Overlay v2, upload real,
   tipo no nome. Sai o modal v1 e a pasta `new-file`.

A 1, a 4 e a 5 não dependem uma da outra. A 2 e a 3 são independentes
entre si (a 3 já abre pelo atalho do drawer da 009); juntas fecham a
avaliação. Ordem da lista = ordem de implementação.

## Testes

**Como rodam**

- Frontend: `npx vitest run resources/js/test/PatientRecordPage.test.tsx`
  e os testes novos de cada tela; `npm run test` no fim.
- Backend: sem teste novo se não mexer em PHP. Isolamento e papel já
  cobertos nas Policies. `bash bin/verificar.sh` no que mudou desde a
  `main`.

**Padrões que serão copiados**

- Página do prontuário: `PatientRecordPage.test.tsx` (`vi.mock` dos
  repositórios, `useAuth` com papel, `aria-disabled`).
- Função pura: o teste de montagem do texto da evolução (Vitest sem
  render), no estilo dos números da 009.
- Overlay de questionário: o teste atual de Copiar / WhatsApp / E-mail
  com `shareUrl`.
- Avaliação: `PatientListPage.test.tsx` para papel + navegação.

**O que será testado**

- Evolução: Folha abre; texto livre grava e aparece em Clínico; modelo
  monta o texto no formato do backend; assinar chama o sign; editar
  rascunho reabre a folha; secretária não abre; sem toast de protótipo.
- Avaliação nova: layout B sem barra de variante; prévia não chama
  create; “Responder agora” chama create e navega; sem “Enviar link”;
  secretária não navega.
- Ficha: salvar rascunho chama update; assinar chama sign; assinado
  mostra só a folha; sem “Baixar PDF”; outra clínica 404.
- Questionário: cartão + prazo; POST `modality=remoto`; passo Pronto
  com `share_url` de token (não id); sem “Aqui na clínica”; sem
  `demo-data`.
- Arquivo: fotografar/escolher; recusa de tipo/tamanho; POST real;
  tipo no nome; aparece em Arquivos.
- Isolamento: coberto pelos testes de Policy que já existem; a página
  do prontuário já testa 404 de outra clínica.

## Fora do Escopo

- Criar questionário (banco de perguntas).
- Página do paciente responder o questionário.
- PDF da avaliação.
- Avaliação enviada por link para o paciente.
- Campo de especialidade no cadastro do modelo de avaliação.
- Campo próprio de tipo de arquivo na API.
- “Aqui na clínica” (`presencial`) no envio de questionário.
- Modelos de evolução v2 (`/clinica/templates/evolucoes`).
- Revisão adversária conjunta da 009 (001–004): continua no final da
  009, como pedido lá.

## Notas

- O protótipo é referência visual. A tela real é reescrita com testes;
  o protótipo não é copiado linha a linha.
- A folha da evolução usa tokens de papel (`ds-white`, `ds-gray-*`) de
  propósito, como o protótipo: é uma folha, não um card semântico.
- A 009 no prontuário já desabilita evolução e avaliação para
  secretária; estas fatias não reabrem o furo.
- Branch: `feat/clinic-prontuario-formularios-ds` a partir de
  `feat/clinic-paciente-novo-ds` (a 009 ainda não está na `main`).
