# Decisões · Detalhe do programa no DS v2

## Sessão 2026-10-26

Ponto de partida: o protótipo A, "Painel do programa"
(`resources/js/pages/clinic/program/program-detail-prototype/`), escolhido em
2026-10-19 e listado em `docs/prototipos-v2.md`.

Respondido pelo código (sem pergunta):

- **Onde vive** → sem módulo novo. Dono do dado: `TreatmentProgram`. SPA em `pages/clinic/program/` (pasta de tela real, não `*-prototype`).
- **Dados** → sem migration; usa `GET` do programa que a v1 já usa (`useClinicProgram` / `findClinicProgram`).
- **Ações já reais** → duplicar, transformar em modelo e excluir rascunho já gravam de verdade (feature 008, `useProgramHistoryActions`); excluir só aparece em rascunho e só o admin da clínica pode (`can.delete`).
- **WhatsApp** → no protótipo é stub. O código já monta `wa.me` com o `shareUrl` em `components/clinic/program/ProgramShareDialog.tsx`.
- **Funções de dose** → `doseParts` e `scheduleOf` vivem em `program-builder-prototype/builder.ts` (ainda protótipo); a tela real não pode importar de pasta de protótipo.

Decisões com o usuário:

- **Escopo** → corte: `/clinica/programas/:id` passa a ser só a tela A; `ProgramDetailPage` v1, o `?variant=` e a pasta `program-detail-prototype/` saem. Mesmo corte da feature 008.
- **Menu ⋯ do topo** → Copiar link, Baixar PDF, Texto para prontuário, Duplicar, Transformar em modelo, Excluir rascunho, usando as ações reais do Histórico. Não perde nada da v1.
- **WhatsApp** → `wa.me` do telefone do paciente com a mensagem e o `shareUrl` do programa, como em `ProgramShareDialog` e no prontuário. Sem telefone: botão desabilitado com a dica "Paciente sem telefone". Sem Twilio e sem job. Programa sem paciente (modelo) não mostra o botão.
- **Depois de duplicar ou excluir** → duplicar navega para `/clinica/programas/<id da cópia>`; excluir rascunho volta para `/clinica/programas/historico`, como a v1.
- **Voltar** → link "← Programas" acima do cartão do topo: volta para a tela de origem (Histórico ou prontuário); se entrou direto pela URL, vai para `/clinica/programas/historico`.
- **Rascunho** → fica só o número de exercícios; os outros três números dão lugar ao aviso "Rascunho: o paciente ainda não recebeu" com o botão "Continuar editando". WhatsApp e Copiar link ficam desabilitados no rascunho.

Respondido pelo código, depois das perguntas:

- **Quem usa** → os três papéis da clínica (`admin`, `physiotherapist`, `secretary`) veem, editam, duplicam e transformam em modelo (`TreatmentPlanPolicy`); Excluir rascunho só o admin, e os outros veem desabilitado com o motivo, como no Histórico (008).
- **Isolamento** → `TreatmentPlanController::show` devolve 404 para programa de outra clínica; a tela mostra "Programa não encontrado". O smoke test confere com um programa da outra clínica.
- **Dados de saúde** → a tela só lê o que a API já devolve; nada novo é gravado nem enviado para fora (o `wa.me` abre no aparelho de quem clicou).
- **Funções de dose** → `doseParts`, `scheduleOf` e a conta dos números do painel saem do protótipo e vão para uma função pura em `application/clinic`, com teste.

- **"Abrir programa" na gaveta do prontuário** → passa a abrir o painel (`/clinica/programas/:id`) em vez da edição, levando a origem; o "← Programas" volta ao prontuário. Editar fica a um clique dentro do painel. (Decidido durante `criar-tarefas`, depois de ver o print da gaveta.)

### Critérios de sucesso

- `/clinica/programas/:id` abre a tela A sem `?variant=`; não existe mais `ProgramDetailPage` v1 nem a pasta `program-detail-prototype/`.
- Menu ⋯ com as seis ações, todas reais; Duplicar abre a cópia; Excluir rascunho volta ao Histórico.
- WhatsApp abre `wa.me` com o `shareUrl`; desabilitado sem telefone e no rascunho; some sem paciente.
- Rascunho mostra o aviso com "Continuar editando" no lugar de três números.
- "← Programas" volta para a origem ou para o Histórico.
- Programa de outra clínica mostra "Programa não encontrado".
- Testes Vitest da página e da função pura; `docs/prototipos-v2.md` com o item marcado.

### Fora do escopo

- Assistente de programa v2 de verdade: "Editar" e "Continuar editando" levam para `/clinica/programas/:id/editar` como está hoje.
- Envio por WhatsApp pelo servidor (Twilio).
- Nome do paciente como link para o prontuário.

## Sessão 2026-10-26 (depois da implementação)

- **Voltar** → o link "← Programas" acima do cartão sai; no lugar, um botão secundário "Voltar" (com seta) à esquerda do WhatsApp, no topo do cartão. Mesma regra de destino (origem dentro de `/clinica/`, senão o Histórico). (Substitui a decisão de 2026-10-26 sobre o link "← Programas".) O usuário pediu ao ver a tela pronta.
