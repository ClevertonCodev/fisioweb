# Tipos de e-mail

Guia dos e-mails do ciclo de vida da clínica, das campanhas e dos e-mails ao paciente. Use como lista de auditoria e como referência para desenhar. Todo gatilho é um fato que o sistema grava; quando o fato ainda não é gravado, isso aparece no desenho como dependência.

## Conteúdo
- Primeiros passos (série da clínica nova, série da clínica que assinou, lembrete de passo que falta, convite de usuário da equipe)
- Retenção (troca de plano, pedido de avaliação, ajuda antes do problema, resumo de uso, NPS, indicação)
- Cobrança (mudar para o anual, pagamento que falhou, pesquisa de cancelamento, aviso de renovação)
- Uso (resumo diário, semanal ou mensal; aviso de evento ou marco)
- Reativação (teste que acabou, clínica que cancelou)
- Campanha (resumo do mês, datas do ano, novidades do produto, notícias da fisioterapia, mudança de preço)
- Paciente (programa, questionário, consulta, lembrete)
- Lista de auditoria, com o que já existe

## Primeiros passos

### Série da clínica nova
**Gatilho:** clínica cadastrada e e-mail confirmado
**Objetivo:** chegar ao momento em que o sistema faz sentido (primeiro paciente com primeiro programa)
**Sequência típica:** 5 a 7 e-mails em 14 dias

- E-mail 1: boas-vindas e um próximo passo (na hora)
- E-mail 2: vitória rápida, primeiro paciente (dia 1)
- E-mail 3: funcionalidade principal do plano (dia 3)
- E-mail 4: caso de outra clínica (dia 5)
- E-mail 5: como está indo, com oferta de ajuda (dia 7)
- E-mail 6: dica avançada (dia 10)
- E-mail 7: plano ou próximo marco (dia 14)

**Métricas:** clínicas com primeiro paciente, com primeiro programa enviado, com a primeira consulta na agenda.

---

### Série da clínica que assinou
**Gatilho:** a clínica passou a pagar (o código ainda não cobra; depende de como a assinatura vai existir)
**Objetivo:** confirmar a decisão, aprofundar o uso, evitar cancelamento cedo
**Sequência típica:** 3 a 5 e-mails em 14 dias

- E-mail 1: obrigado e o que vem agora (na hora)
- E-mail 2: lista do que configurar para aproveitar o plano (dia 2)
- E-mail 3: dicas das funcionalidades do plano (dia 5)
- E-mail 4: caso de clínica parecida (dia 7)
- E-mail 5: como está indo e onde pedir ajuda (dia 14)

**Ponto-chave:** a clínica já decidiu. O foco é confirmar e aprofundar, sem tentar vender de novo.

---

### Lembrete de passo que falta
**Gatilho:** a clínica não fez um passo importante depois de X tempo
**Objetivo:** levar ao passo de maior valor
**Formato:** um e-mail ou uma minissequência de 2 ou 3

**Exemplos de gatilho:**
- Confirmou o e-mail e não cadastrou paciente em 48 h
- Tem pacientes e nenhum programa enviado em 7 dias (só planos com Programas e Exercícios)
- Não preencheu os dados da clínica (`/clinica/dados`: telefone, endereço) em 3 dias; sem eles, os e-mails ao paciente saem sem telefone e sem "Como chegar"
- Clínica com um usuário só depois de 14 dias, se o usuário quiser estimular a equipe

**Como escrever:**
- Lembre o que a clínica começou
- Diga por que esse passo importa
- Facilite (link direto para a tela)
- Ofereça ajuda se ela travou

---

### Convite de usuário da equipe
**Gatilho:** o admin cadastra um fisioterapeuta ou uma secretária (`/clinica/usuarios/novo`)
**Objetivo:** o convidado entrar pela primeira vez (`/clinica/primeiro-acesso`)
**Destinatário:** quem foi convidado
**Estado:** a feature 022 deixou este e-mail fora; confira se já existe

- E-mail 1: você foi convidado (na hora)
- E-mail 2: lembrete se não entrou (dia 2)
- E-mail 3: último lembrete (dia 5)

