---
name: emails
description: "Desenha ou melhora sequências e textos de e-mail do fisioweb: boas-vindas e primeiros passos da clínica nova, ativação (primeiro paciente, primeiro programa), teste grátis, reativação de clínica parada e comunicação da clínica com o paciente (programa, questionário, lembrete de consulta), com os cuidados de LGPD. Entrega o desenho da sequência e o texto de cada e-mail; não implementa o envio. Use quando pedirem para escrever, revisar ou planejar e-mails, decidir o que enviar e quando, ou entender por que um e-mail não funciona. Fora do ciclo do harness: só roda quando o usuário chamar."
disable-model-invocation: true
---

# Sequências de e-mail

Origem: `emails` do pacote "50 skills de IA" (Alura), traduzida e adaptada ao fisioweb.

Você desenha sequências de e-mail e escreve o texto de cada uma. Cada sequência leva a pessoa à próxima ação que importa no fisioweb: a clínica cadastrar o primeiro paciente, enviar o primeiro programa, voltar a usar o sistema; o paciente abrir o programa, responder o questionário, ir à consulta.

**Fora do ciclo do harness.** Esta skill não é etapa do `refinar` → `escrever-plano` → `criar-tarefas` → `implementar-tarefa`, não conta para a Definição de Pronto e não muda código. Ela **entrega texto e desenho da sequência** na conversa. Se o usuário quiser guardar, grave em `.ai-workbench/<feature>/emails-<sequencia>.md` da feature que ele indicar. Implementar o envio (evento, Mailable, fila, template, chave de parar de receber) é tarefa separada e segue o ciclo normal, começando pela skill `refinar`.

Converse com o usuário em português.

## Dois públicos, regras diferentes

| | Clínica | Paciente da clínica |
|---|---|---|
| Quem é | Quem assina o fisioweb: o usuário mestre que cadastrou a clínica e a equipe (admin, fisioterapeuta, secretária) | A pessoa atendida pela clínica |
| Em nome de quem | IVS MED, a marca dos e-mails do sistema | Da clínica: "De: <clínica> via IVS MED" |
| O que pode receber | Boas-vindas, primeiros passos, ativação, plano, reativação, novidades do produto | Só o que serve ao atendimento: programa, questionário, aviso e lembrete de consulta |
| O que nunca vai | Nome ou dado de paciente no corpo (fale em números: "3 pacientes cadastrados") | Marketing do fisioweb, dado clínico (veja a seção de LGPD) |

## E-mail ao paciente é dado de saúde (LGPD)

A clínica é a controladora dos dados do paciente; o fisioweb só trata esses dados em nome dela. Todo e-mail ao paciente segue estas regras:

- **Só o necessário no corpo.** Nome de tratamento (apelido ou primeiro nome), nome da clínica, data e hora, o título do programa ou do questionário e o link. Nada de diagnóstico, CID, evolução, nível de dor, resposta de questionário ou anotação do fisioterapeuta. Título que revela condição ("Reabilitação pós-cirurgia de joelho") é dado clínico: avise o usuário.
- **Assunto e prévia neutros.** Eles aparecem na tela bloqueada do celular. Use o padrão da branch: "Seu programa de exercícios está disponível · <clínica>".
- **Quem fala é a clínica.** Remetente "<clínica> via IVS MED", rodapé com o telefone e o endereço da clínica. O endereço não recebe respostas, então nenhum texto pede para responder o e-mail; o caminho é o telefone da clínica.
- **Link em vez de conteúdo.** O e-mail leva até o programa, o questionário ou a consulta por um link assinado ("Este link é só seu"). O conteúdo fica atrás do link.
- **Opção de parar de receber quando não for transacional.** O que a clínica manda num clique (programa, questionário, aviso de consulta) é transacional. O que sai sozinho (lembrete, cobrança de programa não aberto) precisa de chave da clínica, desligada por padrão, e de um link "Não quero mais receber" no rodapé, como o lembrete de consulta da feature 022.
- **Marketing do fisioweb nunca vai ao paciente da clínica.** Nem novidade do produto, nem "conheça o IVS MED", nem pesquisa de satisfação do fisioweb.
- **Log com ids, sem o e-mail do paciente.** Vale também para métrica: meça por ids e contagens.

## Roteiro das referências

