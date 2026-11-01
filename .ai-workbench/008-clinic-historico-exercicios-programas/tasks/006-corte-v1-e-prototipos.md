# Corte: v1 e protótipos saem

**Tipo:** Tarefa
**Plano:** `../plans/clinic-historico-exercicios-programas.md`
**Issue:** ainda não criada

## Descrição

Com as três listagens v2 no ar, ainda podem restar `?variant=`, pastas
`*-prototype` e código da v1 dessas rotas. Esta fatia remove o caminho
antigo, documenta a substituição e deixa o `verificar.sh` verde.

## O que construir

- Remover o `PrototypeSwitcher` e `?variant=` das rotas de histórico,
  exercícios (as duas URLs) e modelos / meus-modelos.
- Apagar as pastas de protótipo dessas três telas e o código morto da v1
  das listagens (não o assistente, não o detalhe, não o enviar exercício).
- ADR curto no estilo do 016: v2 substitui v1, sem flag e sem rota
  paralela.
- Marcar as três listagens em `docs/prototipos-v2.md`; subitens de API /
  região do modelo apontam para o `DEFERRED.md` da feature (arquivo local).
- `PrototypeSwitcher` permanece no repo se agenda, prontuário ou outras
  telas ainda usam.
- Sem mudança de regra de negócio nem de API.

## Critérios de Aceite

- [ ] Build de produção e `npm run test`: as quatro URLs
      (`historico`, `exercicios` nas duas, `modelos`) não renderizam
      PrototypeSwitcher nem importam `*-prototype` (teste ou grep no CI /
      `verificar.sh`).
- [ ] Não existe `?variant=O` nessas rotas; o link direto cai na v2.
- [ ] ADR de substituição commitado.
- [ ] `docs/prototipos-v2.md` atualizado.
- [ ] `bash bin/verificar.sh` verde.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `002-acoes-reais-do-historico`
- `004-usar-exercicio-em-programa-ou-modelo`
- `005-modelos-mapa-e-acoes`

## Notas de Implementação

- **Branch:** `feat/clinic-historico-exercicios-programas`
- **Exemplo no código:** ADR 016 e o corte da lista de pacientes v2.
- **Skills:** `design-system`, `frontend-testing`.
- Não apagar protótipos de outras features.

## Como testar na mão

1. `npm run build`. Abrir as quatro URLs com e sem `?variant=A` / `O`:
   sempre a v2, sem barrinha preta.
2. Clínica Start: listagens só com dado dela.
3. Rodar `bash bin/verificar.sh`.
