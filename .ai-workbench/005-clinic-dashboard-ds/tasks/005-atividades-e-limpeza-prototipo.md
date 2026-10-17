# Feed de atividades, papéis e limpeza do protótipo

**Tipo:** História
**Plano:** `../plans/clinic-dashboard-ds.md`
**Issue:** ainda não criada

## Descrição

Falta o feed de atividade recente e sobra o rascunho: switcher, variantes B/C/O e os cards shadcn do dashboard antigo. Esta fatia fecha o produto: admin/secretário veem o feed; fisioterapeuta não vê e nem dispara a query; `/clinica` fica só v2, sem `?variant=`.

## O que construir

- Bloco de atividades em `/clinica` com `GET /clinic/dashboard/activities`, só se `viewer.canViewActivities`. Fisioterapeuta (flag falsa) não monta o bloco e não chama o hook.
- Depois dos blocos no ar: remover o PrototypeSwitcher desta rota, as variantes do protótipo do dashboard e os widgets shadcn do dashboard que ninguém mais usar. Chart.js some desta tela.
- Sem migration, sem endpoint novo. Outras telas v1 continuam com shadcn. Isolamento: a API já devolve 403 para quem não pode ver; a tela nem pergunta.

## Critérios de Aceite

- [x] Admin (ou quem `canViewActivities`) vê o feed de atividade recente.
- [x] Fisioterapeuta não vê o feed e o teste garante que a query de atividades não dispara.
- [x] `/clinica` não tem barra de protótipo nem responde a `?variant=`.
- [x] A página do dashboard não importa `components/ui` nem Chart.js; os arquivos do protótipo desta tela foram removidos.
- [x] Agenda, pacientes, programas e finanças continuam v1.
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (PHPUnit de atividades já existentes).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `002-alerta-consultas-aniversariantes` (alerta da próxima sessão, consultas de hoje e aniversariantes)
- `003-ocupacao-colunas-percentual` (taxa de ocupação em colunas com percentual e tooltip)
- `004-captacao-origens-tres-anos` (captação de pacientes por origem com os três anos)

## Notas de Implementação

- **Branch:** `feat/clinic-dashboard-ds`
- **Exemplo no código:** `resources/js/components/clinic/dashboard/RecentActivities.tsx`, `resources/js/components/dev/PrototypeSwitcher.tsx`, `resources/js/pages/clinic/DashboardPage.tsx`, `resources/js/test/ClinicTopbar.test.tsx`.
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`, `frontend-react`

## Como testar na mão

1. Como admin da clínica A em `/clinica`: feed visível, sem barra flutuante de variante, sem `?variant=` na URL fazendo efeito.
2. Como fisioterapeuta: sem o bloco de atividades.
3. Navegue agenda, pacientes, programas: continuam v1.
4. Tema claro e escuro no dashboard completo.
