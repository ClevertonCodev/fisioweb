# Estrutura de planos e pacotes

## Conteúdo
- Quantos planos?
- Bom, Melhor, Ótimo
- Como diferenciar planos
- Exemplo de estrutura (o fisioweb hoje)
- Pacote por perfil de cliente (identificar perfis, montar o pacote)
- Freemium ou teste grátis (quando usar cada um, abordagens mistas)
- Plano para redes de clínicas (quando ter preço negociado, o que entra, como cobrar)

## Quantos planos?

**2 planos:** escolha simples e clara.
- Serve para: divisão clara entre pequeno e grande.
- Risco: deixar dinheiro na mesa.

**3 planos:** o padrão do mercado (e o do fisioweb).
- Bom = porta de entrada.
- Melhor = o recomendado (ancorado no Ótimo).
- Ótimo = clientes de alto valor.

**4 ou mais planos:** mais granularidade.
- Serve para: clientes de tamanhos muito diferentes.
- Risco: paralisia na hora de escolher, complexidade.

---

## Bom, Melhor, Ótimo

**Plano de entrada (Bom):**
- Objetivo: tirar barreiras para entrar.
- Inclui: o essencial, uso limitado.
- Preço: baixo, acessível.
- Para quem: equipes pequenas, quem quer experimentar antes.
- No fisioweb: **Start**, R$ 20 por usuário, sem funcionalidade extra.

**Plano recomendado (Melhor):**
- Objetivo: onde a maioria dos clientes fica.
- Inclui: tudo o que importa, limites razoáveis.
- Preço: o preço "âncora".
- Para quem: equipes crescendo, quem usa a sério.
- No fisioweb: **Performance**, R$ 30 por usuário, com Agenda, Programas e
  Exercícios e Finanças.

**Plano completo (Ótimo):**
- Objetivo: capturar os clientes de alto valor.
- Inclui: tudo, recursos avançados, limites maiores.
- Preço: alto (no mercado, muitas vezes 2 a 3 vezes o Melhor).
- Para quem: equipes maiores, quem usa muito, empresas grandes.
- No fisioweb: **Premium**, R$ 40 por usuário, com tudo do Performance mais o
  App.

---

## Como diferenciar planos

**Por funcionalidade:**
- O básico em todos os planos.
- O avançado nos planos de cima.
- Funciona quando as funcionalidades têm diferença de valor clara.
- É o que o fisioweb faz hoje (`FeaturePlan` liga funcionalidade a plano).

**Por limite de uso:**
- Mesmas funcionalidades, limites diferentes.
- Mais usuários, armazenamento, pacientes ativos, vídeos de exercício nos planos
  de cima.
- Funciona quando o valor cresce com o uso.
- No fisioweb, `Feature::TYPES` já prevê funcionalidade do tipo `int`
  (quantidade), além de `bool` (ativa/inativa); todas as atuais são `bool`.

**Por suporte:**
- E-mail, depois prioritário, depois atendimento dedicado.
- Funciona para produto que dá trabalho para implantar (ex.: migrar pacientes de
  outro sistema).

**Por acesso e personalização:**
- Integrações, login único da empresa, marca própria (logo da clínica no App e
  no PDF do programa).
- Funciona para diferenciar o plano das redes de clínicas.

---

## Exemplo de estrutura (o fisioweb hoje)

Preços por usuário por mês, tirados do `PlanFeatureSeeder.php`. A linha
"no anual" supõe que `value_year` é o preço mensal de quem fecha o anual;
confirme antes de usar.

