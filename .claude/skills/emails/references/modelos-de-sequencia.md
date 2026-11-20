# Modelos de sequência

Modelos detalhados das sequências mais comuns no fisioweb. Os nomes de tela e de coluna citados abaixo valem para o código de novembro de 2026; confira antes de usar.

## Conteúdo
- Boas-vindas (depois do cadastro da clínica)
- Ativação: clínica que não criou o primeiro paciente
- Ativação: clínica que não enviou nenhum programa
- Primeiros passos (clínica usando)
- Reativação (clínica parada)
- Nutrição antes do cadastro
- Paciente: programa enviado e não aberto
- Paciente: lembrete de consulta

## Boas-vindas (depois do cadastro da clínica)

**Gatilho:** clínica cadastrada (`ClinicRegistrationService::register`). O primeiro e-mail já existe: a confirmação de e-mail, com link de 24 h. A sequência de boas-vindas começa quando o mestre confirma o e-mail (`email_verified_at` preenchido).
**Sai quando:** a clínica fez a ação do e-mail seguinte (ex.: já criou paciente, pula o e-mail 2), cancelou ou pediu para parar.

**E-mail 1: Boas-vindas (na hora da confirmação)**
- Assunto: "{clínica}, sua conta está pronta"
- Um passo só: cadastrar o primeiro paciente
- Diga o que vem nos próximos e-mails e com que frequência

**E-mail 2: Vitória rápida (dia 1 ou 2)**
- Assunto: "Seu primeiro programa de exercícios em 10 minutos"
- Um resultado pequeno e visível: o paciente recebe o programa no celular
- Link direto para `/clinica/programas/novo`

**E-mail 3: Por que o fisioweb existe (dia 3 ou 4)**
- Assunto: "Por que fizemos o fisioweb"
- A história ou o propósito, curto
- Mostre que você conhece o dia a dia da clínica (papel, WhatsApp, planilha)

**E-mail 4: Prova (dia 5 ou 6)**
- Assunto: "Como a {clínica de exemplo} acompanha os exercícios em casa"
- Caso real, com autorização da clínica; se não houver, pule este e-mail
- Parecido com a situação de quem lê
- Botão leve para explorar

**E-mail 5: Objeção (dia 7 ou 8)**
- Assunto: "Sem tempo para montar programa? Comece por um modelo"
- A hesitação mais comum
- Mude o ângulo do obstáculo
- Mostre o caminho fácil

**E-mail 6: Funcionalidade principal (dia 9 a 11)**
- Assunto: "Já usou a agenda com lembrete para o paciente?"
- Uma funcionalidade pouco usada **que o plano da clínica tem**
- Benefício claro
- Botão direto para a tela

**E-mail 7: Plano (dia 12 a 14)**
- Assunto: depende do que o usuário decidir sobre teste e cobrança (hoje a clínica nova entra no Premium sem data de fim)
- Resuma o que a clínica já fez ("12 pacientes, 5 programas enviados")
- Oferta clara, se houver
- Prazo só se for verdadeiro

---

## Ativação: clínica que não criou o primeiro paciente

**Gatilho:** 2 dias depois de confirmar o e-mail, nenhum paciente cadastrado na clínica.
**Público:** o mestre; se a clínica já tem secretária cadastrada, pergunte ao usuário se ela também recebe.
**Sai quando:** o primeiro paciente é criado.

**E-mail 1 (dia 2)**
- Assunto: "Já cadastrou seu primeiro paciente?"
- Lembre o que a clínica começou
- Por que esse passo importa (sem paciente, não há agenda nem programa)
- Botão: "Cadastrar meu primeiro paciente" → `/clinica/pacientes/novo`
- Ofereça ajuda com um caminho concreto (quem contatar)

Exemplo de texto:

```
Assunto: Já cadastrou seu primeiro paciente?
Prévia: Leva dois minutos, e com ele você já pode marcar consulta e enviar programa.

Olá, {nome}!

A conta da {clínica} está pronta, mas ainda não tem paciente cadastrado.
Com o primeiro paciente, você já marca consulta na agenda e envia um
programa de exercícios para ele fazer em casa.

[Cadastrar meu primeiro paciente]

Se preferir que a gente ajude a configurar, fale com {contato do suporte}.
```

