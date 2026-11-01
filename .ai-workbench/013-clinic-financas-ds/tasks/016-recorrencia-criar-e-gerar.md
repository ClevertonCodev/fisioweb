# Recorrência: criar e gerar sozinha

**Tipo:** História
**Plano:** `../plans/clinic-financas-ds.md`
**Histórias:** 6, 59, 60, 61, 62
**Issue:** ainda não criada

## Descrição

Contas que se repetem (aluguel, internet, anuidade) são lançadas à mão todo mês. A abordagem é estender a série da 015 para recorrência, gerar as ocorrências até 12 meses à frente e um comando diário agendado que cria as próximas.

## O que construir

- Série com `kind = recurrence`, `frequency` (`weekly` | `monthly` | `yearly`), `ends_on` (nulo = sem fim) e `generated_until`.
- `POST transactions` aceita `repeat: { kind: 'recurrence', frequency, ends_on | null }`: cria as ocorrências até 12 meses à frente de hoje, sem passar do `ends_on`; a 1ª com a data e o status escolhidos, as seguintes pendentes com os mesmos dados.
- Datas: mensal no mesmo dia (31 cai no último dia dos meses curtos); anual em 29/02 cai em 28/02 nos anos não bissextos; semanal a cada 7 dias.
- Comando agendado diário do `ClinicFinance` (registrado no service provider, como o `GoogleCalendar` faz): para cada série de recorrência ativa, gera até 12 meses à frente e avança `generated_until`. Idempotente pelo único (`series_id`, `series_index`); dispara os eventos de lançamento.
- Modal: "Repetir: recorrente", frequência e "sem data para acabar" / "até".

## Critérios de Aceite

- [x] Mensal a partir de 31/01: 28 ou 29/02, 31/03, 30/04 (teste)
- [x] Anual a partir de 29/02/2028: 28/02/2029 (teste)
- [x] Semanal gera 52/53 ocorrências em 12 meses (teste)
- [x] `ends_on` respeitado na criação e no comando (teste)
- [x] Comando rodado duas vezes não duplica; depois de `travelTo` +1 mês gera a próxima (teste)
- [x] Cada ocorrência gerada tem o `clinic_id` da série (teste)
- [x] Modal: recorrente com frequência e fim (Vitest)
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (teste com duas clínicas)
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), com smoke headless (desktop e celular) e evidência em `evidence/016-recorrencia-criar-e-gerar/`

## Depende de

- `015-parcelamento` (Parcelamento)

## Notas de Implementação

- **Branch:** `feat/clinic-programa-assistente-ds` (a 013 é feita na mesma branch da 012, decisão do usuário)
- **Exemplo no código:** `modules/GoogleCalendar/app/Providers/GoogleCalendarServiceProvider.php` (comando agendado), série da 015
- **Skills:** `laravel-queues`, `backend-clean-code`, `php-modern`, `php-testing`, `design-system`, `frontend-testing`

## Como testar na mão

1. Clínica A: nova saída "Aluguel", mensal, sem fim, a partir de hoje.
2. "A pagar" de cada mês seguinte mostra o aluguel; a previsão do mês considera.
3. Rodar o comando duas vezes: nada duplica.
