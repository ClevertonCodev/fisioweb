# PDF do programa com mídia assinada e sem QR externo

**Tipo:** História
**Plano:** `../plans/midia-protegida.md`
**Histórias:** 21, 22, 23
**Issue:** ainda não criada

## Descrição

O PDF do programa embute as imagens dos exercícios e a foto do profissional. O dompdf baixa cada uma pela URL pública do CDN na hora de gerar. Sem URL pública, ele precisa receber link assinado. O QR do programa continua apontando para a página do programa, mas quando a geração local falha, o sistema hoje manda o endereço da página (o `public_token`) para o `api.qrserver.com`. Como esse token é a única chave da página, que abre sem login, o fallback sai.

## O que construir

- Na montagem do PDF (módulo `TreatmentProgram`), as imagens de referência e a foto do profissional recebem link assinado de 5 min, gerado na hora. O dompdf continua baixando por HTTP, e a geração continua síncrona.
- O gerador de QR perde o fallback externo. Se a geração local falhar, o PDF sai sem QR e o erro vai para o log, sem o token nem a URL.
- Guard `clinic`, mesma rota e mesma Policy de hoje. O programa é buscado pela clínica autenticada.

## Critérios de Aceite

- [x] O PDF sai com as imagens dos exercícios e a foto do profissional.
- [x] O HTML do PDF não tem o host do CDN; as imagens vêm de link assinado.
- [x] Com a geração local do QR falhando, o PDF sai sem QR, sem nenhuma chamada ao `api.qrserver.com`, e o log não tem o token.
- [x] O QR, quando gerado, continua apontando para `APP_URL/{slug}/paciente/programas/{public_token}`.
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Um paciente não vê nem altera nada de outro paciente
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `004-imagens-de-referencia-privadas` (imagens só com caminho).
- `006-foto-do-profissional-privada` (foto só com caminho).

## Notas de Implementação

- **Branch:** `feat/midia-protegida`
- **Exemplo no código:** o montador do view model do PDF e o gerador de QR no `TreatmentProgram`, e os testes do PDF do programa que já existem.
- **Skills:** `php-testing`, `backend-clean-code`.
- Para simular a falha do QR, troque o gerador local por um dublê que lança exceção e use `Http::fake` para provar que não houve chamada externa.

## Como testar na mão

1. Como `physiotherapist` da clínica A, gere o PDF de um programa com exercícios que têm imagens de referência.
2. As imagens, a foto do profissional e o QR aparecem.
3. Leia o QR: ele abre a página do programa.
4. Como clínica B, o PDF do programa da A dá 404 ou 403, como hoje.
