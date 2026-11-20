# Guia de texto

## Conteúdo
- Estrutura
- Formatação
- Tom
- Tamanho
- Botão ou link
- Vícios de escrita (lista completa)
- Personalização (campos variáveis, conteúdo por segmento, e-mail por gatilho)
- Segmentação (por comportamento, por momento, por perfil)
- Testes e medição (o que testar, como testar, o que medir)

## Estrutura

1. **Abertura**: a primeira linha diz por que você está escrevendo
2. **Contexto**: por que importa para a pessoa
3. **Conteúdo**: o que é útil
4. **Botão**: o que fazer agora
5. **Fechamento**: curto e humano

## Formatação

- Parágrafos curtos (1 a 3 frases)
- Espaço entre blocos
- Lista para o que se lê de relance
- Negrito com moderação
- Pensado para o celular, onde a maioria lê
- No e-mail ao paciente, use os componentes do layout da branch (`x-mail::details` para data e hora, `x-mail::quote` para a mensagem do profissional, `x-mail::button`) em vez de inventar formato

## Tom

- Conversa, não ofício
- "Você" para quem lê; "a gente" ou "nós" para o fisioweb
- No e-mail ao paciente, quem fala é a clínica, em terceira pessoa: "A {clínica} preparou um programa para você"
- Voz ativa
- Amigável, sem intimidade forçada; paciente pode ser idoso, use frases simples
- Leia em voz alta. Parece uma pessoa falando?

## Tamanho

- Mais curto costuma ser melhor
- 50 a 125 palavras no transacional (todo e-mail ao paciente)
- 150 a 300 palavras no educativo
- 300 a 500 palavras no que conta uma história
- E-mail longo só se cada parágrafo merecer estar lá

## Botão ou link

- Botão: ação principal, bem visível
- Link no texto: ação secundária
- Um botão principal por e-mail
- Texto do botão: ação e resultado ("Cadastrar meu primeiro paciente", "Abrir meu programa", "Responder questionário")
- Sempre repita o link em texto puro embaixo ("Se o botão não funcionar, copie e cole no navegador"), como fazem as views da branch

---

## Vícios de escrita (lista completa)

O leitor reconhece texto gerado e para de ler. Antes de entregar, procure cada item abaixo no seu texto.

**Estrutura de frase**
- Contraste revelado: "Não é só um sistema, é um parceiro." "Mais do que X, é Y." "Não porque X. Porque Y." Diga Y, com o motivo.
- Lista de negações: "Sem papel, sem planilha, sem dor de cabeça." Diga o que acontece. Uma ausência simples ("Não precisa de senha para abrir") está bem.
- Gerúndio encadeado: "..., garantindo mais adesão, otimizando o tempo da equipe e proporcionando...". Termine na afirmação principal.
- Gerundismo: "vamos estar enviando", "estaremos verificando". Use "vamos enviar", "verificamos".
- Pergunta respondida: "O resultado? Pacientes mais engajados." Pergunta de FAQ e pergunta na voz do leitor estão bem.
- Dois-pontos de revelação: "O melhor de tudo: é grátis."
- Trio de adjetivos: "simples, rápido e eficiente". Escolha um e prove com um fato.

**Frases prontas**
- "Diga adeus a", "Chega de"
- "Leve sua clínica a outro nível", "Eleve", "Potencialize", "Alavanque", "Turbine"
- "Descubra o poder de", "Desbloqueie", "Transforme sua clínica", "Revolucione"
- "Em um mundo cada vez mais conectado", "Nos dias de hoje"
- "Vale ressaltar que", "É importante destacar", "Em suma", "Sem dúvida"
- "Solução completa", "experiência única", "jornada"

**Abertura**
- "Espero que este e-mail o encontre bem"
- "Tudo bem com você?" como enchimento antes do assunto
- "Passando para lembrar", "Só passando para..."
- "Ótima notícia!", "Temos uma novidade incrível!"

Comece pelo motivo do e-mail.

**Fechamento**
- "Qualquer dúvida, estamos à disposição"
- "Fique à vontade para entrar em contato"
- "Conte sempre conosco"
- No e-mail ao paciente: "responda este e-mail" (o endereço não recebe respostas; o caminho é o telefone da clínica)