**E-mail 2 (dia 5)**
- Assunto: "Comece com um paciente que você atende esta semana"
- Ângulo prático: um paciente real da semana, não a base inteira
- Mesmo botão

**E-mail 3 (dia 9)**
- Assunto: "Precisa de ajuda para começar?"
- Ajuda direta (conversa, importação, se existir)
- Sem venda

---

## Ativação: clínica que não enviou nenhum programa

**Gatilho:** clínica com pelo menos um paciente e nenhum programa enviado 7 dias depois do primeiro paciente.
**Condição:** só para planos com Programas e Exercícios (`PlanFeatureSeeder`: hoje Performance e Premium). Para o Start, isso vira e-mail de troca de plano, com outro texto.
**Público:** o mestre e, se o usuário quiser, os fisioterapeutas da clínica (quem monta programa).
**Sai quando:** o primeiro programa é enviado.

**E-mail 1 (dia 7)**
- Assunto: "Mande o primeiro programa de exercícios"
- O que o paciente recebe: um link no celular com os exercícios, que abre sem senha
- Botão: "Montar um programa" → `/clinica/programas/novo`

**E-mail 2 (dia 10)**
- Assunto: "Monte um programa a partir de um modelo"
- Atalho: os modelos de programa (`/clinica/programas/modelos`) e a biblioteca de exercícios
- Mesmo botão

**E-mail 3 (dia 14)**
- Assunto: "O que o paciente vê quando recebe o programa"
- Mostre a tela do paciente (imagem sem dado real)
- Último e-mail sobre o tema

---

## Primeiros passos (clínica usando)

O e-mail apoia o que a tela já mostra; não repete o que o painel já orienta.

**E-mail 1: Boas-vindas e primeiro passo (na hora)**
- Confirme o cadastro
- Uma ação crítica
- Link direto para ela

**E-mail 2: Ajuda para começar (dia 1)**
- Só se o passo 1 não foi feito
- Dica curta ou vídeo
- Onde pedir ajuda

**E-mail 3: Funcionalidade em destaque (dia 2 ou 3)**
- Uma funcionalidade que a clínica deve conhecer, do plano dela
- Um uso concreto ("marque a consulta e o paciente recebe lembrete 24 h antes")
- Link para a tela

**E-mail 4: Caso de outra clínica (dia 4 ou 5)**
- Clínica que deu certo, com autorização
- Caminho parecido com o de quem lê

**E-mail 5: Como está indo? (dia 7)**
- Pergunte como está
- Peça opinião (link para formulário ou conversa; o endereço do sistema não recebe resposta)
- Ofereça ajuda

**E-mail 6: Dica avançada (dia 10 a 12)**
- Funcionalidade para quem já usa (Finanças, questionários, modelos de evolução)
- Só para clínicas ativas

**E-mail 7: Plano ou equipe (dia 14 em diante)**
- Em teste (se existir): conversão
- No Start: o que o Performance libera
- Clínica com um usuário só: convidar a equipe (`/clinica/usuarios/novo`); lembre que a cobrança é por usuário

---

## Reativação (clínica parada)

**Gatilho:** 30 a 60 dias sem paciente novo, consulta marcada nem programa enviado. O código não grava o último acesso do usuário da clínica; ou a sequência usa esses fatos, ou gravar o acesso entra na implementação.
**Sai quando:** a clínica volta a usar (qualquer um dos fatos acima) ou pede para parar.

**E-mail 1: Contato (no dia do gatilho)**
- Assunto: "Está tudo certo com a {clínica}?"
- Interesse de verdade
- Pergunte o que aconteceu (link para resposta curta)
- Uma ação fácil para voltar

**E-mail 2: O que mudou (2 ou 3 dias depois)**
- Assunto: "O que mudou no fisioweb desde abril"
- Novidades que resolvem motivos comuns de parada
- Botão curto

**E-mail 3: Ajuda concreta (5 a 7 dias depois)**
- Assunto: "Quer ajuda para reorganizar a agenda?"
- Ajuda em vez de desconto; desconto só se o usuário decidir que existe
- Botão claro

**E-mail 4: Último contato (10 a 14 dias depois)**
- Assunto: "Paramos de mandar estes e-mails?"
- Honesto e direto
- Um clique para continuar recebendo ou sair
- Sem resposta: tire a clínica da sequência

