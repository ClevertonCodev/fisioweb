# Tela v2 de enviar exercício, recorte de imagem no DS e corte da v1

**Tipo:** História
**Plano:** `../plans/clinic-enviar-exercicio-ds.md`
**Histórias:** 1, 2, 3, 4, 5, 6, 8
**Issue:** ainda não criada

## Descrição

Substitui a tela v1 (`ClinicSubmitExercisePage.tsx`) e o protótipo descartável (`exercise-submit-prototype/`) pela tela oficial de `/clinica/exercicios/enviar` no Design System v2 (variante A: três seções numeradas com prévia da biblioteca e checklist ao lado), conectada ao envio real (`useSubmitExercise`), com modal de recorte de imagem em `DsModal` para capa e fotos de referência do PDF e com "Ajustar vídeo" condicional ao suporte do navegador.

## O que construir

Criar os componentes da tela em `resources/js/pages/clinic/exercise-submit/` usando apenas `@/components/ds` e tokens `--ds-*`, com largura máxima `max-w-(--breakpoint-ds-xl)`. Conectar o formulário RHF + Zod e os arquivos (vídeo obrigatório, capa opcional e até 2 fotos do PDF opcionais) ao hook real `useSubmitExercise`. Na seção 1 (Vídeo), validar no navegador formato, tamanho até 20 MB, orientação em pé (bloqueando vídeo deitado) e aviso de qualidade (< 480p), preencher a duração automaticamente ao ler os metadados, permitir capturar o quadro atual como capa e exibir "Ajustar vídeo" (`VideoEditor`) apenas quando o navegador suportar `MediaRecorder` e `canvas.captureStream`. Na seção 3 (Imagens), abrir um modal de recorte no DS v2 (`DsModal` + `react-image-crop`) ao escolher a imagem da capa ou qualquer uma das 2 fotos de referência do PDF (validando JPEG, PNG ou WebP até 5 MB). Durante o envio, mostrar `DsSteps` com o progresso real e, ao concluir, mostrar o cartão de confirmação com "Enviar outro" (limpa tudo) e "Ir para a biblioteca" (`/clinica/exercicios`). Remover a v1, a pasta `exercise-submit-prototype/` e o seletor `?variant=`, e marcar os itens correspondentes em `docs/prototipos-v2.md`.

## Critérios de Aceite

- [x] `/clinica/exercicios/enviar` renderiza a variante A no DS v2 em todos os ambientes, sem `?variant=`, sem `PrototypeSwitcher` e sem nenhum import de `@/components/ui/*` (Vitest).
- [x] As regras de vídeo no navegador bloqueiam vídeo deitado e vídeo > 20 MB, avisam sobre resolução < 480p ou proporção em pé diferente de 9:16 e aprovam vídeo 9:16 válido (Vitest).
- [x] O botão "Ajustar vídeo" aparece quando `MediaRecorder` + `canvas.captureStream` estão disponíveis e fica oculto caso contrário (Vitest).
- [x] Escolher arquivo de capa ou foto do PDF (1 e 2) abre o modal de recorte em `DsModal` e permite confirmar o recorte ou cancelar; capturar quadro do vídeo define a capa (Vitest).
- [x] Enviar o formulário válido chama `useSubmitExercise().submit` com nome, categoria, dificuldade, descrição, duração, vídeo, capa e as 2 fotos de referência, exibe o progresso e, ao concluir, permite "Enviar outro" ou "Ir para a biblioteca" (`/clinica/exercicios`) (Vitest).
- [x] A pasta `resources/js/pages/clinic/exercise-submit-prototype/` foi removida e `docs/prototipos-v2.md` está atualizado (Vitest).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (smoke test).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), menos a revisão adversária, que o usuário roda manualmente.

## Depende de

- `001-limite-20mb-e-isolamento-video-clinica` (Limite de 20 MB e isolamento por clínica dos vídeos de exercício)

## Notas de Implementação

- **Branch:** `feat/clinic-enviar-exercicio-ds`
- **Exemplo no código:** `resources/js/application/clinic/use-submit-exercise.ts`, `resources/js/components/ImageCropModal.tsx`, `resources/js/pages/clinic/ClinicRegisterPage.tsx`
- **Skills:** `design-system`, `frontend-ddd`, `forms-shadcn` (RHF + Zod), `frontend-testing`, `qa-navegador`

## Como testar na mão

1. Abrir `/clinica/exercicios/enviar` como admin da clínica A.
2. Testar vídeo deitado (bloqueia) e vídeo > 20 MB (bloqueia).
3. Selecionar vídeo em pé válido, preencher nome, categoria, dificuldade e instruções, definir capa e 2 fotos do PDF com recorte, e clicar em "Enviar exercício".
4. Confirmar na biblioteca (`/clinica/exercicios`) que o exercício aparece para a clínica A e não aparece para a clínica B.