**Como escrever:**
- Use o nome de quem convidou e o da clínica
- Explique o que a pessoa vai fazer no sistema (agenda, prontuário, programas)
- Um botão para aceitar
- Link com prazo; diga o prazo

---

## Retenção

### Troca de plano
**Gatilho:** a clínica tenta usar algo que o plano não tem, ou usa muito o que tem
**Objetivo:** subir de plano (Start para Performance, Performance para Premium)
**Formato:** um e-mail ou sequência de 2 ou 3

**Exemplos de gatilho** (confira no `PlanFeatureSeeder` o que cada plano libera):
- Clínica no Start tentou abrir a Agenda ou Programas e Exercícios
- Clínica no Performance com pacientes ativos que se beneficiariam do App
- Clínica com uso alto e constante

**Como escrever:**
- Reconheça o crescimento, em tom positivo
- Mostre o que o próximo plano libera
- Compare valor e custo; a cobrança é por usuário, então faça a conta para o tamanho da equipe
- Caminho fácil para trocar

---

### Pedido de avaliação
**Gatilho:** marco da clínica (30, 60 ou 90 dias de uso, um resultado, atendimento de suporte resolvido)
**Objetivo:** prova social na plataforma que o usuário indicar
**Formato:** um e-mail

**Melhor momento:**
- Depois de um atendimento de suporte bem resolvido
- Depois de um resultado concreto (100 programas enviados)
- Depois da renovação
- **Nunca** depois de problema de cobrança ou de erro no sistema

**Como escrever:**
- Agradeça
- Cite o marco, se possível
- Diga por que a avaliação importa (ajuda outras clínicas a decidir)
- Link direto
- Curto: é um pedido

---

### Ajuda antes do problema
**Gatilho:** sinal de dificuldade (uso caiu, ações que falham, travou num passo)
**Objetivo:** salvar a clínica em risco
**Formato:** um e-mail

**Exemplos de gatilho:**
- Consultas na agenda caíram muito de uma semana para outra
- Começou vários programas e não enviou nenhum (rascunhos parados)
- Parou no mesmo passo dos primeiros passos

**Como escrever:**
- Interesse de verdade
- Específico ("Vimos que há três programas em rascunho") quando o dado permite, sem citar paciente
- Ajuda direta, além do link para a documentação
- Assinado por uma pessoa do suporte
- Sem venda

---

### Resumo de uso
**Gatilho:** tempo (semanal, mensal ou trimestral)
**Objetivo:** mostrar valor, aumentar o uso, reduzir cancelamento
**Formato:** um e-mail recorrente

**O que entra:**
- Números da atividade (consultas, programas enviados, questionários respondidos)
- Comparação com o período anterior
- Marcos
- Sugestão do que fazer a seguir
- Botão leve

**Exemplos:**
- "Em outubro, a {clínica} enviou 18 programas de exercícios"
- "Seus pacientes concluíram 240 sessões de exercício em casa" (se `patient_completed_count` for confiável)
- "A agenda teve 92 consultas, 7 a mais que em setembro"

**Regra:** só números agregados. Nenhum nome de paciente, nenhuma lista de faltas por paciente.

---

### NPS
**Gatilho:** tempo (trimestral) ou evento (depois de um marco)
**Objetivo:** medir satisfação, achar quem recomenda e quem critica
**Formato:** um e-mail, só para a clínica (nunca ao paciente da clínica)

**Boas práticas:**
- Só a pergunta do NPS no começo
- Formulário de "por quê" conforme a nota
- Remetente pessoal (fundador, suporte)
- Diga o que vai fazer com a resposta

**Seguimento pela nota:**
- 9 e 10: agradeça e peça avaliação ou indicação
- 7 e 8: pergunte o que faltaria para ser 10
- 0 a 6: contato pessoal para entender o problema

---

### Indicação
**Gatilho:** marco da clínica, nota alta no NPS ou campanha
**Objetivo:** indicações de outras clínicas
**Formato:** um e-mail ou lembretes periódicos
**Estado:** o código não tem programa de indicação; só desenhe se o usuário confirmar a regra

