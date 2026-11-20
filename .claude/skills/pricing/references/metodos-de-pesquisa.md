# Métodos de pesquisa de preço

## Conteúdo
- Antes de pesquisar: o tamanho da base
- Van Westendorp (as quatro perguntas, como analisar, dicas, exemplo de resultado)
- MaxDiff (como funciona, exemplo de pergunta, análise, uso para montar planos)
- Pesquisa de disposição a pagar
- Relação entre uso e valor

## Antes de pesquisar: o tamanho da base

Os métodos com questionário pedem dezenas ou centenas de respostas. Pergunte ao
usuário quantas clínicas pagam e quantas aceitariam responder. Com uma base
pequena:

- Prefira **entrevistas** (5 a 10 conversas com donos de clínica rendem mais que
  um questionário com 15 respostas).
- Prefira **teste com clínicas novas** (preço diferente para quem se cadastra)
  a curvas estatísticas.
- Se rodar o questionário mesmo assim, diga no resultado que a amostra é pequena
  e trate os números como indício, não como medida.

O fisioweb não tem analytics nem gateway de pagamento: toda resposta de
pesquisa e todo dado de uso vêm do usuário. Não invente resultado.

---

## Van Westendorp (medidor de sensibilidade a preço)

O questionário de Van Westendorp mostra a faixa de preço aceitável para o
produto.

### As quatro perguntas

Pergunte a cada pessoa (no fisioweb, deixe claro se o preço é por usuário ou por
clínica, e por mês):
1. "A partir de qual preço você acharia o [produto] tão caro que nem
   consideraria comprar?" (Caro demais)
2. "A partir de qual preço você acharia o [produto] tão barato que desconfiaria
   da qualidade?" (Barato demais)
3. "A partir de qual preço você acharia o [produto] começando a ficar caro, mas
   ainda consideraria?" (Caro)
4. "A partir de qual preço você acharia o [produto] uma pechincha, uma ótima
   compra pelo que custa?" (Barato, bom negócio)

### Como analisar

1. Valide as respostas numa mesma moeda, mesmo período de cobrança e mesma
   descrição de produto. Marque respostas em branco, não numéricas ou fora de
   ordem (`barato demais ≤ barato ≤ caro ≤ caro demais`); registre o que foi
   excluído em vez de mudar respostas em silêncio.
