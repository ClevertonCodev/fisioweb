---
name: pricing
description: "Estratégia de preço e planos do fisioweb: quanto cobrar, o que entra em cada plano (Start, Performance, Premium), métrica de valor (por usuário, por profissional, por clínica, funcionalidade avulsa), desconto do anual, teste grátis, aumento de preço e como levar quem já é cliente, pesquisa de disposição a pagar e análise da página de preços. Entrega análise e recomendação; não muda código nem o seeder. Fora do ciclo do harness: só roda quando o usuário chamar."
disable-model-invocation: true
---

# Preço e planos do fisioweb

Você ajuda a decidir o preço e os planos do fisioweb (SaaS para clínicas de
fisioterapia) para que o preço capture o valor entregue, ajude a clínica a
crescer dentro do produto e caiba no que ela aceita pagar.

Origem: `pricing` do pacote "50 skills de IA" (Alura), traduzida e adaptada ao fisioweb.

**Fora do ciclo do harness.** Não é etapa do `refinar` → `escrever-plano` →
`criar-tarefas` → `implementar-tarefa`, não conta para a Definição de Pronto e
**não muda código nem o `PlanFeatureSeeder.php`**. Entrega análise e
recomendação na conversa. Mudar preço, plano ou funcionalidade no sistema é
tarefa separada, que começa pela skill `refinar`, como qualquer pedido. Se o
usuário quiser guardar a análise, grave em `.ai-workbench/<feature>/precos.md`
da feature que ele indicar.

## Antes de começar

**1. Leia os planos reais no código.** Não pergunte o que o código responde:

- `modules/Admin/database/seeders/PlanFeatureSeeder.php`: planos, preços,
  funcionalidades e quais entram em cada plano.
- `modules/Admin/app/Models/Plan.php`, `Feature.php` e `FeaturePlan.php`:
  campos e constantes (`Plan::TYPE_CHARGE_POR_USUARIO`, `Plan::TYPE_CHARGE_FIXO`,
  `Feature::KEY_*`).
- `modules/Clinic/app/Models/ClinicUser.php`: papéis de usuário
  (`ROLE_ADMIN`, `ROLE_PHYSIOTHERAPIST`, `ROLE_SECRETARY`) e `ATTENDABLE_ROLES`
  (quem atende paciente).
- `modules/Clinic/app/Services/ClinicRegistrationService.php`: em qual plano a
  clínica entra quando se cadastra sozinha (`DEFAULT_PLAN_NAME`).
- Telas do admin em `resources/js/pages/admin/plan/` e
  `resources/js/pages/admin/feature/`: como os campos aparecem para quem
  cadastra o plano.

Não leia nem crie `.agents/` (o `AGENTS.md` proíbe essa pasta).

**2. Pergunte só o que o código não diz.** Uma pergunta por vez, com a
recomendação primeiro:

- Quantas clínicas pagam hoje, e em qual plano.
- Quantos usuários por clínica, em média, e de que papel (só o dono
  fisioterapeuta, fisioterapeutas contratados, secretária).
- Se a secretária conta como usuário pago.
- Se `value_isolated` é cobrado por usuário ou por clínica, e se alguém já
  comprou funcionalidade avulsa.
- Cancelamento (churn: a parcela de clínicas que cancela por mês) e o motivo
  quando se sabe.
- Conversão: de cada 100 clínicas que se cadastram, quantas passam a pagar.
- ARPU (receita média por clínica por mês).
- Preço da concorrência que as clínicas citam, e o que elas usavam antes
  (planilha, agenda de papel, outro sistema).
- Meta: crescer em número de clínicas, aumentar receita por clínica ou margem;
  subir para clínicas maiores ou descer para profissional sozinho.

**3. Números de negócio nunca se inventam.** O fisioweb não tem gateway de
pagamento nem analytics, então conversão, churn, ARPU, base de clientes e
preço da concorrência só existem se o usuário disser. O banco local é de
desenvolvimento e não representa clientes reais. Sem o dado, pergunte ou
escreva **Hipótese** ao lado do número e diga como confirmar.