**Bom momento:**
- Depois de NPS positivo
- Depois de um resultado
- Depois da renovação

**Como escrever:**
- Lembre o resultado da clínica
- Explique a oferta com clareza
- Facilite o compartilhamento (link próprio)
- Mostre o que ganha quem indica e quem é indicado

---

## Cobrança

O código ainda não cobra: não há assinatura, fatura nem meio de pagamento. Estes e-mails entram na auditoria para quando a cobrança existir. Não desenhe texto com valores sem o usuário confirmar como vai cobrar.

### Mudar para o anual
**Gatilho:** clínica no mensal perto da renovação, ou campanha
**Objetivo:** passar do mensal ao anual
**Formato:** um e-mail ou sequência de 2

**Proposta:**
- Economia exata: o `PlanFeatureSeeder` tem preço mensal (`value_month`) e preço por mês no anual (`value_year`), por usuário; faça a conta para o número de usuários da clínica
- Garantia do preço atual
- Troca em um clique

**Melhor momento:**
- Perto da renovação mensal
- Virada do ano
- Depois de 3 a 6 meses de uso
- Antes de um aumento de preço

---

### Pagamento que falhou
**Gatilho:** o pagamento falha
**Objetivo:** recuperar o pagamento e manter a clínica
**Sequência típica:** 3 ou 4 e-mails em 7 a 14 dias

- E-mail 1 (dia 0): aviso amigável, link para atualizar o pagamento
- E-mail 2 (dia 3): lembrete, o acesso pode ser interrompido
- E-mail 3 (dia 7): urgente, a conta vai ser suspensa
- E-mail 4 (dia 10 a 14): último aviso, o que a clínica perde

**Como escrever:**
- Parta do princípio de que foi engano (cartão vencido, boleto esquecido)
- Claro e direto, sem culpa
- Um botão para pagar
- Diga o que acontece se não resolver, e lembre que os dados dos pacientes continuam guardados e o que acontece com eles

---

### Pesquisa de cancelamento
**Gatilho:** a clínica cancela (`Clinic::STATUS_CANCELLED`)
**Objetivo:** entender o motivo e, quando couber, salvar
**Formato:** um e-mail (na hora)

**Opções:**
- Pesquisa na tela de cancelamento (responde mais)
- E-mail de seguimento se pulou a pesquisa
- Contato pessoal para clínicas grandes

**Perguntas:**
- Principal motivo do cancelamento
- O que poderíamos ter feito melhor
- Algo faria mudar de ideia
- Podemos ajudar na transição (exportar dados dos pacientes)

**Chance de recuperar:** conforme o motivo, ofereça algo específico (pausa, plano menor, treinamento).

---

### Aviso de renovação
**Gatilho:** X dias antes da renovação (14 ou 30)
**Objetivo:** nenhuma cobrança de surpresa
**Formato:** um e-mail

**O que entra:**
- Data e valor
- O que a renovação inclui
- Como mudar o pagamento ou o plano
- Mudanças de preço ou de funcionalidade, se houver

**Obrigatório para:** plano anual.

---

## Uso

### Resumo diário, semanal ou mensal
**Gatilho:** tempo
**Objetivo:** aumentar o uso, mostrar valor
**Formato:** um e-mail recorrente

**Conteúdo por frequência:**
- **Diário:** a agenda do dia, para o profissional que pedir (sem motivo de consulta)
- **Semanal:** resumo, destaques, sugestões
- **Mensal:** relatório completo e marcos

**Estrutura:**
- Números principais
- Destaques
- Detalhe da atividade
- O que tentar a seguir
- Botão para ver mais

**Personalização:** tem que refletir o uso real. Resumo vazio é pior que nenhum resumo.

---

### Aviso de evento ou marco
**Gatilho:** um feito ou evento específico
**Objetivo:** celebrar e manter o uso
**Formato:** um e-mail por evento

**Exemplos de marco:**
- Primeiro programa enviado
- Primeiro questionário respondido por paciente
- 100 consultas na agenda
- Primeiro mês com a equipe toda usando

**Como escrever:**
- Tom de comemoração, sem exagero
- O feito específico
- Contexto (comparado com antes)
- Próximo marco

