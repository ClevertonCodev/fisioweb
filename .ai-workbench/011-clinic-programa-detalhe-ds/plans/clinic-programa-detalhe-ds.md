# Detalhe do programa no DS v2

Data: 2026-10-26
Fonte: `decisoes.md` da feature (sessão 2026-10-26), protótipo A "Painel do
programa" (`docs/prototipos-v2.md`) e a conversa de planejamento.

## Problema

Ao abrir um programa em `/clinica/programas/:id`, o fisioterapeuta ainda cai na
tela v1 (shadcn), que destoa do Histórico, do prontuário e da navbar, que já são
v2. O painel escolhido (variante A) só existe como protótipo atrás do
`?variant=`, em desenvolvimento, com o WhatsApp falso e sem PDF, texto para
prontuário e copiar link no menu. Também não há um jeito claro de voltar para a
lista de onde se veio.

## Solução

`/clinica/programas/:id` passa a ser o "Painel do programa" de verdade. No topo
ficam o paciente, o profissional, o status, a barra de validade e a mensagem.
Embaixo vêm quatro números (exercícios, dias que faltam ou desde quando
terminou, vezes que completou, quando o paciente abriu) e os grupos com cada
exercício em cartão, a dose em pedaços, os dias e o período, com o vídeo num
modal. Os botões do topo são WhatsApp (abre a conversa com o paciente já com o
link do programa), Editar e o menu ⋯ com as seis ações reais. O rascunho troca
três números por um aviso com "Continuar editando". Um link "← Programas" volta
para o lugar de onde a pessoa veio. A tela v1, o protótipo e o `?variant=` saem.

## Histórias de Usuário

