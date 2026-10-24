# Nova evolução vira a Folha

**Tipo:** História
**Plano:** `../plans/clinic-prontuario-formularios-ds.md`
**Histórias:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 27, 28, 29
**Issue:** ainda não criada

## Descrição

“Nova evolução” no prontuário v2 ainda abre a gaveta da v1. O desenho
aprovado (Folha da evolução) só existe como protótipo e não grava. Esta
fatia promove a Folha a overlay de verdade, grava e assina pela API, e
tira a gaveta v1 e a pasta do protótipo.

## O que construir

- **Tela:** “Nova evolução” e “Editar rascunho” abrem a Folha B (`DsModal`
  cheio): modelo à esquerda, folha à direita; no celular a folha desce.
  Sem `?variant=` e sem barra de protótipo.
- **Modos:** “Com modelo” e “Texto livre” num seletor. Com modelo, os
  itens marcados montam o texto ao vivo no formato do backend. Texto
  livre escreve na própria folha. “Repetir a sessão” copia a última
  deste paciente.
- **Gravar:** “Salvar rascunho” e “Assinar e salvar” pelos hooks que já
  existem. Depois, a evolução aparece na aba Clínico. Título vazio
  impede salvar; assinar vazio avisa.
- **Papel:** secretária continua com o botão do prontuário desabilitado
  (009). Isolamento: Policy e 404 de outra clínica que já existem.
- **Saída:** gaveta v1 do prontuário e pasta `new-evolution`. Sem toast
  de “protótipo”.

## Critérios de Aceite

- [x] “Nova evolução” abre a Folha (não a gaveta v1); “Texto livre” grava e a evolução aparece em Clínico sem recarregar (teste).
- [x] Com modelo, o texto enviado está no formato `**Seção:**` + linhas, igual ao backend (teste da função pura).
- [x] “Assinar e salvar” chama o sign depois do create (teste).
- [x] “Editar rascunho” reabre a Folha com o título e o texto do rascunho (teste).
- [x] Secretária: “Nova evolução” `aria-disabled`; clique não abre a Folha (teste já da 009, continua passando).
- [x] Nenhum toast de “Protótipo” neste fluxo; a pasta `new-evolution` e o `EvolutionFormDrawer` no prontuário saem (teste / grep).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já. O prontuário da 009 já é a tela B.

## Notas de Implementação

- **Branch:** `feat/clinic-prontuario-formularios-ds`
- **Exemplo no código:** protótipo `new-evolution/` (VariantB, shared,
  parts); `EvolutionFormDrawer` (create → sign); `PatientRecordPage.test.tsx`.
- **Skills:** `design-system`, `frontend-ddd`, `frontend-react`,
  `frontend-testing`, `api-client`.

## Como testar na mão

1. Admin da clínica A, paciente com evolução anterior. Abra o prontuário.
2. Nova evolução: texto livre, salve rascunho, veja na aba Clínico.
3. Abra o rascunho, edite, assine. Tente editar de novo: não deixa.
4. Nova evolução com modelo: marque itens, veja a folha, assine.
5. “Repetir a sessão”: os itens da última vêm marcados.
6. Secretária no mesmo paciente: o botão não abre a Folha.
7. Clínica B no mesmo id: 404.