---

## Reativação

### Teste que acabou
**Gatilho:** o teste terminou sem assinatura
**Estado:** o código não tem teste grátis; a clínica nova entra no Premium sem data de fim. Pergunte ao usuário como vai ser o teste (prazo, o que acontece no fim, para qual plano cai) antes de desenhar.
**Objetivo:** converter ou retomar
**Sequência típica:** 3 ou 4 e-mails em 30 dias

- E-mail 1 (dia 1 depois do fim): o teste acabou, e o que a clínica perde
- E-mail 2 (dia 7): o que fez a clínica parar? (colete o motivo)
- E-mail 3 (dia 14): oferta (desconto ou teste estendido), se o usuário decidir que existe
- E-mail 4 (dia 30): último contato, porta aberta

**Segmentação pelo uso no teste:**
- Usou muito: tire o atrito para assinar
- Usou pouco: recomeço, com mais ajuda nos primeiros passos
- Não usou: pergunte o que houve, ofereça uma conversa

---

### Clínica que cancelou
**Gatilho:** tempo depois do cancelamento (30, 60, 90 dias)
**Objetivo:** trazer a clínica de volta
**Sequência típica:** 2 ou 3 e-mails em 90 dias

- E-mail 1 (dia 30): o que mudou desde que saiu
- E-mail 2 (dia 60): resolvemos o [motivo comum]
- E-mail 3 (dia 90): oferta para voltar

**Como escrever:**
- Sem culpa e sem desespero
- Novidades reais
- Personalize pelo motivo do cancelamento, se conhecido
- Facilite a volta

**Ponto-chave:** a clínica volta mais quando o motivo dela foi resolvido. Confirme com o usuário por quanto tempo a clínica cancelada pode receber e-mail e com que base legal.

---

## Campanha

Campanhas vão só para clínicas. Nunca para pacientes das clínicas.

### Resumo do mês
**Gatilho:** tempo (mensal)
**Objetivo:** presença da marca, uso, distribuição de conteúdo
**Formato:** um e-mail recorrente

**Conteúdo:**
- Novidades e dicas do produto
- Histórias de clínicas
- Conteúdo educativo (gestão de clínica, adesão do paciente ao exercício em casa)
- Notícias do fisioweb

**Boas práticas:**
- Dia e horário fixos
- Fácil de ler de relance
- Um foco principal de botão
- Descadastro é normal e mantém a lista saudável

---

### Datas do ano
**Gatilho:** calendário (janeiro, Black Friday, fim do ano fiscal)
**Objetivo:** conversão com oferta no tempo certo
**Formato:** campanha de 2 a 4 e-mails

**Oportunidades:**
- Janeiro: planejamento do ano da clínica
- Black Friday
- Datas da fisioterapia (13 de outubro, Dia do Fisioterapeuta)

**Estrutura:**
- Anúncio: a oferta
- Lembrete: no meio da campanha
- Última chance: nas horas finais

---

### Novidades do produto
**Gatilho:** funcionalidade nova no ar
**Objetivo:** uso da novidade
**Formato:** um e-mail por novidade grande

**O que entra:**
- O que mudou, simples
- Por que importa (benefício)
- Como usar (link direto)
- Quem pediu (reconhecimento às clínicas)

**Segmentação por relevância:**
- Só clínicas cujo plano tem a funcionalidade, ou um e-mail diferente para as outras
- Clínicas que pediram
- Clínicas que mais usam, primeiro

---

### Notícias da fisioterapia
**Gatilho:** tempo (semanal ou mensal)
**Objetivo:** autoridade e valor da marca
**Formato:** boletim com curadoria

**Conteúdo:**
- Notícias e links escolhidos (regras do COFFITO, gestão de clínica)
- Comentário próprio
- O que significa para a clínica
- Onde o fisioweb ajuda

---

### Mudança de preço
**Gatilho:** anúncio de mudança de preço
**Objetivo:** comunicar com transparência e perder poucas clínicas
**Formato:** um e-mail, ou sequência para mudança grande

