# WhatsApp real com a mensagem compartilhada com o ProgramShareDialog

**Tipo:** História
**Plano:** `../plans/clinic-programa-detalhe-ds.md`
**Histórias:** 16, 17, 18, 19, 37, 40
**Issue:** ainda não criada

## Descrição

No protótipo, o botão WhatsApp só mostra um toast. O usuário decidiu que ele
deve abrir o `wa.me` do paciente com a mensagem e o link do programa, como já
acontece no diálogo de compartilhar depois de salvar (`ProgramShareDialog`).
Para o paciente receber sempre o mesmo texto, a montagem da mensagem sai do
diálogo e vai para a função pura de `application/clinic`, e o diálogo passa a
usá-la.

## O que construir

- O botão WhatsApp no topo do detalhe tem três estados:
  - **escondido** quando o programa não tem paciente;
  - **desabilitado com dica** no rascunho e quando o paciente não tem telefone
    ("Paciente sem telefone");
  - **ativo** nos outros casos. Nesse caso, é um link para
    `https://wa.me/<dígitos>?text=<mensagem>`, aberto em nova aba
    (`noopener`).
- A mensagem tem a saudação com o nome do paciente, o título do programa, a
  mensagem do fisioterapeuta (quando houver) e "Acesse: <shareUrl>". É a mesma
  função usada pelo `ProgramShareDialog`, que continua mostrando exatamente o
  mesmo texto de hoje.
- Sem Twilio, sem job e sem mudança no backend. Nada é enviado pelo servidor:
  o `wa.me` abre no aparelho de quem clicou.
- Os três papéis podem usar.

## Critérios de Aceite

- [x] O teste da função pura cobre a URL com telefone formatado, mensagem e link; sem mensagem do fisioterapeuta; e `null` sem telefone.
- [x] O `ProgramShareDialog` usa a função compartilhada, e o texto dele não muda (teste ou comparação).
- [x] Os testes Vitest da página cobrem o botão escondido sem paciente, desabilitado sem telefone e no rascunho, e o `href` certo no caso ativo.
- [x] Abre em nova aba com `window.open(url, '_blank', 'noopener,noreferrer')` (o `DsButton` não é link; mesmo jeito do `ProgramShareDialog`).
- [x] Um usuário de outra clínica não vê o botão (a tela mostra "Programa não encontrado").
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), menos a revisão adversária, que o usuário roda manualmente; `verificar.sh` com Prettier e Vitest falhando por itens que já existiam na branch (ver `DEFERRED.md`)

## Depende de

- `001-painel-do-programa-e-corte` (painel do programa v2 de verdade e corte da v1).

## Notas de Implementação

- **Branch:** `feat/clinic-programa-detalhe-ds`
- **Exemplo no código:** `components/clinic/program/ProgramShareDialog.tsx` (a mensagem de hoje) e `pages/clinic/patient/patient-record/share.ts` (a montagem do `wa.me`).
- **Skills:** `frontend-ddd`, `design-system`, `frontend-testing`, `qa-navegador`

## Como testar na mão

1. Entre na clínica A e abra um programa enviado de um paciente com telefone. Tocar em WhatsApp abre o `wa.me` com a mensagem e o link.
2. Abra o programa de um paciente sem telefone: o botão fica desabilitado, com a dica.
3. Abra um rascunho: o botão fica desabilitado.
4. Crie e salve um programa novo: o diálogo de compartilhar continua com o mesmo texto no WhatsApp.