Leia a referência certa antes de desenhar ou revisar a parte correspondente. Combine as referências quando o pedido inclui o desenho da sequência e o texto de cada e-mail.

| Pedido | Leia | Cobre |
|---|---|---|
| Montar boas-vindas, primeiros passos, ativação, reativação ou sequência do paciente | [modelos-de-sequencia.md](references/modelos-de-sequencia.md) | Objetivo, tempo, ordem dos e-mails, ação esperada e exemplos do fisioweb |
| Descobrir que e-mail falta ou auditar primeiros passos, retenção, plano, uso, reativação, campanhas e e-mails ao paciente | [tipos-de-email.md](references/tipos-de-email.md) | Propósito, gatilho, público de cada e-mail e a lista de auditoria com o que já existe |
| Escrever ou revisar um e-mail; melhorar botão, personalização ou segmentação | [guia-de-texto.md](references/guia-de-texto.md) | Estrutura, tom, tamanho, campos variáveis, segmentação, medição e a lista de vícios de escrita |

## Antes de desenhar: leia o código, depois pergunte

No fisioweb não há arquivo de contexto de marketing, e o `AGENTS.md` proíbe criar `.agents/`. O contexto vem do código; o que o código não diz, pergunte ao usuário.

**Leia:**

1. **Cadastro da clínica:** `modules/Clinic/app/Services/ClinicRegistrationService.php`. Hoje a clínica nova entra ativa, no plano Premium (`DEFAULT_PLAN_NAME`), e o usuário mestre recebe a confirmação de e-mail (`VerifyClinicEmailNotification`, link de 24 h, pela fila com `SendClinicEmailVerificationJob`). O código não tem teste grátis nem cobrança.
2. **Planos:** `modules/Admin/database/seeders/PlanFeatureSeeder.php`. Start, Performance e Premium, cobrança por usuário, preço mensal e anual, e as funcionalidades que cada plano libera (Agenda, Programas e Exercícios, Finanças, App). E-mail que pede "envie seu primeiro programa" não vai para clínica cujo plano não tem Programas e Exercícios; para ela, isso é e-mail de troca de plano.
3. **E-mails que já existem:** na `main`, `modules/Clinic/app/Notifications/` e o reset de senha. Os e-mails ao paciente estão na branch `feat/modulo-comunicacao` (módulo `Email`, ADR 030, feature `.ai-workbench/022-modulo-comunicacao/`). Se a branch não está no checkout, leia sem trocar de branch: `git diff --stat main...feat/modulo-comunicacao` e `git show feat/modulo-comunicacao:<caminho>`. Lá estão os Mailables `TreatmentPlanSentMail` e `QuestionnaireSentMail`, as views em `modules/Email/resources/views/mail/` e o `decisoes.md` da feature (remetente, assunto neutro, lembrete de 24 h, sair dos lembretes, o que ficou fora).
4. **O fato que dispara cada e-mail:** o gatilho é um fato que o sistema grava (clínica cadastrada, e-mail confirmado, paciente criado, programa enviado, consulta marcada). Ache onde ele está (model, evento, data de criação). Se o sistema não grava o fato (último acesso da clínica, paciente que abriu o link), diga isso no desenho: a sequência depende dele, e gravar o fato entra na implementação.

**Pergunte o que faltar,** uma pergunta por vez:

1. **Tipo de sequência**
   - Boas-vindas e primeiros passos da clínica nova
   - Ativação: um passo que a clínica não deu (primeiro paciente, primeiro programa, agenda)
   - Teste grátis e conversão (se o usuário decidir que vai existir)
   - Reativação de clínica parada
   - Clínica que cancelou
   - Paciente: programa, questionário, consulta
   - Novidade do produto para as clínicas
2. **Público**
   - Clínica ou paciente? Na clínica, quem: o mestre, o admin, o fisioterapeuta ou a secretária?
   - Que evento do sistema coloca a pessoa na sequência?
   - O que ela já fez no sistema?
   - Qual a relação com o fisioweb (recém-cadastrada, usa há meses, parou, cancelou)?
3. **Objetivo**
   - A ação principal que o e-mail pede
   - Como o sistema mostra que deu certo (o paciente foi criado, o programa foi enviado)
   - Quando a pessoa sai da sequência

---

## Princípios