---

## Nutrição antes do cadastro

Serve para quem deixou contato antes de criar a conta (material, aula, lista de espera). O código não captura contato antes do cadastro (`/clinica/criar-conta` já cria a conta). Só desenhe esta sequência se o usuário disser de onde vêm esses contatos e com que consentimento.

1. **Entrega e apresentação (na hora):** entregue o que foi prometido, diga quem somos, o que vem a seguir.
2. **Aprofundar o tema (dia 2 ou 3):** algo útil ligado ao material; botão leve.
3. **O problema (dia 4 ou 5):** o problema da clínica dito com precisão (paciente que não faz exercício em casa, agenda no papel).
4. **Como resolvemos (dia 6 a 8):** o jeito de trabalhar, educativo.
5. **Caso (dia 9 a 11):** resultado real de uma clínica, com autorização.
6. **Diferença (dia 12 a 14):** por que este caminho, e as alternativas (planilha, WhatsApp, outro sistema).
7. **Objeção (dia 15 a 18):** dúvida comum respondida.
8. **Oferta (dia 19 a 21):** convite para criar a conta, com botão para `/clinica/criar-conta`.

---

## Paciente: programa enviado e não aberto

**Contexto:** o e-mail "Seu programa de exercícios está disponível" já sai quando a clínica clica em E-mail no modal "Enviar ao paciente" (branch `feat/modulo-comunicacao`, `TreatmentPlanSentMail`). Este modelo é o aviso seguinte, para quem não abriu.
**Gatilho:** 3 dias depois do envio por e-mail, o programa continua sem `patient_viewed_at` (coluna de `clinic_treatment_plans`, preenchida por `RegisterPatientProgramViewService`). O programa não guarda a data do envio por e-mail; essa data entra na implementação.
**Não é transacional:** sai sem clique. Precisa de chave da clínica (desligada por padrão) e de link "Não quero mais receber estes avisos" no rodapé. Pergunte ao usuário se usa o mesmo campo do lembrete de consulta ou um novo.
**Remetente:** "<clínica> via IVS MED". **Um e-mail só**; nunca uma sequência de cobrança ao paciente.
**Sai quando:** o paciente abre o programa, o programa é arquivado ou concluído, ou o paciente pede para parar.

```
Assunto: Seu programa de exercícios está esperando · {clínica}
Prévia: É só tocar no botão para abrir. Não precisa de senha.

Olá, {apelido ou primeiro nome}!

A {clínica} enviou um programa de exercícios para você fazer em casa,
e ele ainda não foi aberto.

[Abrir meu programa]

Este link é só seu. Dúvidas sobre os exercícios? Ligue para a clínica:
{telefone}.

Rodapé: Enviado pela IVS MED em nome da {clínica}. Este endereço não
recebe respostas. Não quero mais receber estes avisos.
```

O que fica fora: o título do programa no assunto, o nome dos exercícios, qualquer menção à condição do paciente.

---

## Paciente: lembrete de consulta

**Contexto:** desenhado na feature 022 (tarefa 009, ainda a fazer em 2026-11-20). Use como referência e confira o estado na branch.
**Gatilho:** comando de hora em hora; consultas com paciente, marcadas ou confirmadas, que começam entre 23 e 24 h depois da rodada.
**Condições:** chave da clínica ligada (desligada por padrão), paciente com e-mail e com "Receber lembrete de consulta por e-mail" ligado. Um lembrete por consulta e horário.
**Não é transacional:** tem o link "Não quero mais receber lembretes" no rodapé (tarefa 010).

```
Assunto: Lembrete: consulta amanhã às {hh:mm} · {clínica}
Prévia: {dia da semana}, {data}, com {profissional}.

Sua consulta é amanhã

Olá, {apelido ou primeiro nome}!

Data: {data}
Horário: {hh:mm}
Profissional: {nome}
Local: {endereço da clínica}

[Como chegar]            (só se a clínica tem endereço)

Não vai conseguir ir? Avise a clínica pelo {telefone}.

Rodapé: Enviado pela IVS MED em nome da {clínica}. Este endereço não
recebe respostas. Não quero mais receber lembretes.
```

O que fica fora: o motivo da consulta, o tipo de atendimento quando ele revela condição, a sessão atual do tratamento ("sessão 4 de 10").
