# 013 · Finanças no DS v2

Hoje Finanças é uma tela v1 em que só o administrador entra, e o calendário do protótipo C é todo de mentira. Esta feature faz o calendário de caixa, o relatório e as configurações funcionarem de verdade, somando o líquido, e acrescenta parcelamento, recorrência, paciente e comprovante. Quem ganha é o administrador e a secretária que cuidam do caixa.

- **Status:** implementada; revisão adversária em 3 rodadas (Crítico da 3ª corrigido com teste, sem 4ª rodada). Pré-requisito de deploy: regra de WAF do comprovante (ADR 026).
- **Branch:** `feat/clinic-programa-assistente-ds` (a mesma da 012, por decisão do usuário)
- **Plano:** [`plans/clinic-financas-ds.md`](plans/clinic-financas-ds.md)
- **Decisões:** [`decisoes.md`](decisoes.md)
- **Módulos:** `ClinicFinance` (dono); `Patient`, `ClinicScheduling` e `Cloudflare` (só contratos públicos); SPA em `pages/clinic/finances/`, `application/clinic/`, `infrastructure/repositories/`, `domain/clinic/finance.ts`, `permissions.ts`, rotas e menu da clínica.

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [`001-acesso-secretaria-financas`](tasks/001-acesso-secretaria-financas.md) — Secretária entra em Finanças, fisioterapeuta não | concluída | | |
| [`002-casca-v2-resumo-liquido`](tasks/002-casca-v2-resumo-liquido.md) — Casca v2 real de Finanças com o resumo do mês no líquido | concluída | | |
| [`003-saldo-inicial-encadeado`](tasks/003-saldo-inicial-encadeado.md) — Saldo inicial encadeado do mês anterior, com "calculado/digitado" | concluída | | |
| [`004-calendario-de-caixa`](tasks/004-calendario-de-caixa.md) — Calendário de caixa com totais do servidor e lista do dia | concluída | | |
| [`005-pendencias-com-atrasados`](tasks/005-pendencias-com-atrasados.md) — "A receber" e "a pagar" com o mês e os atrasados | concluída | | |
| [`006-lancar-editar-excluir`](tasks/006-lancar-editar-excluir.md) — Lançar, editar e excluir de verdade | concluída | | |
| [`007-dar-baixa-com-desfazer`](tasks/007-dar-baixa-com-desfazer.md) — Dar baixa em um clique com "Desfazer" | concluída | | |
| [`008-busca-no-historico`](tasks/008-busca-no-historico.md) — Busca em todo o histórico, com filtro por tipo | concluída | | |
| [`009-configuracoes-categorias`](tasks/009-configuracoes-categorias.md) — Configurações: categorias de verdade | concluída | | |
| [`010-configuracoes-saldo-lixeira`](tasks/010-configuracoes-saldo-lixeira.md) — Configurações: saldo inicial, lixeira com restaurar e links antigos | concluída | | |
| [`011-relatorio-no-liquido`](tasks/011-relatorio-no-liquido.md) — Relatório no líquido com a % por tipo | concluída | | |
| [`012-sai-a-v1-financas`](tasks/012-sai-a-v1-financas.md) — Sai a v1 de Finanças e o `?variant=` | concluída | | |
| [`013-paciente-e-atendimento`](tasks/013-paciente-e-atendimento.md) — Paciente e atendimento no lançamento de entrada | concluída | | |
| [`014-comprovantes`](tasks/014-comprovantes.md) — Comprovantes no lançamento | concluída | | |
| [`015-parcelamento`](tasks/015-parcelamento.md) — Parcelamento | concluída | | |
| [`016-recorrencia-criar-e-gerar`](tasks/016-recorrencia-criar-e-gerar.md) — Recorrência: criar e gerar sozinha | concluída | | |
| [`017-recorrencia-editar-este-e-proximos`](tasks/017-recorrencia-editar-este-e-proximos.md) — Recorrência: editar e excluir "este e os próximos" | concluída | | |

## Pastas

- `decisoes.md`, `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