### 1. Um e-mail, um trabalho
- Cada e-mail tem um propósito.
- Um botão principal por e-mail.
- Não tente fazer tudo num e-mail só.

### 2. Ajuda antes do pedido
- Comece pelo que é útil para a clínica.
- Ganhe confiança com conteúdo.
- Só depois peça a troca de plano.

### 3. Relevância antes de volume
- Menos e-mails, melhores.
- Segmente pelo que a clínica fez e pelo plano dela.
- Qualidade vale mais que frequência.

### 4. Próximo passo claro
- Todo e-mail leva a algum lugar.
- O link abre a tela certa (`/clinica/pacientes/novo`, não o painel).
- O próximo passo fica óbvio.

---

## Estratégia da sequência

### Tamanho
- Boas-vindas: 3 a 7 e-mails
- Primeiros passos: 5 a 10 e-mails
- Ativação de um passo: 1 a 3 e-mails
- Reativação: 3 a 5 e-mails

Depende de quanto tempo a clínica leva para decidir, de quanto o produto pede de configuração e do momento da relação.

### Intervalos
- Boas-vindas: na hora do evento.
- Começo da sequência: 1 a 2 dias entre e-mails.
- Ativação e reativação: 2 a 4 dias.
- Longo prazo: semanal ou quinzenal.

Considere:
- Clínica: evite fim de semana e teste o horário. Muitas atendem o dia inteiro e leem e-mail cedo ou no fim do dia.
- Fuso: a clínica tem fuso próprio; envie e mostre datas no fuso dela.
- Paciente: o transacional sai na hora do clique da clínica; o lembrete sai 24 h antes da consulta. Nada de madrugada.

### Assunto
- Claro vale mais que criativo.
- Específico vale mais que vago.
- Benefício ou curiosidade honesta.
- 40 a 60 caracteres.
- Emoji divide opinião; só com teste, e nunca no e-mail ao paciente.

**Padrões que funcionam (clínica):**
- Pergunta: "Já cadastrou seu primeiro paciente?"
- Como fazer: "Como enviar um programa de exercícios em 5 minutos"
- Número: "3 jeitos de usar a agenda com a sua equipe"
- Direto: "{clínica}, sua conta está pronta"

**No e-mail ao paciente:** "<o quê> · <clínica>", neutro, sem dado clínico. Ex.: "Lembrete: consulta amanhã às 14:30 · Clínica Movimento".

### Texto de prévia
- Continua o assunto.
- Entre 90 e 140 caracteres.
- Não repete o assunto.
- Completa a ideia.
- Vale a regra do assunto: no e-mail ao paciente, nada de dado clínico (aparece na tela bloqueada).

---

## Tipos de sequência (visão geral)

### Boas-vindas (depois do cadastro da clínica)
**Tamanho**: 5 a 7 e-mails em 12 a 14 dias
**Objetivo**: ativar, ganhar confiança, converter (se houver teste)

1. Confirmação do e-mail (já existe) e, depois de confirmar, boas-vindas com o primeiro passo (na hora)
2. Vitória rápida: cadastrar o primeiro paciente (dia 1 ou 2)
3. Por que o fisioweb existe (dia 3 ou 4)
4. Prova: como outra clínica usa (dia 5 ou 6)
5. Objeção comum: "não tenho tempo de montar programa" (dia 7 ou 8)
6. Funcionalidade principal do plano (dia 9 a 11)
7. Plano e próximo passo (dia 12 a 14)

### Ativação (um passo que falta)
**Tamanho**: 1 a 3 e-mails
**Gatilho**: o fato não aconteceu X dias depois do anterior
**Exemplos**: clínica confirmou o e-mail e não criou paciente em 2 dias; clínica tem pacientes e nenhum programa enviado em 7 dias (só planos com Programas e Exercícios)

### Reativação (clínica parada)
**Tamanho**: 3 ou 4 e-mails em 2 semanas
**Gatilho**: 30 a 60 dias sem paciente novo, consulta ou programa (confira se o sistema grava o último acesso)
**Objetivo**: trazer de volta ou entender por que parou

1. Contato de verdade: o que aconteceu?
2. O que mudou desde a última vez
3. Ajuda concreta (conversa, configuração da agenda)
4. Último contato, com a porta aberta

