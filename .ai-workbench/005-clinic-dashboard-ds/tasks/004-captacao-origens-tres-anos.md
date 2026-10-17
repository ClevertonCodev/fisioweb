# Captação de pacientes por origem com os três anos

**Tipo:** História
**Plano:** `../plans/clinic-dashboard-ds.md`
**Issue:** ainda não criada

## Descrição

A captação ainda não está no dashboard v2. O gráfico antigo empilhava os anos; a decisão da A foi barras por origem, cada uma mostrando os três anos que a API já devolve. Sem Chart.js.

## O que construir

- Bloco de captação em `/clinica`, alimentado por `GET /clinic/dashboard/patient-acquisition` com o mesmo `scope` do casco. Sem migration, sem endpoint novo.
- Uma linha (ou barra) por origem: rótulo, total, percentual do total, e os valores de `perYear` para cada ano em `years` (três anos).
- O recorte “Toda a clínica / Somente meus” do casco refaz este bloco. Isolamento: a API já filtra pela clínica da sessão.
- Estados de carregamento, vazio e erro do bloco.

## Critérios de Aceite

- [ ] Cada origem devolvida mostra total, percentual e os três anos da API.
- [ ] Com o toggle de escopo (admin), “Somente meus” refaz a captação com `scope=mine`.
- [ ] Sem Chart.js neste bloco; só DS.
- [ ] Teste de UI: fixture com `years` e `perYear`; cada origem renderiza os três anos.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (PHPUnit de captação já existentes; a tela só consome o hook isolado).
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-pagina-v2-casco-kpis-atalhos` (página v2 do dashboard: cumprimento, escopo, KPIs e atalhos)

## Notas de Implementação

- **Branch:** `feat/clinic-dashboard-ds`
- **Exemplo no código:** `resources/js/pages/clinic/dashboard-prototype/VariantA.tsx` (barras por origem da A), `resources/js/components/clinic/dashboard/PatientAcquisitionChart.tsx` (contrato atual), `resources/js/test/api-clinic-dashboard.test.ts`.
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`, `frontend-react`

## Como testar na mão

1. Como admin da clínica A em `/clinica`, confira uma linha por origem com total, % e os três anos visíveis.
2. Alterne o escopo: os números da captação acompanham.
3. Como fisioterapeuta: captação no recorte dele, sem toggle.
4. Tema claro e escuro.
