# Modal de consulta v2 de produção (RHF + Zod)

**Tipo:** História
**Plano:** `../plans/agenda-v2.md`
**Issue:** ainda não criada

## Descrição

A tarefa 001 levou para produção o modal F do protótipo, mas o formulário dele
ainda é um rascunho em memória com validação manual. Esta fatia troca esse
rascunho por React Hook Form + Zod (regra do projeto para formulário com 2 ou
mais campos) e fecha o comportamento do modal: criar, editar, ver o resumo,
mudar o status, cancelar e abrir evento do Google.

## O que construir

- Só SPA (`components/clinic/agenda`). Sem backend e sem migration: os dados
  vão nos campos que já existem (`title`, `location`, `description`, início,
  término, paciente, fisioterapeuta).
- **Criar e editar:**
  - **Paciente:** busca. Não aparece em evento do Google.
  - **Local:** "Na clínica" (com sala opcional) ou "Domiciliar". É gravado como
    texto no `location`: `Clínica`, `Clínica · Sala 3` ou
    `Domicílio do paciente`. Qualquer outro texto é lido como "na clínica" com
    a sala igual ao texto.
  - **Data e horário:** data e início. Quando o início fica completo, o término
    acompanha mantendo a duração; com o horário pela metade (o campo emite a
    cada tecla), o término não muda.
  - **Duração:** a duração em minutos é a fonte de verdade do término (pode
    passar de um dia: eventos do Google e consultas antigas podem terminar
    depois da meia-noite ou em outro dia, e o modal mostra "(outro dia)").
    Atalhos 30/45/60/90 min trocam a duração (e passam da meia-noite se
    precisar). Digitar o término recalcula a duração. O dia do término é decidido
    pela duração de referência (a do evento ao abrir, ou a do último atalho),
    que a digitação não muda; corrigir o término várias vezes dá o mesmo que
    digitar o valor final. Referência curta: término depois do início fica no
    mesmo dia; antes do início é erro de digitação ("O término deve ser depois
    do início"), a não ser que a consulta já termine no dia seguinte; término
    igual ao início é sempre erro. Referência de 24 h ou mais: o término fica no
    dia em que já estava (decisão do usuário, revisão rodada 6). Salvar sem mexer em data e horário devolve
    início e término originais; com o horário mexido, manda início + duração.
  - **Fisioterapeuta:** travado no próprio usuário quando ele é fisio.
  - **Tipo de serviço:** texto livre com 5 atalhos fixos no front (Avaliação,
    Sessão, Retorno, Reavaliação, Sessão de Pilates). Nesta fatia, o atalho só
    preenche o tipo. A duração por tipo entra na 005.
  - **Observações.**
- **Validação Zod:** paciente obrigatório, exceto em evento do Google;
  fisioterapeuta obrigatório; data obrigatória; horários válidos; término
  depois do início. As mensagens aparecem no campo (`state="error"` +
  `helper`). Os campos controlados usam `Controller` e passam `field.onBlur`.
- **Consulta existente:**
  - cabeçalho na cor do status (inicial, paciente, data, horário e status);
  - aba **Resumo**, com tipo, local, fisioterapeuta, duração e observações,
    mais as pílulas de status só com as transições válidas
    (`selectableAppointmentStatuses`, sem "Cancelada");
  - botão "Cancelar consulta" à parte;
  - "Abrir prontuário";
  - aba **Editar**, que não aparece em consulta cancelada.
- **Evento do Google:** sem paciente, sem "Cancelar consulta" e sem "Abrir
  prontuário".
- Os status e o rótulo "Falta" vêm do módulo de UI da agenda v2 (001).

## Critérios de Aceite

- [ ] Salvar sem paciente, sem fisioterapeuta ou com término antes do início
      mostra a mensagem no campo e não chama a API.
- [ ] Escolher "Na clínica" com "Sala 3" grava `location` = `Clínica · Sala 3`.
      "Domiciliar" grava `Domicílio do paciente`. Ao reabrir, o modal mostra a
      opção e a sala certas.
- [ ] Mudar o início mantém a duração, inclusive digitando hora por hora. Os
      atalhos de duração ajustam o término (passando para o dia seguinte se
      precisar).
- [ ] Consulta que termina em outro dia ou depois da meia-noite: salvar sem
      mexer no horário mantém início e término intactos.
- [ ] O fisioterapeuta logado vê o campo de fisioterapeuta travado nele.
- [ ] O Resumo mostra só as transições de status válidas, e trocar o status
      atualiza o cabeçalho e o calendário.
- [ ] Uma consulta cancelada não tem a aba Editar. Um evento do Google não
      mostra paciente, cancelamento nem prontuário.
- [ ] O modal fica legível no claro e no escuro.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
      (as Policies de consulta continuam valendo no backend).
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-tela-da-agenda-v2` (Tela da agenda v2 em produção).

## Notas de Implementação

- **Branch:** `feat/clinic-agenda-ds`
- **Exemplo no código:** `pages/dev/design-system/ExampleForm.tsx` (formulário
  v2 com RHF + Zod e `Controller` nos campos Ds*), e o `ModalF`,
  `AppointmentForm` e `modal-shared` promovidos na 001.
- **Skills:** `design-system` (seção "Formulário v2"), `frontend-ddd`
  (`references/forms.md`), `frontend-react`.

## Como testar na mão

1. Como admin da clínica A, abrir "Nova consulta" e tentar salvar vazio.
2. Agendar com "Na clínica · Sala 3", 45 min, tipo "Retorno". Reabrir e
   conferir o Resumo e a aba Editar.
3. Trocar para "Domiciliar" e salvar. Conferir o local no Resumo.
4. Mudar o status para "Confirmada" e depois cancelar. Reabrir: não há
   Editar.
5. Abrir um evento importado do Google.
6. Como fisioterapeuta, abrir "Nova consulta": o fisioterapeuta vem travado.