### Primeiros passos (clínica usando)
**Tamanho**: 5 a 7 e-mails em 14 dias
**Objetivo**: chegar ao momento em que o sistema faz sentido (o primeiro paciente recebe o primeiro programa)
**Nota**: o e-mail apoia o que a tela já mostra; não repete.

1. Boas-vindas e primeiro passo (na hora)
2. Ajuda para começar (dia 1)
3. Funcionalidade em destaque (dia 2 ou 3)
4. Caso de outra clínica (dia 4 ou 5)
5. Como está indo? (dia 7)
6. Dica avançada (dia 10 a 12)
7. Plano ou equipe (dia 14 em diante)

### Paciente
**Gatilho**: o clique da clínica (transacional) ou um fato com hora marcada (lembrete)
**Exemplos**: programa enviado; programa enviado e não aberto em 3 dias; questionário pendente; lembrete de consulta 24 h antes

**Modelos detalhados**: [references/modelos-de-sequencia.md](references/modelos-de-sequencia.md)

---

## Tipos de e-mail por categoria

### Primeiros passos
- Série da clínica nova
- Série da clínica que assinou
- Lembrete de passo que falta (primeiro paciente, primeiro programa, agenda)
- Convite de usuário da equipe

### Retenção
- Troca de plano (Start para Performance, Performance para Premium)
- Pedido de avaliação
- Ajuda antes do problema
- Resumo de uso
- NPS
- Indicação

### Cobrança (o código ainda não cobra)
- Mudar para o anual
- Pagamento que falhou
- Pesquisa de cancelamento
- Aviso de renovação

### Uso
- Resumo diário, semanal ou mensal
- Aviso de evento importante
- Marco atingido (primeiro programa, 100 consultas)

### Reativação
- Teste que acabou (se houver teste)
- Clínica que cancelou

### Campanha
- Resumo do mês
- Datas do ano
- Novidades do produto
- Notícias da fisioterapia
- Mudança de preço

### Paciente (em nome da clínica)
- Programa de exercícios enviado
- Questionário enviado
- Consulta marcada, remarcada ou cancelada
- Lembrete de consulta

**Referência completa**: [references/tipos-de-email.md](references/tipos-de-email.md)

---

## Texto do e-mail

### Estrutura
1. **Abertura**: a primeira linha diz por que você está escrevendo.
2. **Contexto**: por que importa para a pessoa.
3. **Conteúdo**: o que é útil.
4. **Botão**: o que fazer agora.
5. **Fechamento**: curto e humano.

### Formatação
- Parágrafos curtos (1 a 3 frases).
- Espaço entre blocos.
- Lista para o que se lê de relance.
- Negrito com moderação.
- Pensado para o celular, onde a maioria lê.

### Tom
- Conversa, não ofício.
- "Você" para o leitor, "a gente" ou "nós" para o fisioweb; no e-mail ao paciente, quem fala é a clínica ("A Clínica Movimento preparou...").
- Voz ativa.
- Leia em voz alta. Parece uma pessoa falando?

### Sem vícios de texto de IA

O leitor reconhece rápido o texto gerado e para de ler. Escreva a partir da coisa específica que a pessoa precisa saber ou fazer.

Nunca escreva:
- **Contraste revelado**: "Não é X, é Y." "Mais do que X, é Y." "Não porque X. Porque Y." Diga Y direto, com o motivo.
- **Lista de negações**: "Sem planilha, sem papel, sem complicação." Diga o que acontece. Uma ausência simples ("Não precisa de senha") está bem.
- **Gerúndio encadeado no fim da frase**: "..., garantindo mais adesão, otimizando seu tempo e proporcionando...". Termine a frase na afirmação.
- **Pergunta respondida e dois-pontos de revelação**: "O resultado? 3 vezes mais rápido." "O melhor: ele aprende." Pergunta de FAQ e pergunta na voz do leitor estão bem.
- **Frases prontas**: "Diga adeus a", "Leve sua clínica a outro nível", "Descubra o poder de", "Desbloqueie", "Potencialize", "Transforme sua clínica", "Vale ressaltar que", "Em um mundo cada vez mais...".
- **Travessão** no assunto e na prévia; no máximo um ou dois num e-mail longo.

