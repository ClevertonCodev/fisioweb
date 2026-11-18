# Imagens de referência privadas na clínica e no admin

**Tipo:** História
**Plano:** `../plans/midia-protegida.md`
**Histórias:** 5, 6, 9, 24
**Issue:** ainda não criada

## Descrição

As imagens de referência de um exercício guardam um endereço fixo do CDN em dois lugares: na tabela `admin_exercise_media` (`cdn_url`) e dentro do `metadata` do vídeo (`reference_images` e `proposed_reference_images`, cada item com `cdn_url` e `file_path`). O `metadata` vai cru na resposta, então endereço e caminho saem juntos. Esta tarefa guarda só o caminho e manda link assinado de 5 minutos.

## O que construir

- Migration do módulo `Admin`: `admin_exercise_media` perde `cdn_url`. Fica o `file_path`.
- Módulo `Media`: os itens de `reference_images` e `proposed_reference_images` guardam só `file_path`, sem `cdn_url`.
- A serialização do vídeo deixa de mandar o `metadata` cru: troca cada imagem pelo link assinado (`url`, 5 min) e tira `file_path`, `proposed_thumbnail_path` e qualquer outro caminho. A proposta (ADR 029) também sai com links assinados.
- `ExerciseMedia` serializa `url` assinado e esconde `file_path`.
- A sincronização de imagens do Admin para de gravar endereço. O seed de exercícios grava só o caminho.
- Telas: a troca de imagens da biblioteca e o envio de exercício na clínica, e o formulário de exercício e a proposta no admin, todos com a imagem protegida.
- Nenhuma rota nova e nenhuma regra de acesso muda. A clínica só recebe imagem de exercício visível para ela (`Exercise::scopeVisibleToClinic`), com o `clinic_id` vindo da clínica autenticada.

## Critérios de Aceite

- [x] A coluna `admin_exercise_media.cdn_url` não existe mais, e `migrate:fresh --seed` roda sem erro.
- [x] Nenhuma resposta de vídeo ou de exercício traz `cdn_url`, `file_path`, `proposed_thumbnail_path` ou o host do CDN, nem dentro do `metadata`.
- [x] As imagens de referência saem com link assinado de 5 min, na clínica e no admin.
- [x] Trocar as imagens de um vídeo não travado e propor imagens para um vídeo travado (ADR 029) continuam funcionando.
- [x] A clínica B não recebe imagem de referência de exercício pendente ou de proposta da clínica A.
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `002-video-e-imagem-protegidos-na-clinica` (imagem protegida).

## Notas de Implementação

- **Branch:** `feat/midia-protegida`
- **Exemplo no código:** a geração de links das imagens da proposta no serviço de vídeo do `Media`, e o ADR 029 (formato de `reference_images`).
- **Skills:** `architecture-paradigm-modular-monolith`, `laravel-eloquent`, `php-testing`, `frontend-testing`.
- O PDF usa essas imagens. A tarefa 008 troca o PDF para link assinado; até lá, confira que ele não quebra (sem imagem é aceitável no intervalo, com erro não).

## Como testar na mão

1. Como clínica A, envie um exercício com imagens de referência e abra a troca de imagens na biblioteca.
2. As imagens aparecem. Na resposta da API, cada uma traz só `url` assinado.
3. No admin, abra o formulário do exercício e a proposta de mídia: as imagens aparecem.
4. Como clínica B, as imagens do exercício pendente da A não aparecem.
