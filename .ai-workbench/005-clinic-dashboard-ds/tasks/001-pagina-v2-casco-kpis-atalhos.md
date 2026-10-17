# Página v2 do dashboard: cumprimento, escopo, KPIs e atalhos

**Tipo:** História
**Plano:** `../plans/clinic-dashboard-ds.md`
**Issue:** ainda não criada

## Descrição

Quem abre `/clinica` ainda cai no protótipo (dev) ou no dashboard shadcn (produção). Esta fatia coloca no ar o casco da variante A: cumprimento com o primeiro nome, data em caixa normal, toggle de escopo, quatro KPIs e as ações rápidas. Sem ocupação, captação, consultas nem atividades — esses blocos vêm nas fatias seguintes. A tela já não mistura bibliotecas: só DS v2.

## O que construir

- Tela `/clinica` no SPA da clínica, guard `clinic`. Sem migration, sem endpoint novo, sem job.
- A página deixa de montar o switcher e as variantes do protótipo. Em dev e em produção é a mesma tela v2.
- Dados só pelo summary que já existe (`GET /clinic/dashboard`, query `scope`). Papéis: o toggle “Toda a clínica / Somente meus” aparece só se `viewer.canToggleScope`. Fisioterapeuta não vê o controle e permanece no recorte que a API já manda.
- Isolamento: a página não manda `clinic_id`; o backend da sessão continua filtrando. Sem fetch fora do `apiClient`.
- Visual: raiz com tokens do DS (fundo body, Poppins, texto). KPIs com `DsKpi`. Ações rápidas levam a novo paciente, agendar, criar programa e exercícios. Data do dia em letra normal (primeira maiúscula, resto minúsculo).
- Estados de carregamento e erro do summary neste casco. Outras páginas da clínica não mudam.

## Critérios de Aceite

- [ ] `/clinica` renderiza o casco v2 em qualquer ambiente: cumprimento, data em caixa normal, quatro KPIs e atalhos.
- [ ] A página do dashboard não importa `components/ui`.
- [ ] Admin vê o toggle de escopo; ao escolher “Somente meus”, o summary é pedido com `scope=mine`.
- [ ] Fisioterapeuta não vê o toggle.
- [ ] Cada atalho navega para a rota certa (paciente novo, agenda, programa novo, exercícios).
- [ ] Há estado de carregamento e de erro do summary, visíveis sem o restante da página sumir.
- [ ] Agenda, pacientes, programas e finanças continuam como estão.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (prova: os testes PHPUnit existentes do dashboard; a tela só consome o hook já isolado).
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/clinic-dashboard-ds`
- **Exemplo no código:** `resources/js/test/ClinicTopbar.test.tsx` (RTL + papéis), `resources/js/pages/clinic/dashboard-prototype/VariantA.tsx` (referência visual, não copiar para produção), `resources/js/components/ds/kpi/DsKpi.tsx`.
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`, `frontend-react`

## Como testar na mão

1. Suba o app e entre como admin da clínica A em `/clinica`.
2. Confira cumprimento com o primeiro nome, data do dia em caixa normal (não `SÁBADO, 17 DE OUTUBRO`), quatro KPIs e os quatro atalhos.
3. Alterne “Toda a clínica” e “Somente meus” e veja os KPIs mudarem.
4. Entre como fisioterapeuta da mesma clínica: sem toggle, números no recorte dele.
5. Troque o tema no topbar: o casco acompanha claro e escuro.
6. Abra pacientes ou a agenda: continuam v1.