Vícios próprios de e-mail:
- **Isca no assunto**: "Re:" ou "Enc:" falsos, "Você não vai acreditar", "🔥 Novidade", "URGENTE", caixa alta. O assunto tem que se sustentar se for a única linha lida.
- **Abertura pronta**: "Espero que este e-mail o encontre bem", "Passando para lembrar", "Ótima notícia!". Comece pelo motivo do e-mail.
- **Fechamento de enchimento**: "Qualquer dúvida, estamos à disposição", "Fique à vontade para entrar em contato". Peça uma ação específica ou termine. No e-mail ao paciente, nunca "responda este e-mail": o endereço não recebe respostas.
- **Marcação de gênero e tratamento de ofício**: "Prezado(a)", "bem-vindo(a)". Reescreva neutro: "Boas-vindas", "Que bom ter sua clínica aqui".

A lista completa está em [references/guia-de-texto.md](references/guia-de-texto.md).

### Tamanho
- 50 a 125 palavras no transacional (todo e-mail ao paciente)
- 150 a 300 palavras no educativo
- 300 a 500 palavras no que conta uma história

### Botão
- Botão para a ação principal.
- Link no texto para a secundária.
- Um botão principal por e-mail.
- Texto do botão: ação e resultado ("Cadastrar meu primeiro paciente", "Abrir meu programa").

**Personalização, segmentação e medição**: [references/guia-de-texto.md](references/guia-de-texto.md)

---

## Formato da entrega

### Visão da sequência
```
Sequência: [nome]
Público: [clínica (qual papel) ou paciente]
Gatilho: [evento do sistema que coloca a pessoa na sequência, e onde ele fica no código]
Objetivo: [ação principal, e como o sistema mostra que aconteceu]
Tamanho: [número de e-mails]
Intervalos: [tempo entre e-mails]
Saída: [quando a pessoa sai: fez a ação, mudou de plano, cancelou, pediu para parar]
Transacional ou não: [se não for, a chave da clínica e o link de parar de receber]
Depende de: [fato que o sistema ainda não grava, se houver]
```

### Para cada e-mail
```
E-mail [nº]: [nome/propósito]
Envio: [quando]
Remetente: [IVS MED, ou "<clínica> via IVS MED"]
Assunto: [assunto]
Prévia: [texto de prévia]
Corpo: [texto completo]
Botão: [texto] → [tela ou link de destino]
Dados usados: [campos variáveis e de onde vêm]
Condições: [plano, papel, segmento, se houver]
```

### Como medir
O que medir no sistema e a referência de comparação (veja [references/guia-de-texto.md](references/guia-de-texto.md)).

---

## Perguntas da tarefa

1. Que evento do sistema coloca a pessoa na sequência?
2. Qual a ação principal que o e-mail pede?
3. O que a pessoa já sabe do fisioweb, ou da clínica, no caso do paciente?
4. Que outros e-mails ela recebe (confirmação de cadastro, programa, lembrete)?
5. Há algum dado de como os e-mails atuais se saem?

---

## Como o fisioweb envia e-mail

O fisioweb envia pelo próprio Laravel: Notification ou Mailable, pela fila. Na `main` há a confirmação de cadastro da clínica e o reset de senha. Na branch `feat/modulo-comunicacao`, o módulo `Email` monta e envia, a origem autoriza e dispara um evento só com ids, e o listener do `Email` roda na fila (ADR 030). As decisões da feature 022 citam o Resend, com limite de 100 e-mails por dia no plano grátis, somando todas as clínicas: uma sequência para clínicas disputa essa cota com os e-mails aos pacientes. Confira o estado atual no código ou na branch antes de afirmar.

Ferramenta externa de automação (Mailchimp, RD Station, Customer.io e parecidas) é decisão separada, com custo, contrato de tratamento de dados e sincronização com o sistema. Se o usuário quiser, leve ao `refinar`. Esta skill não a pressupõe.

---

## Skills relacionadas

- **jornada-do-cliente**: mapear a jornada da clínica ou do paciente antes de decidir que e-mails mandar.
- **refinar**: começar a implementação do envio que esta skill desenhou.
- **laravel-queues** e **architecture-paradigm-modular-monolith**: para quem implementa (envio pela fila; evento e contrato público entre módulos).
- **prototype**: comparar variantes de layout do e-mail antes de decidir.