**Prazo:**
- Anúncio 30 a 60 dias antes
- Lembrete 14 dias antes
- Último aviso 7 dias antes

**Como escrever:**
- Claro, direto, transparente
- Explique o motivo
- Mantenha o preço antigo para quem já assina, se possível
- Dê opções (travar no anual, plano menor)

**Importante:** honestidade e aviso com antecedência mantêm a confiança mesmo com aumento.

---

## Paciente (em nome da clínica)

Regras de LGPD na seção "E-mail ao paciente é dado de saúde" do `SKILL.md`. Remetente "<clínica> via IVS MED", assunto "<o quê> · <clínica>", sem dado clínico, sem pedir resposta.

### Programa de exercícios enviado
**Gatilho:** a clínica clica em E-mail no modal "Enviar ao paciente" (transacional)
**Código:** `TreatmentPlanSentMail`, evento `TreatmentPlanEmailRequested` (branch `feat/modulo-comunicacao`)
**Conteúdo:** nome de tratamento, nome da clínica, título do programa, início, validade, número de exercícios, mensagem do profissional (opcional), botão "Abrir meu programa"

### Programa enviado e não aberto
**Gatilho:** X dias sem `patient_viewed_at` depois do envio (não transacional)
**Estado:** não existe; depende da data do envio e de chave e opção de parar de receber. Modelo em [modelos-de-sequencia.md](modelos-de-sequencia.md).

### Questionário enviado
**Gatilho:** a clínica envia o questionário por e-mail (transacional)
**Código:** `QuestionnaireSentMail`, evento `QuestionnaireEmailRequested`
**Conteúdo:** título do questionário, prazo, botão "Responder questionário", "Suas respostas vão direto para a clínica"

### Questionário perto de vencer
**Estado:** fora da feature 022. Não transacional se sair sozinho.

### Consulta marcada, remarcada ou cancelada
**Gatilho:** a clínica salva a consulta e escolhe E-mail no "Avisar o paciente?" (transacional)
**Estado:** tarefas 006 e 007 da feature 022, a fazer em 2026-11-20
**Conteúdo:** data, hora no fuso da clínica, profissional, "Como chegar" (marcada e remarcada, só com endereço), telefone

### Lembrete de consulta
**Gatilho:** 24 h antes, por comando de hora em hora (não transacional)
**Estado:** chaves prontas (tarefa 008); envio e saída a fazer (tarefas 009 e 010)
**Modelo:** [modelos-de-sequencia.md](modelos-de-sequencia.md)

---

## Lista de auditoria

Estado em 2026-11-20; confira no código e na branch antes de usar. "Branch" = `feat/modulo-comunicacao`.

### Sistema
- [x] Confirmação de e-mail da clínica (`main`)
- [x] Esqueci minha senha, admin e clínica (`main`)

### Primeiros passos
- [ ] Série da clínica nova
- [ ] Série da clínica que assinou
- [ ] Lembretes de passo que falta
- [ ] Convite de usuário da equipe

### Retenção
- [ ] Troca de plano
- [ ] Pedido de avaliação (no momento certo)
- [ ] Ajuda antes do problema
- [ ] Resumo de uso
- [ ] NPS
- [ ] Indicação

### Cobrança (depende de a cobrança existir)
- [ ] Mudar para o anual
- [ ] Pagamento que falhou
- [ ] Pesquisa de cancelamento
- [ ] Aviso de renovação

### Uso
- [ ] Resumo diário, semanal ou mensal
- [ ] Aviso de evento
- [ ] Marcos

### Reativação
- [ ] Teste que acabou (depende de o teste existir)
- [ ] Clínica que cancelou

### Campanha
- [ ] Resumo do mês
- [ ] Calendário de datas do ano
- [ ] Novidades do produto
- [ ] Mudança de preço

### Paciente
- [x] Programa de exercícios enviado (branch)
- [x] Questionário enviado (branch)
- [ ] Consulta marcada, remarcada ou cancelada (branch, a fazer)
- [ ] Lembrete de consulta e "Não quero mais receber lembretes" (branch, a fazer)
- [ ] Programa enviado e não aberto
- [ ] Questionário perto de vencer