## O fisioweb hoje (o que o código diz)

Os três planos são cobrados **por usuário** (`type_charge = por_usuario`). O
sistema também aceita `fixo` (`Plan::TYPE_CHARGE_FIXO`), mas nenhum plano usa.

| Plano | `value_month` | `value_year` | Funcionalidades |
|-------|---------------|--------------|-----------------|
| Start | R$ 20 | R$ 15 | nenhuma extra |
| Performance | R$ 30 | R$ 25 | Agenda, Programas e Exercícios, Finanças |
| Premium | R$ 40 | R$ 35 | Agenda, Programas e Exercícios, Finanças, App |

| Funcionalidade (`Feature::KEY_*`) | `value_isolated` |
|-----------------------------------|------------------|
| Agenda (`agenda`) | R$ 10 |
| Programas e Exercícios (`programas_exercicios`) | R$ 15 |
| Finanças (`financas`) | R$ 5 |
| App (`app`) | R$ 20 |

Cuidados ao ler esses números:

- **`value_year`**: a tela do admin chama o campo de "Valor Anual", mas os
  valores (15, 25, 35) são menores que os mensais. O mais provável é que seja o
  preço **por mês** de quem fecha o plano anual (por usuário), e não o total do
  ano. Nenhum código calcula cobrança com esse campo. Confirme com o usuário
  antes de usar em conta. Se for isso, o desconto do anual é de 25% no Start,
  16,7% no Performance e 12,5% no Premium: o desconto diminui conforme o plano
  sobe.
- **`value_isolated`**: o código não diz se é por usuário ou por clínica, nem
  em qual plano a funcionalidade pode ser comprada avulsa. Pergunte.
- **Plano de entrada no cadastro**: a clínica que se cadastra sozinha entra no
  Premium (`ClinicRegistrationService::DEFAULT_PLAN_NAME`). Não há prazo de
  teste grátis no código. Pergunte o que acontece depois (vira cobrança no
  Premium, cai para outro plano, alguém do comercial liga).
- **Funcionalidade "travada" por plano**: o vínculo plano↔funcionalidade é
  cadastrado no admin (`FeaturePlan`). Antes de afirmar que uma clínica do Start
  não acessa a Agenda, confira no código se o lado da clínica respeita esse
  vínculo.

---

## Fundamentos

### Os três eixos do preço

**1. Pacote**: o que entra em cada plano.
- Funcionalidades, limites, nível de suporte.
- Como os planos se diferenciam.
- No fisioweb: Start, Performance e Premium se diferenciam por funcionalidade.

**2. Métrica de valor**: pelo que se cobra.
- Por usuário, por uso, valor fixo.
- Como o preço cresce junto com o valor.
- No fisioweb: por usuário.

**3. Valor**: quanto se cobra.
- O número em reais.
- Valor percebido contra custo.

### Preço baseado em valor

O preço sai do valor entregue, não do custo de servir:

- **Valor percebido pela clínica**: o teto.
- **Seu preço**: entre a próxima alternativa e o valor percebido.
- **Próxima melhor alternativa**: o piso para se diferenciar (planilha, agenda
  de papel, outro sistema de clínica).
- **Seu custo de servir**: só uma referência mínima, nunca a base.

**Ideia central:** cobre entre a próxima melhor alternativa e o valor
percebido.

**Não se ancore no lugar errado:**
- **Não no concorrente.** Copiar o preço do concorrente copia a estratégia dele,
  não a economia dele. É um dado, não uma meta.
- **Não no custo.** Custo é piso, nunca a base. Valor e diferenciação definem o
  preço.

---

## Primeiro preço: escolha um preço com que dê para aprender

O fisioweb já tem preço. Esta seção vale quando aparece algo sem preço: uma
funcionalidade nova, um plano novo, um público novo (profissional sozinho, rede
de clínicas).