1. Como fisioterapeuta, quero abrir um programa pelo Histórico e ver o painel v2 sem precisar de `?variant=`, para trabalhar no visual escolhido.
2. Como fisioterapeuta, quero ver no topo a foto e o nome do paciente e com quem ele está, para saber de quem é o programa.
3. Como fisioterapeuta, quero ver o título e o status (não visualizado, visualizado, completou com quantas vezes, rascunho), para saber em que pé o paciente está.
4. Como fisioterapeuta, quero ver a validade em barra, com início, fim e quanto falta ou desde quando terminou, para saber se preciso renovar.
5. Como fisioterapeuta, quero ver a mensagem que mandei ao paciente, para lembrar da orientação dada.
6. Como fisioterapeuta, quero ver quantos exercícios o programa tem, para ter a dimensão do programa.
7. Como fisioterapeuta, quero ver quantos dias faltam, "Terminou há N dias" ou "Sem fim", para acompanhar a validade sem fazer conta.
8. Como fisioterapeuta, quero ver quantas vezes o paciente completou o programa, para medir a adesão.
9. Como fisioterapeuta, quero ver em que data o paciente abriu o programa, ou "Ainda não", para saber se ele recebeu.
10. Como fisioterapeuta, quero ver os exercícios separados por grupo, com o nome do grupo e quantos exercícios tem, para entender a estrutura.
11. Como fisioterapeuta, quero ver em cada exercício o número da ordem, o nome, a miniatura e a dose em pedaços (séries, repetições, carga, descanso), para conferir a prescrição de relance.
12. Como fisioterapeuta, quero ver em cada exercício os dias e o período ("Seg, Qua, Sex · Manhã" ou "Todos os dias"), para saber quando o paciente faz.
13. Como fisioterapeuta, quero ver a observação de cada exercício quando houver, para lembrar do detalhe combinado.
14. Como fisioterapeuta, quero tocar na miniatura e ver o vídeo num modal, para conferir o exercício sem sair da tela.
15. Como fisioterapeuta, quero ver "Este exercício não tem vídeo" no modal quando não há vídeo, para não ficar olhando uma tela preta.
16. Como fisioterapeuta, quero tocar em WhatsApp e abrir a conversa com o paciente com a mensagem e o link do programa prontos, para reenviar sem copiar e colar.
17. Como fisioterapeuta, quero ver o WhatsApp desabilitado com a dica "Paciente sem telefone" quando o paciente não tem telefone, para entender por que não funciona.
18. Como fisioterapeuta, quero ver o WhatsApp desabilitado num rascunho, para não mandar um programa que o paciente ainda não recebeu.
19. Como fisioterapeuta, quero não ver o WhatsApp num programa sem paciente, porque não há para quem mandar.
20. Como fisioterapeuta, quero tocar em Editar e ir para a edição do programa, para ajustar a prescrição.
21. Como fisioterapeuta, quero copiar o link do programa pelo menu ⋯, para mandar por outro canal.
22. Como fisioterapeuta, quero ver Copiar link desabilitado no rascunho e no programa sem paciente, para não copiar um link que não leva a lugar nenhum.
23. Como fisioterapeuta, quero baixar o PDF do programa pelo menu ⋯, para imprimir ou mandar por e-mail.
24. Como fisioterapeuta, quero copiar o texto para o prontuário pelo menu ⋯, para colar na evolução.
25. Como fisioterapeuta, quero duplicar o programa e cair direto na cópia, para começar outro programa a partir deste.
26. Como fisioterapeuta, quero transformar o programa em modelo pelo menu ⋯, para reaproveitar com outros pacientes.
27. Como admin da clínica, quero excluir um rascunho pelo menu ⋯ depois de confirmar e voltar ao Histórico, para limpar o que não vai ser usado.
28. Como fisioterapeuta ou secretária, quero ver Excluir rascunho desabilitado com o motivo (só o admin), igual ao Histórico, para entender por que não consigo.
29. Como qualquer papel, quero não ver Excluir num programa que já foi enviado, porque só o rascunho pode ser excluído.
30. Como fisioterapeuta, quero que um rascunho mostre só o número de exercícios e o aviso "Rascunho: o paciente ainda não recebeu", em vez de números que não dizem nada.
31. Como fisioterapeuta, quero tocar em "Continuar editando" no aviso do rascunho e ir para a edição, para terminar e enviar.
32. Como fisioterapeuta, quero tocar em "← Programas" e voltar para o Histórico com os mesmos filtros, ou para o prontuário do paciente, conforme de onde vim.
33. Como fisioterapeuta, quero que "← Programas" leve ao Histórico quando abri o programa direto pela URL, para nunca ficar sem saída.
34. Como fisioterapeuta, quero que, depois de duplicar, "← Programas" na cópia continue voltando para o lugar de onde vim.
35. Como clínica, quero ver "Programa não encontrado" ao tentar abrir um programa de outra clínica, sem nenhum dado dele aparecer.
36. Como fisioterapeuta, quero ver um esqueleto enquanto o programa carrega, sem a tela piscar.
37. Como secretária, quero ver o programa e usar o que a Policy libera (WhatsApp, PDF, texto, link, duplicar, modelo, editar), para apoiar a rotina.
38. Como fisioterapeuta no celular, quero que o topo, os números (dois por linha) e os exercícios (um por linha) caibam sem rolagem lateral.
39. Como fisioterapeuta no tema escuro, quero que o painel use as cores do DS, sem bloco branco.
40. Como fisioterapeuta, quero que a mensagem do WhatsApp seja a mesma de quando salvo o programa, para o paciente reconhecer.

## Decisões de Implementação

- **Dono e telas:** o módulo `TreatmentProgram` já entrega tudo. Muda só o SPA:
  a tela do detalhe do programa da clínica sai do protótipo e vira uma pasta de
  tela real em `pages/clinic/program/` (sem sufixo `-prototype`). O cartão do
  Histórico e o botão "Abrir programa" da gaveta de programa do prontuário
  passam a abrir o painel informando a origem (a gaveta hoje leva à edição).
- **Sem migration e sem endpoint novo.** A tela usa os endpoints que já existem
  no guard `clinic`: `GET /clinic/treatment-plans/{id}` (envelope `data`, 404
  para outra clínica), o PDF, `POST .../duplicate` (devolve a cópia no
  envelope `data`), `POST .../to-model` e `DELETE`. O loader da rota continua
  pré-carregando `['clinic-programs', id]` com `findClinicProgram`.