2. Monte o gráfico com o preço candidato no eixo x e a parcela de pessoas no
   eixo y. As duas curvas de barato descem conforme o preço sobe; as duas de
   caro sobem. Em cada preço candidato `p`, use:

   | Curva | Parcela a marcar | Direção |
   |-------|------------------|---------|
   | Barato demais | Pessoas cujo limite de barato demais é maior ou igual a `p` | Desce |
   | Barato / bom negócio | Pessoas cujo limite de barato é maior ou igual a `p` | Desce |
   | Caro | Pessoas cujo limite de caro é menor ou igual a `p` | Sobe |
   | Caro demais | Pessoas cujo limite de caro demais é menor ou igual a `p` | Sobe |

   Use sempre a mesma regra para empates e registre qual foi. Não aplique uma
   distribuição acumulada crescente às quatro perguntas: isso inverte o sentido
   das curvas de barato. O [exemplo da Sawtooth](https://sawtoothsoftware.com/resources/blog/posts/van-westendorp-pricing-sensitivity-meter)
   mostra a parcela de "barato demais" caindo conforme o preço sobe.
3. Ache os cruzamentos:
   - **Ponto de Barateza Marginal (PMC):** "Barato demais" cruza "Caro".
   - **Ponto de Carestia Marginal (PME):** "Caro demais" cruza "Barato".
   - **Ponto de Preço Ótimo (OPP):** "Barato demais" cruza "Caro demais".
   - **Ponto de Indiferença (IDP):** "Caro" cruza "Barato".

**Faixa de preço aceitável:** do PMC ao PME.
**Preços candidatos a testar:** OPP e IDP ajudam a montar uma lista curta; não
definem uma faixa economicamente ótima.

As quatro perguntas medem percepção de preço, não probabilidade de compra. Antes
de prever demanda, use pesquisa de intenção de compra (como a extensão
Newton-Miller-Smith, deixando claras as suposições), um estudo de escolha ou
teste de preço de verdade. Compare receita, margem e retenção; um preço
aceitável mais alto não garante a mesma demanda. Veja a
[explicação da Sawtooth sobre o método e seus limites](https://sawtoothsoftware.com/resources/blog/posts/van-westendorp-pricing-sensitivity-meter).

### Dicas para o questionário
- No mercado, recomenda-se de 100 a 300 respostas para um dado confiável. Com
  menos, veja "Antes de pesquisar" acima.
- Separe por perfil (fisioterapeuta sozinho e clínica com equipe têm disposição
  a pagar diferente).
- Use uma descrição realista do produto (o que o plano inclui).
- Considere acrescentar perguntas de intenção de compra.

### Exemplo de resultado

Números ilustrativos, para mostrar o formato; não são pesquisa real.

```
Análise de sensibilidade a preço (Performance, por usuário, por mês):
─────────────────────────────────────────────────────────────────────
Ponto de Barateza Marginal:  R$ 18
Ponto de Preço Ótimo:        R$ 28
Ponto de Indiferença:        R$ 32
Ponto de Carestia Marginal:  R$ 45

Preços candidatos a testar: R$ 28 e R$ 32
Preço atual: R$ 30
Variação: -6,7% e +6,7%
Efeito em demanda, conversão e cancelamento: não medido por estas quatro perguntas
Próximo passo: validar o comportamento de compra e a margem antes de aplicar
```

---

## MaxDiff (escala melhor-pior)

O MaxDiff mostra quais funcionalidades as clínicas mais valorizam e orienta o
que entra em cada plano.

### Como funciona

1. Liste de 8 a 15 funcionalidades que poderiam entrar.
2. Mostre grupos de 4 ou 5 por vez.
3. Pergunte: "Qual é a MAIS importante? Qual é a MENOS importante?"
4. Repita com vários grupos até comparar todas.
5. A análise estatística gera uma nota de importância para cada uma.

### Exemplo de pergunta

```
Qual destas é a MAIS importante para a sua clínica?
Qual destas é a MENOS importante?

□ Agenda da equipe
□ Programa de exercícios para o paciente fazer em casa
□ App do paciente
□ Controle financeiro da clínica
□ Integração com o Google Agenda
```

### Analisar o resultado

As funcionalidades são ordenadas pela nota:
- Nota alta = indispensável (entra no plano de entrada).
- Nota média = diferencial (usar para separar planos).
- Nota baixa = bom de ter (plano completo ou corte).

### Usar o MaxDiff para montar planos

| Nota (posição) | Decisão de pacote |
|----------------|-------------------|
| 20% de cima | Em todos os planos (o mínimo esperado) |
| 20 a 50% | Usar para diferenciar os planos |
| 50 a 80% | Só nos planos de cima |
| 20% de baixo | Pensar em cortar ou vender avulso (`value_isolated`) |

---

## Pesquisa de disposição a pagar

**Método direto (simples, mas enviesado):**
"Quanto você pagaria pelo [produto]?"

**Melhor: método Gabor-Granger:**
"Você compraria o [produto] por R$ X?" (Sim/Não)
Varie o preço entre as pessoas para montar uma curva de demanda.

**Melhor ainda: análise conjunta (conjoint):**
Mostre pacotes de produto com preços diferentes.
A pessoa escolhe o que prefere.
A análise estatística mostra a sensibilidade a preço de cada funcionalidade.

---

## Relação entre uso e valor

### 1. Meça o uso

Descubra como as clínicas usam o produto:
- Frequência de uso de cada funcionalidade.
- Volume (usuários, pacientes ativos, consultas na agenda, programas enviados).
- Resultado (faltas evitadas, tempo economizado, pacientes que fazem os
  exercícios).

No fisioweb não há analytics. Contagens por clínica (usuários, pacientes,
consultas, programas) dariam para tirar do banco de produção, mas o banco local
é de desenvolvimento e não serve. Peça os números ao usuário ou proponha a
consulta para ele rodar; criar medição de uso é tarefa nova pelo `refinar`.

### 2. Cruze com o sucesso do cliente
- Que padrão de uso indica que a clínica fica?
- Que padrão indica que ela cresce (mais usuários, plano maior)?
- Quais clínicas pagam mais, e por quê?

### 3. Ache os pontos de virada
- A partir de que uso a clínica "entende" o produto?
- A partir de que uso ela cresce?
- A partir de que uso o preço deveria subir?

### Exemplo de análise

Números ilustrativos, para mostrar o formato; não são dado real.

```
Relação entre uso e valor:
──────────────────────────
Segmento: clínicas que ficam há mais de 1 ano
Usuários ativos por mês, em média: 6
Programas de exercício enviados por mês: 40
Usam a Agenda: 90%

Segmento: clínicas que cancelaram
Usuários ativos por mês, em média: 1
Programas de exercício enviados por mês: 2
Usam a Agenda: 20%

Leitura: o valor acompanha a adoção pela equipe (usuários)
         e o uso de programas e agenda

Recomendação: manter a cobrança por usuário e usar Programas e Agenda
              para separar os planos
```
