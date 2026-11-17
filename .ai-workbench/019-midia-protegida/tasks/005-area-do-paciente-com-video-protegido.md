# Área do paciente com vídeo protegido

**Tipo:** História
**Plano:** `../plans/midia-protegida.md`
**Histórias:** 10, 11, 12, 13, 14, 25
**Issue:** ainda não criada

## Descrição

O paciente abre o programa pelo link do WhatsApp ou pelo QR do PDF, sem login, e o vídeo toca dentro de um `iframe` (detalhe e execução do exercício) ou do `VideoThumb` (detalhe do programa). Depois da tarefa 001, o `iframe` recebe link assinado de 30 minutos. Se o paciente pausar para fazer a série e voltar depois do prazo, o vídeo trava.

Esta tarefa troca o player pelo vídeo protegido: o vídeo é baixado inteiro no play, toca da memória e renova o link sozinho. A página continua sem login, por decisão do usuário, com o risco aceito de que quem recebe o link encaminhado vê os vídeos daquele programa.

## O que construir

- O mapper do programa do paciente (módulo `TreatmentProgram`) assina vídeo e capa só dos exercícios daquele programa.
- Páginas do paciente: detalhe do programa, detalhe do exercício e execução, trocando o `iframe` e o `VideoThumb` pelo vídeo protegido. Na renovação, a página refaz a query do programa pelo `public_token`.
- As rotas por `public_token` continuam sem login. Nenhuma rota nova.

## Critérios de Aceite

- [ ] As páginas do paciente não têm mais `iframe` de vídeo.
- [ ] O vídeo baixado continua tocando depois de uma pausa maior que o prazo do link (teste Vitest com o link vencido).
- [ ] Com o link vencido antes do play, a página pede o programa de novo e o vídeo toca.
- [ ] A resposta do programa só traz mídia dos exercícios daquele programa, e um token inexistente dá 404.
- [ ] A página abre sem login, como hoje.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Um paciente não vê nem altera nada de outro paciente
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `002-video-e-imagem-protegidos-na-clinica` (vídeo protegido).

## Notas de Implementação

- **Branch:** `feat/midia-protegida`
- **Exemplo no código:** o teste `patient-area-v2-pages.test.tsx` (páginas do paciente com `vi.mock` do repositório) e o mapper de resposta do programa do paciente no `TreatmentProgram`.
- **Skills:** `frontend-react`, `frontend-testing`, `design-system`, `php-testing`, `qa-navegador`.
- O paciente usa celular: confira no smoke test que o download do vídeo funciona em viewport de celular.

## Como testar na mão

1. Crie um programa para um paciente da clínica A, com um exercício que tenha vídeo.
2. Abra `/{slug}/paciente/programas/{public_token}` numa janela anônima, em viewport de celular. O vídeo toca sem login.
3. Comece a execução, dê play, pause, espere o link vencer (prazo curto no `.env` local) e dê play de novo: o vídeo continua.
4. Abra o token de outro programa: só aparece a mídia dele. Um token inventado dá 404.