- **Permissões:** quem decide é a `TreatmentPlanPolicy`: ver, editar, duplicar
  e transformar em modelo valem para os três papéis; excluir só para o admin,
  via `Gate::before`. O front só esconde e desabilita: Excluir aparece só em
  rascunho, desabilitado com o motivo quando `can.delete(role)` é falso, pelo
  mesmo `ProgramActionsMenu` do Histórico.
- **Isolamento:** o filtro está no `show` do controller (compara `clinic_id` e
  devolve 404). A tela trata o 404 como "Programa não encontrado", sem
  renderizar nada do programa. Ganha um teste de regressão no backend, porque
  hoje só `duplicate`, `to-model` e o PDF têm teste de outra clínica.
- **Função pura do painel (`application/clinic`):** reúne o que o protótipo
  espalhava em `builder.ts` e no componente:
  - a dose em pedaços (`{ key, value, unit }[]`: séries, repetições, carga,
    descanso, com singular e plural) e a agenda ("Seg, Qua, Sex · Manhã",
    "Todos os dias");
  - os números do painel a partir do `Program` e de `validityOf`. No rascunho,
    a função devolve só o número de exercícios e sinaliza o aviso; fora dele,
    devolve os quatro números ("Faltam N dias", "Terminou há N dias" ou "Sem
    fim"; "Ainda não" quando o paciente não abriu);
  - a URL do WhatsApp com a mensagem do programa (saudação, título, mensagem
    do fisioterapeuta, `shareUrl`), ou `null` sem telefone.

  O `ProgramShareDialog` passa a usar a mesma montagem de mensagem, para o
  texto não divergir. O assistente protótipo (`program-builder-prototype`) pode
  reexportar a dose e a agenda da `application`; a tela real nunca importa de
  pasta `-prototype`.
- **Menu ⋯:** a ordem é Copiar link, Baixar PDF, Texto para prontuário,
  Duplicar, Transformar em modelo, Excluir rascunho. As ações vêm de
  `useProgramHistoryActions`. Copiar link, PDF e Texto entram como itens do
  menu, porque no Histórico eles são atalhos do rodapé do cartão. Copiar link
  fica desabilitado no rascunho e sem paciente.
- **Navegação depois da ação:** o `run` das ações ganha um jeito de reagir ao
  sucesso, sem mudar o Histórico. No detalhe, duplicar navega para
  `/clinica/programas/<id da cópia>` e excluir navega para o Histórico; no
  Histórico, as duas continuam só com o toast e a lista atualizada.
- **Voltar:** o cartão do Histórico e o "Abrir programa" da gaveta do
  prontuário abrem o programa passando no `state` da navegação a origem
  (`pathname + search`). O "← Programas" usa essa origem ou,
  sem ela, `/clinica/programas/historico`. Duplicar repassa a mesma origem para
  a cópia.
- **WhatsApp:** é um link `wa.me` aberto em nova aba (`target="_blank"`,
  `rel="noopener"`), sem Twilio e sem job. Os estados são três: escondido sem
  paciente, desabilitado com a dica no rascunho ou sem telefone, e ativo nos
  outros casos.
- **Corte:** saem a página v1, o protótipo, o `DETAIL_VARIANTS` e o
  `PrototypeSwitcher` desta rota. O teste da v1 (`ProgramDetailPage.test.tsx`)
  é reescrito para a tela nova. Em `docs/prototipos-v2.md`, o item "Detalhe do
  programa" fica marcado.
- **Layout:** é o do protótipo, com o contêiner em
  `max-w-(--breakpoint-ds-xl)`, os componentes `@/components/ds` (`DsKpi`,
  `DsModal`, `DsButton`, `DsActionsMenu`, `DsEmptyState`) e as peças do
  Histórico (`PersonAvatar`, `ProgramStatusBadge`, `ValidityBar`).
- **Sem ADR:** não nasce fronteira nova nem regra de negócio nova.

## Fatias Verticais

1. **Tela A de verdade com leitura e corte.** Cria a função pura (dose, agenda
   e números, incluindo o rascunho) com teste. A página real fica com o topo,
   os números, o aviso de rascunho com "Continuar editando", os grupos, o modal
   de vídeo, o "Editar", o esqueleto e "Programa não encontrado". A rota aponta
   para ela, e a v1, o protótipo e o `?variant=` saem. Entram também o teste de
   corte e o teste de regressão do backend para `GET` de outra clínica.
   Demonstra: abrir um programa enviado, um rascunho e um de outra clínica.
2. **Ações do topo e navegação.** Traz o menu ⋯ com as seis ações (Copiar
   link, PDF e Texto como itens), Excluir desabilitado para quem não é admin,
   duplicar abrindo a cópia e excluir voltando ao Histórico. O WhatsApp passa a
   ser real, com a mensagem compartilhada com o `ProgramShareDialog`. O cartão
   do Histórico informa a origem e o "← Programas" volta para ela. Demonstra:
   reenviar pelo WhatsApp, duplicar e voltar ao Histórico filtrado.

## Testes

- **Como rodam:** `npm run test` (Vitest) e
  `php artisan test --filter=TreatmentPlanControllerTest`; no fim,
  `bash bin/verificar.sh`.
- **Padrões copiados:**
  - função pura: `resources/js/test/program-history-filters.test.ts`;
  - página com React Query, router e `useAuth` mockado:
    `ProgramHistoryPage.test.tsx` e `PatientRecordVariantB.test.tsx`;
  - corte: `program-listings-v2-cut.test.ts`;
  - backend: `TreatmentPlanControllerTest`
    (`test_duplicate_returns_404_for_plan_from_other_clinic`, com
    `actingAs($user, 'clinic')` e factories).
- **O que é testado:**
  - Função pura: dose (faixas, singular e plural, carga, descanso, vazia);
    agenda (todos os dias, dias soltos, período, nada); números ("Faltam",
    "Terminou há", "Sem fim", "Ainda não" e a data de abertura); rascunho com
    só exercícios e o aviso; URL do WhatsApp com mensagem e link, e `null` sem
    telefone.
  - Página, estados: programa enviado mostra topo, quatro números e
    exercícios; rascunho mostra o aviso e "Continuar editando" leva ao
    `/editar`; WhatsApp escondido sem paciente e desabilitado sem telefone ou
    no rascunho; 404 mostra "Programa não encontrado"; tocar na miniatura abre
    o vídeo, e um exercício sem vídeo mostra o aviso.
  - Página, ações e navegação: o menu tem as seis ações; Excluir desabilitado
    com o motivo para fisioterapeuta e secretária; Excluir ausente em programa
    enviado; duplicar navega para a cópia; excluir navega para o Histórico;
    "← Programas" usa a origem do `state` ou cai no Histórico.
  - Corte: a página real e a rota não importam `-prototype`,
    `PrototypeSwitcher` nem `?variant=`.
  - Backend: `GET /clinic/treatment-plans/{id}` de outra clínica devolve 404
    sem dado no corpo.
- **Smoke test** (Definição de Pronto): abrir um programa enviado, um
  rascunho, um sem telefone e um de outra clínica, no tema claro e no escuro,
  no desktop e no celular, com a evidência em
  `evidence/<tarefa>/SUMMARY.md`.

## Fora do Escopo

- Assistente de programa v2 de verdade. "Editar" e "Continuar editando" levam
  ao `/clinica/programas/:id/editar` de hoje.
- Envio por WhatsApp pelo servidor (Twilio) e qualquer job.
- Nome do paciente como link para o prontuário.
- Mudar o que significa "Paciente abriu" (primeira ou última abertura): a tela
  mostra o `patientViewedAt` que a API já devolve.
- Detalhe do programa no painel admin (`pages/admin/program`).

## Notas

- O `ProgramDetailPage` v1 tinha um `formatFrequency` próprio. Ele sai com a v1,
  e o texto para prontuário continua em `format-program-clinical-record-text`.
- O protótipo já usa o programa real (`useClinicProgram`), então a fatia 1 é
  quase uma mudança de pasta mais a função pura. O risco está na fatia 2, na
  navegação depois da ação, sem quebrar o comportamento do Histórico.
- Branch sugerida: `feat/clinic-programa-detalhe-ds`, a partir da `main`.
