# Ações que gravam e o link do questionário

**Tipo:** História
**Plano:** `../plans/clinic-prontuario-ds.md`
**Issue:** ainda não criada

## Descrição

O painel B da tarefa 003 é só leitura. As ações rápidas ou não existem ou ainda não gravam. O envio de questionário da v1 fecha sem dar o link. O cadastro de programa não nasce com o paciente. Sem esta fatia o prontuário novo não substitui a v1 no dia a dia.

Esta fatia liga as ações aos fluxos que já gravam, põe WhatsApp no cabeçalho, abre a agenda e o programa com o paciente, e entrega Copiar / WhatsApp / E-mail com a URL de token da tarefa 002. Os desenhos v2 desses formulários continuam protótipo e fora.

## O que construir

- **Nova evolução / Enviar arquivo / Enviar questionário:** abrem os overlays da v1 que já gravam (gaveta de evolução, modal de arquivo, sheet de questionário). Depois de salvar, invalidam as queries do paciente. Secretária vê evolução e avaliação visíveis e desabilitadas (ADR 017, `can.manageClinicalRecords`).
- **Nova avaliação:** já era rota real; confirmar que atualiza o prontuário ao voltar.
- **Agendar** (cartão e próximo passo): navega para a agenda v2 com `patientId` e `openNewAppointment`, para o modal abrir com este paciente.
- **Novo programa / Prescrever:** `/clinica/programas/novo?patientId=`. A v1 passa o id ao passo de detalhes (já aceita `initialPatientId`). O builder em desenvolvimento lê o mesmo parâmetro.
- **WhatsApp do cabeçalho:** `wa.me` com o telefone. Sem telefone: `aria-disabled` e tooltip.
- **Questionário, depois do envio e no drawer pendente:** Copiar link, WhatsApp (`wa.me`) e E-mail (`mailto`), com o `shareUrl` da API — iguais ao compartilhar programa. Sem telefone ou e-mail: botão desabilitado. Sem formulário de responder na clínica.
- **Drawer, escrita da v1 que faltava:** editar rascunho de evolução (gaveta da v1); excluir rascunho de evolução (só admin) e excluir questionário ou arquivo (admin ou dono), com `DsModal`. Sem permissão: botão visível, desabilitado, com o motivo.
- **Sem job, sem Twilio, sem tela do paciente.**

## Critérios de Aceite

- [x] “Nova evolução” abre a gaveta da v1, grava e a evolução aparece na aba Clínico sem recarregar à mão (teste).
- [x] “Enviar arquivo” abre o modal da v1, grava e o arquivo aparece na aba Arquivos (teste).
- [x] “Enviar questionário” cria o envio; a tela seguinte mostra Copiar, WhatsApp e E-mail usando o `shareUrl` (token, não id) (teste).
- [x] Secretária: “Nova evolução” e “Nova avaliação” estão `aria-disabled`; clique e Enter não abrem nada (teste).
- [x] “Agendar” navega para a agenda com `patientId` e `openNewAppointment` (teste).
- [x] “Novo programa” e “Prescrever” navegam com `patientId`; o passo de detalhes da v1 já vem com esse paciente (teste do cadastro).
- [x] WhatsApp do cabeçalho abre `wa.me` com os dígitos; sem telefone fica desabilitado (teste).
- [x] Drawer de questionário pendente tem os três botões de compartilhar; o de respondido mostra respostas e **não** tem formulário de responder (teste).
- [x] Editar rascunho de evolução abre a gaveta da v1; excluir pede confirmação e some da lista (teste).
- [x] Fisioterapeuta não exclui evolução; secretária não exclui arquivo nem questionário de outro — botão desabilitado, API continua 403 (teste de página + Policy já existente).
- [x] Nenhum toast de “stub do protótipo” nas ações desta tela (teste / grep).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`) — revisão adversária das 001–004 fica para o final, como pedido.

## Depende de

- `002-token-do-questionario` (`share_url` na API).
- `003-painel-b-vira-tela-real` (a tela onde as ações moram).

## Notas de Implementação

- **Branch:** `feat/clinic-prontuario-ds`
- **Exemplo no código:** `EvolutionFormDrawer`, `PatientFileUploadModal`, `QuestionnaireFormSheet`; `AgendaPage` (`openNewAppointment` + `initialPatientId`); `ProgramShareDialog` (`wa.me` / `mailto` / copiar); `StepProgramDetails` (`initialPatientId`); lista de pacientes v2 para `aria-disabled` + tooltip (ADR 017).
- **Skills:** `design-system`, `frontend-ddd`, `frontend-react`, `frontend-testing`, `security`, `api-client`.
- Exceção consciente: overlays v1 em cima da tela v2. Não puxar o visual novo de `new-evolution` / `new-file` / `new-questionnaire`.
- O sheet de questionário da v1 hoje fecha no sucesso: acrescente o passo “Pronto” com os três botões, sem reescrever o sheet em DS.
- Confirmação de exclusão: `DsModal`, não o `AlertDialog` da v1.

## Como testar na mão

1. Admin da clínica A, paciente com telefone e e-mail. Abra o prontuário B.
2. Nova evolução: grave um rascunho, veja na aba Clínico, abra o drawer, edite, depois exclua com o modal.
3. Enviar arquivo: envie uma imagem, veja na aba Arquivos, baixe, não exclua se não for o caso.
4. Enviar questionário remoto: no sucesso, copie o link (tem o token, não `/questionnaires/12`). WhatsApp e e-mail abrem o app com o mesmo endereço. Sem telefone num outro paciente: WhatsApp desabilitado.
5. Agendar: cai na agenda com o modal de nova consulta e o paciente já escolhido. Cancele sem gravar.
6. Prescrever: o cadastro de programa já está com este paciente no passo de detalhes (v1; em dev, o builder também).
7. Secretária no mesmo paciente: evolução e avaliação desabilitadas; arquivo e questionário abrem; WhatsApp do cabeçalho funciona se houver telefone.
8. Clínica B: 404 no prontuário; POST de evolução nesse id não grava.
