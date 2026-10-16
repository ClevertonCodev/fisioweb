# Estrutura: DsCard, DsKpi e DsList

**Tipo:** História
**Plano:** `../plans/design-system-v2.md`
**Issue:** ainda não criada

## Descrição

Os blocos que organizam informação nos painéis da v2. São feitos do zero.

## O que construir

- `DsCard` com as props, áreas (header, body, footer, conforme os slots do Vue) e variantes do Vue.
- `DsKpi` com valor, rótulo e tendência (`up`, `down`, `neutral`), com as cores e ícones de tendência do DS.
- `DsList` com os modos `text` e `kv` (chave e valor).
- Slots viram `children` ou props `ReactNode` com o mesmo nome. Ícones são lucide.
- Seções no catálogo.

## Critérios de Aceite

- [x] Props, modos e defaults iguais aos de `card`, `kpi` e `list` (`types.ts`).
- [x] Teste de render de cada modo e variante, incluindo as três tendências do KPI e o modo `kv` da lista.
- [x] A tendência do KPI não depende só de cor: tem ícone ou texto acessível.
- [x] Visual confere com o SCSS do Vue em light e dark, com prints na evidência.
- [x] Nenhum arquivo da v1 mudou.
- [x] Isolamento entre clínicas: não se aplica (componente sem dado).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-fundacao-tokens-tema-e-catalogo`

## Notas de Implementação

- **Branch:** `feat/design-system-v2`
- **Exemplo no código:** `resources/js/components/ui/card.tsx` e `card-list.tsx`.
- **Fonte da verdade:** `resources/design-system/components/card/`, `kpi/` e `list/`.
- **Skills:** `frontend-ui-patterns`, `frontend-testing`.

## Como testar na mão

No `/design-system`, conferir cards, KPIs com as três tendências e listas nos dois modos, em light e dark.
