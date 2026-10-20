# Mudar função de verdade (arraste, dropdown e modal)

**Tipo:** História
**Plano:** `../plans/clinic-usuarios-ds.md`
**Issue:** ainda não criada

## Descrição

Na lista v2 da tarefa 002 ainda não dá para mudar o papel sem abrir a edição. O protótipo mostrava o arraste e o modal, mas gravava um toast de stub. Esta tarefa liga a mudança à API: arrastar no desktop ou "Mudar função" no celular abre o modal com o que a pessoa ganha e perde; confirmar manda `PUT` só com a nova função.

## O que construir

- **Desktop:** puxador no cartão. Arrastar para uma função diferente na coluna da direita abre o modal. Soltar na mesma função não abre nada. Mestre não arrasta: o puxador vira coroa e explica no rótulo.
- **Celular:** "Mudar função" no cartão (dropdown com as três funções). Ausente no mestre. Ausente no último administrador ativo quando a escolha sairia de admin.
- **Modal:** nome, função de origem → destino, lista do que ganha e do que perde (diff estático das capacidades da sanfona). Cancelar fecha sem chamar a API. Confirmar chama o update só com `{ role }`, fica em carregamento, fecha em sucesso e invalida a lista.
- **Resultado:** toast de sucesso ou de erro (erro mantém o modal aberto). A lista e a contagem da sanfona atualizam.
- **Travas na tela:** mestre e último admin ativo não têm controle de rebaixar. A API da tarefa 001 já recusa com 422 se alguém chamar direto.
- **Último admin ativo:** se a clínica tem só um admin com `status` ativo, esse cartão se comporta como o mestre para mudança de função (sem arraste / sem dropdown de rebaixar).
- Guard `clinic`, só administrador (a rota já é só admin). Sem migration e sem endpoint novo.

## Critérios de Aceite

- [x] Abrir o modal (pelo dropdown, nos testes) mostra origem, destino e pelo menos uma linha de diff; Cancelar não chama o update (teste).
- [x] Confirmar chama o update com o id certo e `{ role }` da função escolhida, mostra toast de sucesso e fecha o modal (teste).
- [x] Erro da API mostra toast de erro e mantém o modal aberto (teste).
- [x] O cartão do mestre não tem "Mudar função" nem puxador de arraste (teste).
- [x] O cartão do último admin ativo não oferece destino diferente de administrador (teste).
- [x] Depois de confirmar, o cartão passa a mostrar a função nova (smoke test).
- [x] `PUT` com role no mestre ou no último admin ativo pela API direta continua 422 (smoke test; coberto pela 001).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-listagem-e-put-parcial` (PUT só com `role`, 422 de mestre e último admin).
- `002-lista-v2-em-cartoes` (cartões, sanfona e capacidades).

## Notas de Implementação

- **Branch:** `feat/user-listagem-ds`
- **Exemplo no código:** `useUpdateClinicUser` (mutation existente); o modal de diff do protótipo C; `@dnd-kit/core` já no `package.json`.
- **Skills:** `design-system` (`DsModal`, `DsDropdown`), `frontend-react`, `frontend-testing`, `security`.
- Nos testes de página, prefira o dropdown "Mudar função" ao arraste (dnd-kit é difícil no RTL). O arraste entra no smoke test no desktop.
- Toast: a mutation hoje diz "Usuário atualizado com sucesso.". Pode ficar "Função alterada." nesta chamada, sem mudar o texto das outras edições (ou parametrizar o toast).
- Não calcule o diff no backend. Reuse as constantes de capacidade da tarefa 002.

## Como testar na mão

1. `fisio-app build`. Como admin da Clínica Cleverton, em `/clinica/usuarios`.
2. Arrastar um fisioterapeuta para Secretário(a): o modal lista o que muda. Cancelar: o cartão continua Fisioterapeuta.
3. Arrastar de novo e confirmar: toast, o cartão vira Secretário(a), a contagem da sanfona muda. Conferir no `fisio-app psql` o `role`.
4. Tentar arrastar o mestre: não começa o arraste.
5. Em 375px, usar "Mudar função" no cartão de um não-mestre.
6. Como admin da Clínica Start, `PUT` no id de um usuário da Cleverton com `{ "role": "secretary" }`: 404, registro intacto.
