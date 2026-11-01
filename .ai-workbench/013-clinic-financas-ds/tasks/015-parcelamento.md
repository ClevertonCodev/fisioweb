# Parcelamento

**Tipo:** História
**Plano:** `../plans/clinic-financas-ds.md`
**Histórias:** 6, 54, 55, 56, 57, 58
**Issue:** ainda não criada

## Descrição

Uma venda ou compra parcelada vira hoje um lançamento por vez, à mão. A abordagem é um modelo de série no `ClinicFinance` que serve ao parcelamento e, na 016, à recorrência.

## O que construir

- Migration em `ClinicFinance`: `clinic_financial_series` (`kind`, dados-modelo do lançamento, `anchor_date`, `installments_total`; campos da recorrência ficam para a 016 ou já nascem nulos) e, no lançamento, `series_id` e `series_index`, com único (`series_id`, `series_index`).
- `POST transactions` aceita `repeat: { kind: 'installments', total: 2..48 }`: cria uma parcela por mês a partir da data, "Descrição (n/N)", valor e taxa divididos (centavo que sobra vai na 1ª), 1ª com o status escolhido e as outras pendentes. Devolve o 1º criado e quantos foram criados. Tudo numa transação.
- `PUT`/`DELETE` aceitam `scope=only|following`: `following` aplica a esta e às próximas parcelas pendentes. A repetição não muda na edição.
- Modal: "Repetir" (não repete / parcelado / recorrente — recorrente só na 016), número de parcelas e a prévia do valor de cada uma; editar ou excluir uma parcela pergunta "Só esta / Esta e as próximas".
- A listagem traz `series: { id, kind, index, total }`.

## Critérios de Aceite

- [x] R$ 100 em 3x → 33,34 + 33,33 + 33,33; taxa R$ 3 em 3x → 1,00 cada (teste)
- [x] Datas mês a mês; dia 31 cai no último dia dos meses curtos (teste)
- [x] 1ª com o status escolhido, outras pendentes; descrição "(n/N)" (teste)
- [x] `total` fora de 2..48 → 422 (teste)
- [x] `PUT` com `following` muda esta e as próximas pendentes, não as pagas (teste); `DELETE` com `following` manda as pendentes para a lixeira (teste)
- [x] Série de outra clínica → 404 (teste)
- [x] Modal: parcelado, prévia do valor, pergunta "Só esta / Esta e as próximas" (Vitest)
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (teste com duas clínicas)
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), com smoke headless (desktop e celular) e evidência em `evidence/015-parcelamento/`

## Depende de

- `006-lancar-editar-excluir` (Lançar, editar e excluir)

## Notas de Implementação

- **Branch:** `feat/clinic-programa-assistente-ds` (a 013 é feita na mesma branch da 012, decisão do usuário)
- **Exemplo no código:** `modules/ClinicFinance/app/Services/FinancialTransactionService.php`, `modules/ClinicFinance/app/Models/FinancialTransaction.php` (`computeNetAmount`)
- **Skills:** `backend-clean-code`, `laravel-eloquent`, `php-modern`, `php-testing`, `design-system`, `frontend-testing`

## Como testar na mão

1. Clínica A: nova saída "Maca", R$ 3.000 em 10x, a partir de 31/01, primeira paga.
2. A 1ª aparece paga; fevereiro mostra "Maca (2/10)" no dia 28 (ou 29), pendente.
3. Editar a 4ª com "esta e as próximas" mudando a categoria: 4ª a 10ª mudam, 1ª a 3ª não.
