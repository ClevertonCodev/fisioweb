# Modelos de preço

As oito formas principais de estruturar **como** você cobra. Isso é diferente da
métrica de valor (a unidade pela qual se cobra) e da estrutura de planos (como
se monta o pacote). A maioria dos produtos reais **combina** dois ou mais.

## Conteúdo
- Os 8 modelos de preço
- Combinar modelos
- A relação entre valor e preço
- O contraponto do preço baixo e da retenção

---

## Os 8 modelos de preço

| Modelo | Como funciona | Melhor quando | Referência |
|--------|---------------|---------------|------------|
| **Fixo** | Um preço, um produto, todo mundo paga igual | Produto simples, um perfil de cliente, você quer zero atrito no preço | Basecamp |
| **Por uso** | Paga pelo que consome (medido) | O valor cresce direto com o volume; consumo variável e fácil de medir | Stripe |
| **Por plano** | Pacotes bom, melhor, ótimo com preço definido | Segmentos com necessidades e orçamentos diferentes | Kinsta |
| **Por usuário** | Preço por usuário (assento) | O valor cresce quando mais gente da empresa usa (trabalho em equipe) | Notion |
| **Por funcionalidade** | O preço depende de quais recursos estão liberados | Funcionalidades bem separadas que acompanham a disposição a pagar | Intercom |
| **Por crédito** | Compra um pacote de créditos e gasta em ações | Uso irregular ou em picos; você quer pagamento antecipado e conta mental simples | Audible |
| **Por resultado** | Paga por resultado entregue (atendimento resolvido, tarefa concluída) | O resultado é medível e atribuível a você, e é o que o cliente quer de fato | Intercom Fin, Zapier |
| **Híbrido** | Mistura proposital (taxa fixa + uso, ou usuários + créditos) | Um modelo só cobra de menos ou de mais de clientes diferentes | Drift |

### O fisioweb hoje

O fisioweb combina **por plano** (Start, Performance, Premium) com **por
usuário** (`Plan::TYPE_CHARGE_POR_USUARIO`), e tem o desenho de um terceiro,
**por funcionalidade**, no `value_isolated` de cada `Feature` (Agenda R$ 10,
Programas e Exercícios R$ 15, Finanças R$ 5, App R$ 20). O modelo **fixo** existe
no código (`Plan::TYPE_CHARGE_FIXO`), mas nenhum plano usa.

### Quando usar cada um

- **Fixo**: tente primeiro, se der. É o mais fácil de vender, de entender e de
  prever. A desvantagem: deixa dinheiro na mesa com os maiores clientes. No
  fisioweb, um valor fixo por clínica cobraria igual da clínica com 1
  fisioterapeuta e da clínica com 8.
- **Por uso**: o modelo mais justo quando o consumo acompanha o valor, mas a
  receita fica menos previsível e o cliente teme uma conta surpresa. Combine com
  teto de gasto ou aviso.
- **Por plano**: o padrão para SaaS em que o cliente compra sozinho. Uma página
  só atende do pequeno ao médio.
- **Por usuário**: só se o valor cresce de verdade com o número de pessoas. Se
  não cresce, cobrar por usuário pune a adoção (a equipe divide login para não
  pagar). No fisioweb, a pergunta é se a secretária, que agenda mas não atende,
  deve pagar o mesmo que o fisioterapeuta.
- **Por funcionalidade**: forte para segmentar, mas não trave a funcionalidade
  que entrega o valor central; trave as que separam quem usa de leve de quem usa
  a sério. No fisioweb, o Start não tem funcionalidade extra: o que ele inclui
  é o centro do produto, e vale conferir se entrega valor suficiente sozinho. O
  App do paciente é candidato natural a separar quem acompanha o exercício em
  casa de quem não acompanha.
- **Por crédito**: bom para produto em que cada ação tem custo (IA, envio de
  mensagem). Crédito desacopla o preço de uma unidade só e faz o pagamento
  antecipado parecer natural.
- **Por resultado**: o modelo que surge para agentes de IA (cobrar por
  atendimento resolvido, por automação executada). É o que gera mais confiança,
  porque o cliente só paga quando ganha, mas só funciona se o resultado for
  medível e claramente atribuível a você.
- **Híbrido**: onde a maioria dos produtos maduros termina. Uma taxa base para
  dar previsibilidade e uma parte por uso ou por resultado para capturar o
  crescimento.

---

## Combinar modelos

Eles não se excluem. Combinações comuns:

- **Planos + por usuário**: usuários dentro de cada pacote (a maioria dos SaaS
  B2B, e o fisioweb hoje).
- **Taxa fixa + uso**: base previsível, parte variável (estilo Twilio). Exemplo
  ilustrativo no fisioweb: uma taxa por clínica mais um valor por profissional
  que atende.
- **Usuários + créditos**: paga por pessoa e completa créditos para ações
  pesadas.
- **Planos por funcionalidade + resultado**: libera recursos por plano e cobra
  por resultado em cima.
- **Planos + funcionalidade avulsa**: o cliente de um plano mais barato compra
  só a funcionalidade que falta (o papel possível do `value_isolated`).

Escolha o modelo principal a partir da métrica de valor e acrescente um segundo
só se um modelo sozinho cobrar claramente errado de um segmento real.

---

## A relação entre valor e preço

Mire numa relação de mais ou menos **10 para 1 entre valor e preço** (Ryan
Kulp): a clínica deve perceber cerca de **10 vezes mais valor do que paga**.
Essa folga faz a compra parecer óbvia em vez de negociada e deixa espaço para
subir o preço depois, conforme você entrega mais valor.

Exemplo de como montar a conta no fisioweb (os números são do usuário, não
invente): se a Agenda e o App evitam faltas e cada consulta perdida custa à
clínica um valor X, quantas consultas salvas por mês pagam 10 vezes o preço do
usuário? Sem o valor da consulta e a taxa de faltas, a conta fica como
Hipótese.

Se você não consegue mostrar 10 vezes de valor, o problema costuma ser a oferta
ou o posicionamento, não o preço.

---

## O contraponto do preço baixo e da retenção

Cobrar pouco não é a escolha segura. **Preço baixo piora a retenção** (dados de
Patrick Campbell / ProfitWell, repetidos por Josh Pigford e Tyler Tringas):
clientes com preço baixo cancelam **mais**, não menos, porque preço baixo
sinaliza pouco valor e atrai os compradores menos comprometidos e mais
sensíveis a preço.

Relacionado: o **sinal de quem pede desconto**. Clientes que negociam desconto
tendem a cancelar cerca de **2 vezes** mais que os que pagam o preço cheio. Dar
desconto para fechar uma venda muitas vezes compra um cliente que sai mesmo
assim.

**Consequência:** na dúvida, cobre mais. É mais fácil baixar o preço para quem
já é cliente do que subir depois, e um preço maior atrai clientes que combinam
mais com o produto e ficam mais tempo.
