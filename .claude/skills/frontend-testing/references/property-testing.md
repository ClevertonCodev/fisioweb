# Teste por propriedade (fast-check)

Um teste de exemplo confere os casos que você imaginou ("R$ 100 em 3x dá 33,34 +
33,33 + 33,33"). Um teste por propriedade confere uma regra que vale para
**qualquer** entrada ("a soma das parcelas é sempre o total"). O `fast-check`
gera centenas de entradas aleatórias. Quando uma falha, ele encolhe a entrada
até o menor caso que ainda falha e mostra esse caso como `Counterexample`.

Ele **complementa** o teste de exemplo, não substitui. Mantenha os exemplos que
documentam o comportamento e acrescente a propriedade.

## Quando usar

Só em **função pura** de `application/`, `lib/` ou `components/ds/**` com uma
regra que dá para dizer em uma frase:

| Função | Propriedade |
|---|---|
| Dinheiro e parcelas (`installmentAmounts`, `applyMoneyEdit`) | A soma fecha no centavo; nenhum valor negativo |
| Formatar e interpretar (`formatTypedTime` / `parseTime`, CPF e CNPJ) | Interpretar o que foi formatado devolve o valor original |
| Mapper ida e volta (entidade → `WriteDto` → entidade) | Ida e volta devolve o mesmo objeto |
| Filtros da URL (`parsePatientListFilters`) | Nunca lança erro, para qualquer `URLSearchParams` |
| Datas e recorrência | O fim nunca vem antes do início; N ocorrências geram N datas |

**Não use** em componente, hook React Query, Repository com `apiClient`
mockado ou regra que depende de servidor. Ali o teste de exemplo é mais
claro. No backend (PHPUnit) não usamos, porque as bibliotecas de PHP são fracas.

## Modelo

Exemplo real em `resources/js/test/finances/finance-installments.test.ts`:

```ts
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { installmentAmounts } from '@/application/clinic/finance-transaction-form';

it('para qualquer valor e número de parcelas válidos, a soma fecha no centavo', () => {
    // O formulário e o backend exigem ao menos R$ 0,01 por parcela.
    const parcelamentoValido = fc
        .integer({ min: 2, max: 48 })
        .chain((total) =>
            fc.tuple(fc.integer({ min: total, max: 100_000_000 }), fc.constant(total)),
        );

    fc.assert(
        fc.property(parcelamentoValido, ([cents, total]) => {
            const result = installmentAmounts(cents / 100, total);
            expect(result).not.toBeNull();
            const first = Math.round(result!.first * 100);
            const others = Math.round(result!.others * 100);

            expect(first + others * (total - 1)).toBe(cents);
            expect(others).toBeGreaterThanOrEqual(1);
            expect(first).toBeGreaterThanOrEqual(others);
        }),
    );
});
```

Com `Math.round` no lugar de `Math.floor` dentro da função, os testes de
exemplo continuam verdes, e este falha com um `Counterexample` como
`[[36327863,2]]`.

## Regras

- **Dinheiro em centavos inteiros** (`fc.integer`), nunca `fc.float`. O valor
  em reais é `cents / 100`, como o `DsMoneyInput` entrega.
- **Limite o gerador ao domínio real, com as mesmas regras do backend**: de 2 a
  48 parcelas e ao menos 1 centavo por parcela, como o formulário e o
  `StoreFinancialTransactionRequest` exigem. Quando um limite depende de outro
  valor, use `.chain` (o mínimo de centavos depende do número de parcelas). Um
  gerador mais largo que o backend leva a uma propriedade frouxa demais ("parcela
  pode ser zero") ou falha em entrada que nunca acontece.
- **Propriedade fraca passa com código errado.** "Não é `null`" não prova nada.
  Escreva a regra que quebraria se o cálculo estivesse errado.
- **Falhou?** Transforme o `Counterexample` num teste de exemplo com nome em
  português (`it('R$ 132.028,05 em 2x ...')`) antes de corrigir: ele documenta o
  caso e fica rápido de rodar.
- Pode deixar o padrão de 100 execuções. Só aumente (`{ numRuns: 1000 }`) se
  a função for barata e a regra for crítica.