```
┌────────────────────────┬────────────┬──────────────┬────────────┐
│                        │ Start      │ Performance  │ Premium    │
├────────────────────────┼────────────┼──────────────┼────────────┤
│ Mensal, por usuário    │ R$ 20      │ R$ 30        │ R$ 40      │
│ No anual, por usuário  │ R$ 15      │ R$ 25        │ R$ 35      │
│ Agenda                 │ ✗ (R$ 10)  │ ✓            │ ✓          │
│ Programas e Exercícios │ ✗ (R$ 15)  │ ✓            │ ✓          │
│ Finanças               │ ✗ (R$ 5)   │ ✓            │ ✓          │
│ App                    │ ✗ (R$ 20)  │ ✗ (R$ 20)    │ ✓          │
└────────────────────────┴────────────┴──────────────┴────────────┘
Entre parênteses: value_isolated (preço avulso; unidade a confirmar).
```

Contas que ajudam a analisar (supondo `value_isolated` por usuário):

- **Clínica pequena, 1 fisioterapeuta** (o próprio dono): Start R$ 20,
  Performance R$ 30, Premium R$ 40 por mês. Start mais só a Agenda avulsa dá
  R$ 30, o mesmo que o Performance: nesse caso o Performance é claramente
  melhor negócio.
- **Clínica com equipe, 4 fisioterapeutas e 1 secretária** (5 usuários, se a
  secretária conta): Performance R$ 150 por mês (R$ 125 no anual), Premium
  R$ 200 (R$ 175 no anual). O App custa R$ 50 a mais por mês para a clínica
  inteira, embora quem usa o App seja o paciente, não o usuário da clínica.
  Esse descasamento entre quem paga e quem usa é um ponto a discutir.

---

## Pacote por perfil de cliente

### Identificar os perfis

Clientes diferentes têm:
- Disposição a pagar diferente.
- Necessidades diferentes.
- Processo de compra diferente.
- Percepção de valor diferente.

**Separe por:**
- Tamanho: fisioterapeuta sozinho, clínica pequena, clínica média, rede.
- Uso: só agenda e prontuário, programa de exercícios para casa, gestão
  financeira.
- Maturidade: quem saiu da planilha, quem troca de outro sistema.
- Especialidade (ortopedia, pilates, neuro, esportiva): orçamentos diferentes.

### Pacote por perfil

**Passo 1: defina os perfis** (exemplo ilustrativo; a disposição a pagar vem
de pesquisa, não do texto abaixo)

| Perfil | Tamanho | Precisa de | Disposição a pagar | Plano provável |
|--------|---------|------------|--------------------|----------------|
| Fisioterapeuta sozinho | 1 usuário | Prontuário, agenda simples | Baixa | Start ou Performance |
| Clínica pequena | 2 a 5 usuários, com secretária | Agenda da equipe, finanças | Média | Performance |
| Clínica média | 6 a 20 usuários | Programas de exercício, App do paciente | Mais alta | Premium |
| Rede de clínicas | Várias unidades | Visão consolidada, suporte, contrato | Alta | Preço negociado |

**Passo 2: ligue as funcionalidades aos perfis**

| Funcionalidade | Sozinho | Pequena | Média | Rede |
|----------------|---------|---------|-------|------|
| Cadastro de paciente e prontuário | ✓ | ✓ | ✓ | ✓ |
| Agenda | Talvez | ✓ | ✓ | ✓ |
| Finanças | — | ✓ | ✓ | ✓ |
| Programas e Exercícios | Talvez | ✓ | ✓ | ✓ |
| App do paciente | — | Talvez | ✓ | ✓ |
| Várias unidades, relatório consolidado | — | — | — | ✓ |
| Contrato próprio | — | — | — | ✓ |

As células "Talvez" são exatamente o que a pesquisa precisa responder.

**Passo 3: preço conforme o valor para cada perfil**
- Pesquise a disposição a pagar por segmento.
- Defina preços que capturem valor sem impedir a adoção.
- Considere páginas de entrada específicas por perfil.

---

## Freemium ou teste grátis

Freemium é ter um plano grátis para sempre, com limites. Teste grátis (trial)
é acesso por tempo limitado, que depois vira cobrança.

