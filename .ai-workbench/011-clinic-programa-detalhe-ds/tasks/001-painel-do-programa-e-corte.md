# Painel do programa v2 de verdade e corte da v1

**Tipo:** História
**Plano:** `../plans/clinic-programa-detalhe-ds.md`
**Histórias:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 30, 31, 35, 36, 38, 39
**Issue:** ainda não criada

## Descrição

Ao abrir um programa, o fisioterapeuta ainda vê a tela v1. O "Painel do
programa" (variante A) só aparece com `?variant=` em desenvolvimento. Esta
tarefa promove o protótipo a tela real na rota `/clinica/programas/:id` e
apaga a v1, o protótipo e o `?variant=` dessa rota.

O protótipo já lê o programa real. O trabalho principal é tirar a conta da dose,
da agenda e dos números do painel de dentro dos componentes (e da pasta do
assistente protótipo) e colocar numa função pura em `application/clinic`, com
teste. Também entra o tratamento do rascunho.

## O que construir

- Na rota `/clinica/programas/:id` (guard `clinic`, os três papéis), a tela tem:
  - o topo com foto, paciente, profissional, título, status, a barra de
    validade e a mensagem;
  - os quatro números: exercícios, faltam / terminou há / sem fim, vezes que
    completou, paciente abriu (data ou "Ainda não");
  - os grupos com cada exercício em cartão: número da ordem, nome, miniatura,
    dose em pedaços, dias e período e observação.
- Tocar na miniatura abre o vídeo num modal. Sem vídeo, o modal mostra "Este
  exercício não tem vídeo".
- No rascunho, ficam só o número de exercícios e o aviso "Rascunho: o paciente
  ainda não recebeu", com o botão "Continuar editando" para
  `/clinica/programas/:id/editar`.
- O botão "Editar" leva ao `/editar` de hoje. O menu ⋯ continua com as ações
  que o protótipo já tem: o conteúdo completo dele é da tarefa 002 e o WhatsApp
  real é da 003. Até lá, o WhatsApp não aparece; nada de stub com toast na tela
  real.
- Enquanto carrega, aparece um esqueleto. Programa de outra clínica ou
  inexistente mostra "Programa não encontrado", sem nenhum dado do programa.
- A função pura em `application/clinic` cobre a dose (séries, repetições,
  carga, descanso, com singular e plural), a agenda ("Seg, Qua, Sex · Manhã",
  "Todos os dias") e os números do painel com a regra do rascunho. O assistente
  protótipo passa a reexportar dela, em vez de ser a fonte.
- Corte: saem a página v1, a pasta `program-detail-prototype`, o
  `DETAIL_VARIANTS` e o `PrototypeSwitcher` desta rota. O teste antigo da página
  é reescrito para a tela nova, e o item "Detalhe do programa" de
  `docs/prototipos-v2.md` fica marcado.
- Backend (`TreatmentProgram`): sem mudança de código. Ganha só o teste de
  regressão de que `GET /clinic/treatment-plans/{id}` de outra clínica devolve
  404 sem dado.
- Layout: contêiner `max-w-(--breakpoint-ds-xl)`, componentes do DS, tema
  escuro. No celular, dois números por linha, um exercício por linha e nada de
  rolagem lateral.

## Critérios de Aceite

- [x] `/clinica/programas/:id` abre o painel v2 sem `?variant=`, tanto no `npm run build` quanto no dev.
- [x] O programa enviado mostra o topo, os quatro números e os exercícios agrupados, com dose, agenda e observação.
- [x] "Faltam N dias", "Terminou há N dias" e "Sem fim" aparecem conforme o fim da validade; "Paciente abriu" mostra a data ou "Ainda não".
- [x] O rascunho mostra só o número de exercícios e o aviso; "Continuar editando" leva ao `/editar`.
- [x] A miniatura abre o vídeo no modal; um exercício sem vídeo mostra o aviso.
- [x] Os testes Vitest da função pura cobrem dose, agenda, os números e o rascunho.
- [x] Os testes Vitest da página cobrem o enviado, o rascunho, o "Programa não encontrado" e o modal de vídeo.
- [x] O teste de corte confirma que a página real e a rota não importam `-prototype`, `PrototypeSwitcher` nem `?variant=`.
- [x] Teste PHPUnit: `GET` de um programa de outra clínica devolve 404 sem dado no corpo.
- [x] Um usuário de outra clínica não vê nada do programa ("Programa não encontrado").
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), menos a revisão adversária, que o usuário roda manualmente; `verificar.sh` com Prettier e Vitest falhando por itens que já existiam na branch (ver `DEFERRED.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/clinic-programa-detalhe-ds`
- **Exemplo no código:** o protótipo em `pages/clinic/program/program-detail-prototype/`, o corte da 008 (`program-listings-v2-cut.test.ts`) e a função pura `program-history-filters` com o teste dela.
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`, `php-testing`, `qa-navegador`

## Como testar na mão

1. Entre como fisioterapeuta da clínica A e abra Programas → Histórico → um programa enviado. Deve aparecer o painel v2 com os quatro números e os exercícios.
2. Toque numa miniatura: o vídeo abre no modal.
3. Abra um rascunho: só aparecem o número de exercícios e o aviso, e "Continuar editando" vai para a edição.
4. Pegue o id de um programa da clínica B e abra `/clinica/programas/<id>` logado na A: deve aparecer "Programa não encontrado".
5. Repita no tema escuro e na largura de celular.
