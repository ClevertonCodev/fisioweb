# Seletor do operador só com vídeo do catálogo, e sincronização das imagens por evento sem regravar exercício aprovado

**Tipo:** Tarefa
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 37, 31 (em parte)
**Issue:** ainda não criada

## Descrição

Duas variantes do achado Médio `admin/exercise-approval/owner-clinic-rewrites-approved-media`. A troca de imagens de referência do vídeo regrava as imagens do PDF de **todo** exercício ligado, inclusive o aprovado. Além disso, o seletor do operador oferece vídeo de clínica para ligar a exercício global. Hoje o Media ainda chama o serviço do Admin direto pelo container, o que fura a fronteira entre módulos.

Esta tarefa prepara o terreno para a proposta (018): a sincronização passa a ser por evento e para de tocar em exercício aprovado ou global.

## O que construir

- O Media publica o evento `VideoReferenceImagesChanged` (o vídeo, a clínica dona e as imagens) e deixa de chamar o serviço do Admin pelo container.
- O Admin escuta o evento e sincroniza as imagens do PDF só dos exercícios ligados ao vídeo que são da mesma clínica dona e que **não** estão aprovados. O exercício aprovado ou global não muda.
- O seletor de vídeo do operador lista só vídeos sem `clinic_id`, os do catálogo.
- Sem migration. Sem tela.

## Critérios de Aceite

- [ ] Trocar as imagens de referência de um vídeo ligado a exercício aprovado não muda as imagens do PDF desse exercício
- [ ] O exercício pendente da clínica dona continua recebendo as imagens novas
- [ ] O seletor do operador não lista vídeo de clínica
- [ ] O Media não importa nada do Admin (teste de fronteira, novo ou estendido em `tests/Architecture`)
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `modules/Media/app/Services/VideoService.php` (`syncReferenceImages`); `modules/Admin/app/Services/ExerciseReferenceImageSyncService.php`; `modules/Media/app/Repositories/VideoRepository.php` (`getAvailableForExercise`)
- **Skills:** `architecture-paradigm-modular-monolith`, `laravel-eloquent`, `php-testing`

## Como testar na mão

1. Como operador, abra a criação de exercício global e veja o seletor de vídeo: só aparecem vídeos do catálogo.
2. O resto é coberto por teste.