As ferramentas abaixo (métrica de valor, planos, Van Westendorp) servem para
**ajustar** um preço. No primeiro dia não há preço para ajustar: há uma aposta
a fazer. O objetivo do primeiro preço é **aprender**, não acertar. Escolha um
número, lance, e deixe quem compra dizer se está errado.

### Ordem de grandeza

Sem nenhum dado, comece pela ordem de grandeza que combina com quem você
atende:

- **Dezenas de reais por mês**: profissional sozinho, muito volume, pouco
  contato.
- **Centenas de reais por mês**: clínica com equipe; é onde fica a maior parte
  dos SaaS para pequenas empresas.
- **Milhares de reais por mês**: rede de clínicas, uso crítico, venda com
  contato do comercial.

No fisioweb, R$ 20 a R$ 40 por usuário põe o fisioterapeuta sozinho na faixa de
dezenas e a clínica com 5 usuários (R$ 150 a R$ 200 por mês) na faixa de
centenas. Escolha a faixa por **quem é o cliente e quanto valor você entrega**
e comece perto de um número redondo. Dentro da faixa dá para mexer rápido
quando aparecer sinal.

### A armadilha do preço baixíssimo

Resista a cobrar muito pouco (por exemplo R$ 9,90 por mês) para diminuir o
atrito. Preço baixíssimo:
- Cria **tração falsa**: cadastros que parecem validação, mas vêm de quem nunca
  pagaria um preço de verdade.
- **Prende você**: subir o preço 5 a 10 vezes depois é muito mais difícil do
  que ter começado mais alto, e os clientes mais baratos são os que mais
  cancelam e mais reclamam (veja [references/modelos-de-preco.md](references/modelos-de-preco.md),
  sobre preço baixo e retenção).

Redondo e um pouco mais alto ganha de esperto e barato.

### Cobre e veja o que acontece

Quando a Intercom, no começo, travou discutindo preço, o conselho de Jason
Fried foi, em resumo: cobre um número e veja o que acontece. Pare de modelar e
pegue um sinal real. Se as clínicas pagam sem hesitar, suba. Se ninguém compra,
você aprendeu algo ao custo de uma semana, não de um trimestre.

**Para as oito formas de cobrar (fixo, por uso, por plano, por usuário, por
funcionalidade, por crédito, por resultado, híbrido) e a relação entre valor e
preço:** veja [references/modelos-de-preco.md](references/modelos-de-preco.md).

---

## Métrica de valor

### O que é

A métrica de valor é **pelo que** você cobra. Ela deve crescer junto com o
valor que a clínica recebe.

**Uma boa métrica de valor:**
- Acompanha o valor entregue.
- É fácil de entender.
- Cresce quando a clínica cresce.
- É difícil de burlar.

### Métricas comuns, e como ficariam no fisioweb

| Métrica | Serve para | No fisioweb |
|---------|------------|-------------|
| Por usuário | Ferramenta usada por uma equipe | O modelo atual: cada login da clínica paga |
| Por profissional que atende | Valor ligado a quem gera consulta | Cobrar só `ATTENDABLE_ROLES` (admin e fisioterapeuta); a secretária não pagaria |
| Por funcionalidade | Produto em módulos | `value_isolated`: Agenda, Programas e Exercícios, Finanças, App avulsos |
| Por paciente ativo | Valor cresce com o volume atendido | Hipótese a pesquisar; o código não cobra assim |
| Por uso | Consumo variável | Ex.: programas enviados ou acessos ao App; hoje não há medição |
| Valor fixo por clínica | Produto simples | `Plan::TYPE_CHARGE_FIXO` existe, mas nenhum plano usa |

### Como escolher

Pergunte: "Quando a clínica usa mais [métrica], ela recebe mais valor?"
- Se sim, é uma boa métrica de valor.
- Se não, o preço não acompanha o valor.

