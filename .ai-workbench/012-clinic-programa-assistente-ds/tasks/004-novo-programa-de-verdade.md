# Novo programa de verdade no assistente v2

**Tipo:** História
**Plano:** `../plans/clinic-programa-assistente-ds.md`
**Histórias:** 1, 3, 4, 9, 10, 11, 12, 13, 14, 34
**Issue:** ainda não criada

## Descrição

O assistente em três etapas (protótipo A) já aparece em `/clinica/programas/novo`
com `?variant=A`, mas salva de mentira. O diálogo de envio dele é de exemplo, e
o exercício entra "sem dose" enquanto o backend na verdade aplica a dose do
catálogo. Esta tarefa faz o assistente salvar de verdade nas entradas sem
rascunho: novo vazio, "Usar em novo programa" num exercício e "Usar modelo".

A abordagem é tirar o assistente da pasta do protótipo e transformá-lo em tela
real, com o estado e as conversões em `application/`. A rota `/novo` passa a
mostrar só ele, e a v1 do novo sai da rota (o arquivo só sai na tarefa 007,
porque o fluxo de modelo ainda depende dele).

## O que construir

- **Rota:** `/clinica/programas/novo` mostra o assistente v2 para programa, sem `?variant=`. O fluxo de modelo (`asModel`) continua indo para a v1 até a tarefa 007.
- **Camadas** (`frontend-ddd`):
  - O estado do assistente, a conversão do que chega por navegação (modelo, exercício) e a montagem do payload de escrita saem da pasta do protótipo para `application/`.
  - A tela vira pasta real em `pages/clinic/program/`.
- **Dose do catálogo:**
  - O `Exercise` do domínio passa a trazer séries, repetições e descanso do catálogo; a API da biblioteca já devolve, só falta mapear.
  - O exercício marcado na biblioteca, ou vindo de "Usar em novo programa", entra com essa dose.
  - Só conta como "com dose" o que tem dose de verdade, então a barra "X de Y com dose" bate com os cards.
  - O aviso da etapa 3 diz que o exercício sem dose usa a dose padrão do exercício.
- **Salvar:** `POST /api/clinic/treatment-plans` sem `status` (a tarefa 002 decide no backend).
  - Com paciente: abre o diálogo de envio real, com copiar link, WhatsApp e e-mail (funções de `program-share`), fase "salvando" e fase de erro com a mensagem da API, sem perder o que foi montado. "Concluir" leva ao painel do programa.
  - Sem paciente: vai para Meus modelos.
- **Entradas:** "Usar em novo programa" e "Usar modelo" abrem na etapa 2 com os dados, com o subtítulo "A partir de …"; o novo vazio abre na etapa 1.
- **Celular:** a barra de baixo e a gaveta do programa do protótipo continuam funcionando.
- **Isolamento:** o backend já filtra pacientes e exercícios (tarefa 003); a tela não decide nada de segurança.

## Critérios de Aceite

- [ ] `/clinica/programas/novo` mostra o assistente v2 sem `?variant=` e sem o seletor de variantes (Vitest).
- [ ] O novo vazio abre na etapa 1; "Usar em novo programa" e "Usar modelo" abrem na etapa 2 com os grupos e as doses certos (Vitest).
- [ ] O exercício novo entra com a dose do catálogo, e a barra "com dose" bate com os cards (Vitest).
- [ ] Salvar com paciente chama o `create` sem `status`, com grupos e exercícios na ordem, e abre o diálogo de envio com o link real (Vitest).
- [ ] Salvar sem paciente vai para Meus modelos (Vitest).
- [ ] Erro da API mostra a mensagem no diálogo e mantém o assistente montado (Vitest).
- [ ] Nenhum arquivo fora de `*-prototype` importa da pasta do protótipo.
- [ ] Smoke no navegador (desktop e celular): criar um programa com paciente e outro sem, com evidência.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (o paciente de outra clínica dá 422, coberto no backend).
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `002-status-e-link-ao-trocar-paciente` (o `POST` sem `status` precisa da regra no backend).

## Notas de Implementação

- **Branch:** a mesma da tarefa 001.
- **Exemplo no código:** `resources/js/pages/clinic/program/program-builder-prototype/` (de onde vem a tela); `resources/js/components/clinic/program/ProgramShareDialog.tsx` (fases e erro que o diálogo DS herda); `resources/js/test/program-builder-group-board.test.tsx`.
- **Skills:** `frontend-ddd`, `design-system` (tela v2, formulário com RHF + Zod), `frontend-testing`, `qa-navegador`.

## Como testar na mão

1. Programas → "Criar programa": o assistente abre na etapa 1, sem a barrinha de variantes.
2. Marque dois exercícios: na etapa 2, eles já mostram séries e repetições do catálogo.
3. Na etapa 3, escolha um paciente e salve: o diálogo mostra o link real, e o WhatsApp abre com a mensagem.
4. Repita sem paciente: vai para Meus modelos e o programa aparece lá.
5. Na aba Exercícios, abra um exercício → "Usar em novo programa": abre na etapa 2 com ele.
6. Em Modelos → "Usar modelo": abre na etapa 2 com os grupos do modelo.
7. Repita o passo 3 no celular (375×812).
