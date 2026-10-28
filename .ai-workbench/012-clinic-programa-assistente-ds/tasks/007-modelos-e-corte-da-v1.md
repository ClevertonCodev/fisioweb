# Modelos no assistente v2 e corte da v1

**Tipo:** História
**Plano:** `../plans/clinic-programa-assistente-ds.md`
**Histórias:** 29, 32, 33, 38
**Issue:** ainda não criada

## Descrição

"Usar em novo modelo" (num exercício) e "Editar modelo" (em Meus modelos) ainda
caem na v1, porque o protótipo devolve o fluxo de modelo para ela. Esta tarefa
põe o modelo no assistente v2, com a etapa 3 reduzida a "Nome e mensagem". Com
isso, nada mais usa a v1, e ela sai inteira.

## O que construir

- **Modo modelo:**
  - Título "Novo modelo" ou "Editar modelo".
  - As etapas 1 e 2 são iguais às do programa.
  - A etapa 3 vira "Nome e mensagem": só o nome e a mensagem padrão, sem paciente nem datas.
  - Botão "Salvar modelo".
  - Salva sem paciente (rascunho) e volta para Meus modelos.
  - Sem diálogo de envio e sem rascunho automático.
- **Entradas:**
  - "Usar em novo modelo" continua passando o exercício pela navegação e abre na etapa 2.
  - "Editar modelo" em Meus modelos passa a navegar para `/clinica/programas/:id/editar?modelo=1`, carregado pela URL, como a edição de programa (tarefa 006).
  - O `PUT` leva os `id`s e não leva `status`.
- **Sair:** na edição de modelo com alteração, "Descartar alterações?". Voltar na etapa 1 vai para Meus modelos.
- **Corte da v1:**
  - Saem a `ProgramNewPage` v1, os componentes da v1 do assistente (seleção, configuração, detalhes, painel de edição de exercício, barra de navegação e diálogo de envio em shadcn) e os testes deles.
  - Sai também o uso do seletor de variantes no assistente e a pasta do protótipo, se algo ainda sobrar nela.
  - O que os testes antigos cobriam e ainda vale passa para os novos.
  - `docs/prototipos-v2.md` marca o assistente como implementado.
- **Isolamento:** o modelo é um programa da clínica (filtrado por `clinic_id` no backend); outra clínica recebe 404.

## Critérios de Aceite

- [ ] "Usar em novo modelo" abre o assistente v2 com o título "Novo modelo", na etapa 2, com o exercício (Vitest).
- [ ] A etapa 3 do modelo tem só nome e mensagem, e o botão diz "Salvar modelo" (Vitest).
- [ ] Salvar o modelo novo chama o `create` com `patientId` nulo e volta para Meus modelos (Vitest).
- [ ] "Editar modelo" abre `/clinica/programas/:id/editar?modelo=1` com o título "Editar modelo"; salvar chama o `update` com os `id`s e volta para Meus modelos (Vitest).
- [ ] Sair da edição de modelo com alteração pede confirmação (Vitest).
- [ ] Não existem mais a `ProgramNewPage` v1, `StepSelectExercises`, `StepConfigureExercises`, `StepProgramDetails`, `EditExercisePanel` da clínica, `ProgramWizardNavBar` e o `ProgramShareDialog` shadcn; nada os importa; `npm run types`, `npm run lint` e `npm run test` verdes.
- [ ] Smoke no navegador: criar um modelo a partir de um exercício e editar um modelo, com evidência.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (`/clinica/programas/<modelo de outra clínica>/editar?modelo=1` mostra a tela de erro).
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `005-rascunho-prontuario-etapas-e-datas` (o novo completo, antes de apagar a v1).
- `006-editar-programa-no-assistente` (o modo edição pela URL).

## Notas de Implementação

- **Branch:** a mesma da tarefa 001.
- **Exemplo no código:** `useModelActions` em `resources/js/pages/clinic/program/program-models/parts.tsx` (de onde sai o "Editar modelo"); `useExerciseActions` em `resources/js/pages/clinic/program/exercise-library/media.tsx` ("Usar em novo modelo"); o corte da v1 na tarefa 001 da feature 011.
- **Skills:** `frontend-ddd`, `design-system`, `frontend-testing`, `qa-navegador`.

## Como testar na mão

1. Programas → aba Exercícios → abra um exercício → "Usar em novo modelo": abre "Novo modelo" na etapa 2.
2. Avance: a etapa 3 se chama "Nome e mensagem", sem paciente nem datas. "Salvar modelo" leva a Meus modelos, com o modelo novo lá.
3. Em Meus modelos → menu ⋯ → "Editar modelo": a URL termina em `/editar?modelo=1`. Recarregue: continua lá. Mude algo, clique em Voltar: "Descartar alterações?".
4. Procure no código por `ProgramNewPageV1`, `StepSelectExercises` e `ProgramWizardNavBar`: nada.