Exemplo: uma clínica com 1 fisioterapeuta e uma com 4 fisioterapeutas e 1
secretária recebem valores bem diferentes do fisioweb, e a cobrança por usuário
captura isso (1 × R$ 30 contra 5 × R$ 30 no Performance). Mas a secretária
agenda e cadastra paciente, e não atende: se ela paga o mesmo que o
fisioterapeuta, a clínica pode preferir dividir login para economizar. Essa é
a pergunta a fazer antes de mudar a métrica.

**A métrica de valor escolhe o modelo de preço.** Depois de saber o que cresce
junto com o valor, escolha como cobrar por ela: fixo, por uso, por plano, por
usuário, por funcionalidade, por crédito, por resultado ou híbrido. Veja
[references/modelos-de-preco.md](references/modelos-de-preco.md).

---

## Estrutura de planos

### Bom, Melhor, Ótimo

**Plano de entrada (Bom):** o essencial, uso limitado, preço baixo.
**Plano recomendado (Melhor):** tudo o que importa, limites razoáveis, preço
âncora.
**Plano completo (Ótimo):** tudo, recursos avançados; no mercado, costuma
custar 2 a 3 vezes o recomendado.

No fisioweb: Start é o de entrada, Performance o recomendado e Premium o
completo. O Premium custa 1,33 vez o Performance (R$ 40 contra R$ 30), bem
abaixo da faixa comum de 2 a 3 vezes. Isso não é erro por si só, mas é um ponto
a analisar: o único item a mais é o App, que avulso vale R$ 20, e o Premium
cobra R$ 10 a mais por ele.

### Como diferenciar planos

- **Por funcionalidade**: básico contra avançado (o que o fisioweb faz hoje).
- **Por limite de uso**: mesmas funcionalidades, limites diferentes.
- **Por suporte**: e-mail, prioritário, atendimento dedicado.
- **Por acesso**: integrações, login único da empresa, marca própria.

**Para estruturas detalhadas, pacote por perfil de cliente, freemium contra
teste grátis e plano para redes de clínicas:** veja
[references/estrutura-de-planos.md](references/estrutura-de-planos.md).

---

## Pesquisa de preço

### Van Westendorp

Quatro perguntas que mostram a faixa de preço aceitável:
1. Caro demais (nem consideraria).
2. Barato demais (desconfiaria da qualidade).
3. Caro, mas ainda consideraria.
4. Uma pechincha.

Use os cruzamentos das curvas para achar a faixa aceitável e preços candidatos
a testar. O chamado "Ponto de Preço Ótimo" é um cruzamento da pesquisa, não
prova de receita ou lucro máximo. As quatro perguntas sozinhas não estimam
conversão, cancelamento nem demanda num preço novo.

### MaxDiff

Mostra quais funcionalidades as clínicas valorizam mais:
- Mostre grupos de funcionalidades.
- Pergunte: qual a mais importante? E a menos importante?
- O resultado orienta o que entra em cada plano.

**Para os métodos em detalhe, com exemplos do fisioweb e o cuidado com base
pequena de clientes:** veja [references/metodos-de-pesquisa.md](references/metodos-de-pesquisa.md).

---

## Quando aumentar o preço

### Sinais de que chegou a hora

**Mercado:**
- A concorrência subiu o preço.
- Clínicas interessadas não hesitam no preço.
- Comentários do tipo "é muito barato!".

**Negócio** (todos dependem de número que o usuário precisa informar):
- Conversão muito alta (acima de 40%).
- Cancelamento muito baixo (abaixo de 3% ao mês).
- Margem por cliente saudável.

**Produto:**
- Muito valor novo desde o último ajuste (ex.: o App do paciente, a integração
  com o Google Agenda, o prontuário).
- Produto mais maduro e estável.

### Formas de aumentar

1. **Manter o preço antigo para quem já é cliente**: preço novo só para clínicas
   novas.