Peça uma ação específica ou termine.

**Assunto e prévia**
- "Re:" ou "Enc:" falsos
- "Você não vai acreditar", "Última chance!!!" sem prazo real
- Emoji de isca ("🔥", "🚀"), caixa alta, "URGENTE"
- Travessão no assunto e na prévia
- No e-mail ao paciente: qualquer dado clínico, título de programa, motivo da consulta

**Tratamento**
- "Prezado(a)", "bem-vindo(a)", "Caro(a) cliente". Reescreva neutro: "Boas-vindas", "Que bom ter sua clínica aqui", "Olá, {nome}!"
- Excesso de exclamação: uma por e-mail, no máximo

**Pontuação**
- Travessão: no máximo um ou dois num e-mail longo

---

## Personalização

### Campos variáveis
- **Nome:** clínica: o nome do usuário ou da clínica; paciente: o apelido quando ele usa apelido, senão o primeiro nome (decisão da feature 022). Sem nome, use "Olá!" sozinho, como a view da branch faz.
- **Clínica:** nome, telefone e endereço vêm de `/clinica/dados`. Sem telefone ou endereço, a linha some; nunca "Ligue para: (vazio)".
- **Dados de uso:** plano, número de pacientes, programas enviados, consultas. Só números agregados no e-mail à clínica.
- **Datas:** no fuso da clínica, em formato brasileiro ("terça, 25 de novembro, 14:30").

### Conteúdo por segmento
- Pelo plano (o que a clínica tem e o que não tem)
- Pelo comportamento (o que já fez no sistema)
- Pelo momento (recém-cadastrada, usando, parada, cancelada)
- Pelo papel de quem recebe (mestre, fisioterapeuta, secretária)

### E-mail por gatilho
- Sai por uma ação ou falta de ação no sistema
- Mais relevante do que o enviado por data
- Exemplos: primeiro paciente criado, programa enviado, 30 dias sem consulta, programa não aberto

---

## Segmentação

### Por comportamento
O fisioweb não grava abertura nem clique de e-mail (a feature 022 decidiu sem histórico de envios). Segmente pelo que acontece no sistema:
- Criou ou não o primeiro paciente
- Enviou ou não o primeiro programa
- Usa ou não a agenda
- Ativa ou parada (sem paciente, consulta ou programa novo em 30 dias)

### Por momento
- Em teste ou assinante (quando houver teste)
- Recém-cadastrada ou cliente antiga
- Usando bem ou em risco

### Por perfil
- Plano: Start, Performance ou Premium
- Pessoa física (profissional sozinho) ou jurídica (clínica com equipe), pelo `type_person`
- Tamanho da equipe (número de usuários)

---

## Testes e medição

### O que testar
- Assunto (maior impacto)
- Dia e horário
- Tamanho do e-mail
- Posição e texto do botão
- Nível de personalização
- Intervalo entre e-mails

### Como testar
- Teste A/B pede volume. Com poucas clínicas, não há amostra para significância: mude uma coisa por vez, compare períodos e registre o que aprendeu.
- Uma variável por vez
- Anote cada aprendizado; se o usuário quiser guardar, no `decisoes.md` da feature

### O que medir
Meça pela ação no sistema, porque o fisioweb não grava abertura nem clique:
- Taxa de ação: das clínicas que receberam o e-mail, quantas fizeram a ação nos X dias seguintes (criaram paciente, enviaram programa)
- Paciente: dos programas enviados por e-mail, quantos foram abertos (`patient_viewed_at`) e em quanto tempo
- Descadastro: quantos pediram para parar (lembrete e outros não transacionais)
- Falhas de envio: no log e na `failed_jobs`, por tipo de e-mail

Se o usuário quiser abertura e clique, isso é decisão de implementação (registrar o clique no link, por exemplo) e passa pelo `refinar`. No e-mail ao paciente, prefira medir pelo acesso ao link do programa ou do questionário, sem rastreio de abertura.

Referências de mercado (e-mail de SaaS em geral, não metas do fisioweb):
- Abertura: 20% a 40%
- Clique: 2% a 5%
- Descadastro: abaixo de 0,5%