No fisioweb hoje: não há plano grátis nem prazo de teste no código. A clínica
que se cadastra sozinha entra no Premium
(`ClinicRegistrationService::DEFAULT_PLAN_NAME`). Pergunte ao usuário o que
acontece depois; se ela cai para um plano menor quando não paga, isso é um
teste reverso (abaixo).

### Quando usar freemium

**Freemium funciona quando:**
- O produto tem efeito viral ou de rede.
- Usuários grátis geram valor (conteúdo, dados, indicações).
- O mercado é grande, e o percentual de conversão gera volume.
- Servir o usuário grátis custa pouco.
- Há limites claros que levam a contratar o pago.

**Riscos do freemium:**
- O usuário grátis pode nunca converter.
- Desvaloriza a percepção do produto.
- Custo de suporte para quem não paga (e, no fisioweb, armazenamento de vídeo e
  dado de paciente de clínica que não paga).
- Fica mais difícil subir o preço depois.

### Quando usar teste grátis

**Teste grátis funciona quando:**
- O produto precisa de tempo para mostrar valor (a clínica precisa cadastrar
  pacientes e montar a agenda antes de sentir o ganho).
- Exige configuração ou investimento inicial.
- Venda B2B com mais de uma pessoa decidindo.
- Preço mais alto.
- O produto "gruda" depois de configurado.

**Boas práticas do teste:**
- 7 a 14 dias para produto simples.
- 14 a 30 dias para produto complexo.
- Acesso completo (sem cortar funcionalidade).
- Contagem regressiva e lembretes claros.
- Pedir cartão de crédito ou não: tem prós e contras. Hoje o fisioweb não tem
  gateway de pagamento, então pedir cartão no cadastro é uma funcionalidade a
  construir, não uma configuração.

**Cartão de crédito no começo do teste** (números de mercado, não do fisioweb):
- Conversão de teste para pago maior (40 a 50% contra 15 a 25%).
- Menos testes iniciados.
- Clientes mais qualificados.

### Abordagens mistas

**Freemium + teste:**
- Plano grátis com funcionalidades limitadas.
- Teste das funcionalidades pagas.
- Exemplo: Zoom (grátis por 40 minutos, teste do Pro).

**Teste reverso:**
- Começa com acesso completo.
- Depois do teste, cai para o plano grátis ou de entrada.
- Exemplo hipotético no fisioweb (o código não faz isso hoje): a clínica entra
  no Premium e, sem contratar, cai para o Start; ela já viu a Agenda e o App
  funcionando e sente falta.

---

## Plano para redes de clínicas

O equivalente ao plano "Enterprise" do mercado: preço negociado, com contato do
comercial.

### Quando ter preço negociado

Ponha "Fale com a gente" quando:
- O contrato é grande o bastante para justificar negociação (redes, franquias,
  clínicas com muitas unidades).
- O cliente precisa de contrato próprio.
- Há implantação (migração de pacientes, treinamento da equipe).
- Há exigência de segurança e conformidade (LGPD, dado de saúde).
- Há processo de compra formal.

### O que entra no plano de rede

**O mínimo esperado:**
- Login único da empresa.
- Registro de auditoria (quem fez o quê).
- Controles de administrador.
- Garantia de disponibilidade em contrato.
- Documentação de segurança e LGPD.

**O que agrega:**
- Suporte ou acompanhamento dedicado.
- Implantação sob medida.
- Treinamento da equipe.
- Integrações sob medida.
- Prioridade no planejamento do produto.

### Como cobrar de redes

**Por usuário com desconto por volume** (números ilustrativos, não são preço
real):
- Desconto para equipes grandes.
- Exemplo: R$ 30 por usuário até 20 usuários, R$ 25 acima de 20.

**Taxa fixa + uso** (ilustrativo):
- Taxa base pelo acesso.
- Cobrança por uso acima de um limite.
- Exemplo: uma taxa por unidade mais um valor por profissional que atende.

**Contrato por valor:**
- Preço ligado à receita ou ao resultado do cliente.
- Exemplo: percentual das consultas registradas, divisão de receita.