2. **Aumento com aviso**: anunciar com 3 a 6 meses de antecedência.
3. **Atrelado a valor**: subir o preço e acrescentar funcionalidade.
4. **Reestruturar os planos**: trocar os planos inteiros.

### Como aplicar

Mudança de preço se aplica aos poucos, não de uma vez:

1. **Teste primeiro em clínicas novas.** Suba o preço só para quem se cadastra
   e acompanhe a conversão. Cliente novo não tem preço antigo como referência
   nem relação em jogo, então dá uma leitura limpa de se o mercado aceita o
   número, antes de mexer em qualquer clínica que já paga.
2. **Não mantenha o preço antigo para sempre por reflexo.** Parece gentil, mas
   pode deixar muito dinheiro na mesa. Faça a conta: uma clínica com 5 usuários
   no Performance a R$ 30 que passaria a R$ 40 deixa de pagar R$ 50 por mês,
   R$ 600 por ano, e isso se repete em cada clínica antiga. Mantenha o preço
   antigo como **transição** (um prazo de carência), não como isenção
   permanente.
3. **Comece pequeno e amplie aos poucos.** Mude primeiro 5 a 10% das clínicas
   que já pagam. Acompanhe cancelamento e chamados de suporte por um ciclo de
   cobrança e amplie em ondas. Assim o estrago fica contido e dá para voltar
   atrás se o cancelamento disparar. Com uma base pequena, 5% pode ser uma ou
   duas clínicas: aí vale mais conversar com elas do que medir.
4. **Explique o motivo com meses de antecedência e com uma oferta generosa.**
   Diga por que o preço muda (em geral: mais valor entregue) bem antes. Suavize:
   manter o preço antigo para quem fechar o anual agora, prazo de carência
   maior ou um crédito único. Aviso com antecedência e uma opção generosa
   transformam um momento de ressentimento em lealdade.

Espere, e aceite, algum cancelamento. As clínicas mais propensas a sair por um
aumento justo costumam ser as menos lucrativas, as que mais pedem suporte e as
mais sensíveis a preço.

---

## Página de preços: boas práticas

Não há página de preços no repositório do fisioweb. Esta seção vale para a
página do site institucional ou para desenhar uma tela de planos no sistema
(nesse caso, a tela segue pelo `refinar` e pode começar por variantes na skill
`prototype`).

### No topo da página
- Tabela clara comparando os planos.
- Plano recomendado em destaque (no fisioweb, em geral o Performance).
- Alternância mensal e anual.
- Um botão de ação em cada plano.

### Elementos comuns
- Tabela de funcionalidades por plano.
- Para quem é cada plano ("fisioterapeuta sozinho", "clínica com equipe").
- Perguntas frequentes.
- Destaque do desconto do anual (no mercado é comum 15 a 20%; "2 meses
  grátis" dá 16,7%).
- Garantia de devolução do dinheiro.
- Logos de clientes e sinais de confiança.
- Se a cobrança é por usuário, deixe explícito quem conta como usuário e mostre
  um exemplo de conta ("clínica com 3 fisioterapeutas e 1 secretária: 4 × R$ 30
  = R$ 120 por mês").

### Psicologia de preço
- **Âncora**: mostre a opção mais cara primeiro ou em destaque.
- **Efeito chamariz**: o plano do meio deve parecer o melhor negócio. No
  fisioweb, as três funcionalidades do Performance compradas avulsas custam
  R$ 30 (10 + 15 + 5) por cima do Start; o Performance custa só R$ 10 a mais
  que o Start. Isso faz o Performance parecer vantajoso, desde que a página
  mostre o preço avulso (a conta supõe `value_isolated` por usuário; confirme).
- **Preço quebrado**: R$ 39,90 em vez de R$ 40 (para quem compra pelo preço).
- **Preço redondo**: R$ 40 em vez de R$ 39,90 (para posicionamento premium).

---

## Análise da página de preços

Quando pedirem para avaliar uma página de preços existente quanto a clareza,
transparência e leitura por IA (não a estratégia de preço em si, e não a
otimização de conversão), faça uma análise que dá nota em dois eixos e devolve
correções em ordem de prioridade:

- **Experiência de quem compra**: clareza da proposta de valor, diferença entre
  planos, esforço para decidir, sinais de confiança, psicologia de preço e
  transparência do preço.
- **Leitura por agentes de IA**: se os modelos de linguagem e agentes, que cada
  vez mais fazem a lista curta e comparam ferramentas, conseguem ler e citar o
  seu preço. Preço em texto (não preso numa imagem nem atrás de "Fale
  conosco"), perguntas frequentes que dá para extrair, o que cada plano inclui
  escrito em texto, e dados estruturados. Hoje o dono de clínica pergunta ao
  ChatGPT, ao Perplexity ou ao Claude "qual o melhor sistema para clínica de
  fisioterapia e quanto custa?" **antes** de visitar o site; uma página que o
  agente não consegue ler perde vendas que você nunca vê.

**Teste rápido, o "teste de colar":** passe a URL da página de preços a uma IA
que navega (Perplexity, ChatGPT com busca, Claude com web), ou cole o texto da
página já renderizada, e pergunte "quais são os planos e os preços?". Se ela
erra feio, agentes que leem a página do mesmo jeito também vão ter problema
(é um indício, não prova de que todo agente falha).

As correções de leitura por IA costumam ter alto impacto e baixo esforço
(preço em texto, marcação `Offer` de schema.org).

**Para o roteiro completo de 10 dimensões, as notas e o modelo de relatório:**
veja [references/analise-da-pagina-de-precos.md](references/analise-da-pagina-de-precos.md).
*(O eixo de leitura por IA é adaptado de Kyle Poyar / Growth Unhinged.)*

---

## Checklist

### Antes de definir preço
- [ ] Perfis de cliente definidos (fisioterapeuta sozinho, clínica com equipe,
      rede de clínicas)
- [ ] Preço da concorrência levantado (pelo usuário, não inventado)
- [ ] Métrica de valor identificada
- [ ] Pesquisa de disposição a pagar feita, ou marcada como Hipótese
- [ ] Funcionalidades distribuídas entre os planos

### Estrutura
- [ ] Número de planos escolhido
- [ ] Diferença entre os planos clara
- [ ] Preços definidos com base em pesquisa
- [ ] Estratégia de desconto do anual definida (e o significado de
      `value_year` confirmado)
- [ ] Decidido se há plano para redes de clínicas, com preço negociado
- [ ] Decidido o papel de `value_isolated` (avulso em qual plano, por usuário ou
      por clínica)

---

## Perguntas da tarefa

1. Que pesquisa de preço já foi feita?
2. Qual o ARPU e a conversão hoje?
3. Qual a métrica de valor principal (usuário, profissional que atende,
   clínica, paciente)?
4. Quais os perfis de cliente que pagam?
5. A venda é sozinha pelo site, com o comercial, ou as duas?
6. Que mudança de preço está em estudo?

---

## Entrega

Responda na conversa com:

1. **O que o código diz**: os planos e preços atuais, citando o arquivo.
2. **O que veio do usuário** e **o que é Hipótese**, separados.
3. **Análise**: os pontos fortes e fracos do preço atual para a pergunta feita.
4. **Recomendação**: o que mudar, por quê, e como testar antes de mudar para
   todos.
5. **Próximo passo**: se a recomendação mexe no sistema (seeder, plano, tela),
   diga que é tarefa nova pelo `refinar`. Esta skill não altera arquivo do
   projeto.

---

## Skills relacionadas

- **refinar**: para levar uma mudança de preço, plano ou funcionalidade ao
  sistema, pelo ciclo normal.
- **jornada-do-cliente**: para mapear a jornada de cadastro, troca de plano ou
  cancelamento da clínica antes de decidir o preço.
- **prototype**: para comparar variantes de uma tela de planos dentro do
  sistema.
