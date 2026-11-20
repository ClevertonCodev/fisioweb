---
name: jornada-do-cliente
description: "Mapa de jornada de quem usa o fisioweb (a clínica que assina, o fisioterapeuta, a secretária ou o paciente): estágios, pontos de contato, curva emocional, dores, momentos da verdade e oportunidades, em markdown com mermaid. Recusa inventar emoção ou comportamento sem pesquisa. Use para mapear a experiência num trecho do produto (cadastro e teste, primeiro paciente, envio do programa, paciente fazendo os exercícios, renovação ou troca de plano) antes de decidir o que construir. Fora do ciclo do harness: só roda quando o usuário chamar."
disable-model-invocation: true
---

# jornada-do-cliente — sintetize pesquisa, não invente

**Um mapa de jornada é um artefato de síntese, não um brainstorm.** Todo estágio, touchpoint, emoção e dor tem que rastrear até um input de pesquisa (entrevista, survey, analytics, ticket de suporte, observação). Entradas do tipo "imagino que o usuário se sente frustrado aqui" são o anti-padrão P0 — ficção vestida de insight, que engana o time.

- Se o usuário traz **sinal de pesquisa**, ancore o mapa nele.
- Se traz **hipóteses**, rotule cada entrada como **Hipótese (confiança: Baixa)** e recomende pesquisa de validação.

Esta skill **se recusa a fabricar** dado emocional ou comportamental sem pesquisa (ver *Protocolos de recusa*).

Origem: `jornada-do-cliente` do pacote "50 skills de IA" (Alura), adaptada ao fisioweb.

**Fora do ciclo do harness.** Não é etapa do `refinar` → `escrever-plano` → `criar-tarefas` → `implementar-tarefa`, não conta para a Definição de Pronto e não muda código. Entrega o mapa na conversa. Se o usuário quiser guardar, grave em `.ai-workbench/<feature>/jornada-<persona>.md` da feature que ele indicar; uma oportunidade que vire funcionalidade segue depois pelo `refinar`, como qualquer pedido.

## No fisioweb

**Personas possíveis** (pergunte qual, uma por mapa):

- **Clínica que assina**: quem cadastra a clínica e decide o plano (Start, Performance ou Premium), em geral o administrador.
- **Fisioterapeuta**: atende, monta a evolução e o programa de exercícios.
- **Secretária**: agenda, cadastra paciente, cuida do financeiro.
- **Paciente**: recebe o programa e o questionário, faz os exercícios, vai às consultas.

**Fases que costumam caber num mapa** (escolha uma; o produto inteiro é grosso demais):

- cadastro da clínica e primeiros dias (até o primeiro paciente cadastrado);
- primeiro programa de exercícios enviado e o paciente começando a fazer;
- rotina da agenda e das consultas;
- renovação, troca de plano ou cancelamento.

**Pontos de contato que o código já mostra**: telas em `resources/js/pages/`, e-mails e mensagens enviados pelo sistema, o App do paciente, PDFs entregues a ele. Ler o código para **listar** os pontos de contato vale. O código não diz o que a pessoa sente nem onde ela desiste: isso vem de pesquisa (conversa com clínica, suporte, dados de uso) ou fica como Hipótese.

**Sem dado pessoal no mapa**: nada de nome de paciente, de clínica real ou dado clínico. Cite a fonte de forma agregada ("5 conversas com clínicas", "tickets de suporte de março").

## Inputs

**Obrigatórios:** persona/segmento (para QUEM é a jornada) · objetivo/resultado (o que o cliente tenta realizar) · escopo (fim-a-fim OU focado numa fase, tipo cadastro e primeiros dias, primeiro programa enviado, renovação, suporte).

**Opcionais (melhoram a qualidade):** dado de pesquisa (síntese de entrevistas, survey, tickets, analytics) · mapa existente a revisar · estágios/touchpoints que o usuário quer garantir · tipo linear (default) vs. cíclico.

## O que você produz

1. **Sumário executivo** (3-5 frases) — para quem, o que tenta realizar, onde estão as maiores dores e oportunidades, e o momento da verdade mais importante.
2. **Persona / segmento** — 1 parágrafo resumindo o cliente que a jornada descreve.
3. **Escopo** — a fase/ciclo coberto. Diga explicitamente o que **inclui** e o que **exclui**.
4. **Estágios (3-7 nomeados)** — nome em verbo de cliente ("Descobre", "Considera", "Experimenta", "Decide", "Usa", "Renova"). Cada um: objetivo do cliente ali · duração estimada · gatilho de entrada · critério de saída.
5. **Touchpoints por estágio** — onde o cliente interage com o produto/organização:

   | Estágio | Touchpoint | Canal | O que acontece |
   |---|---|---|---|
   | Experimenta | Cadastro da clínica | Site do fisioweb | Cria a conta e escolhe o plano |
   | Começa a usar | Lista de pacientes vazia | Painel da clínica | Precisa cadastrar o primeiro paciente |

6. **Curva emocional** — o que o cliente sente em cada estágio. Rótulos **específicos** (frustração, esperança, ansiedade, alívio), nunca genéricos (feliz/triste):

   | Estágio | Emoção dominante | Confiança | Fonte |
   |---|---|---|---|
   | Experimenta | Curiosidade, leve ceticismo | Média | 6 conversas com clínicas; 2 citaram ceticismo |
   | Começa a usar | Insegurança | Hipótese (Baixa) | sem pesquisa: validar com o suporte |

   Sem dado de pesquisa, **toda** entrada vira "Hipótese / confiança Baixa" + recomendação de validar.

7. **Dores e momentos da verdade** — dor = onde há atrito/confusão/bloqueio. Momento da verdade (MdV) = **não** toda interação, só os **3-5** momentos que decidem se o cliente continua ou abandona.

   | Estágio | Dor / MdV | Severidade (1-5) | Evidência do cliente | Implicação |
   |---|---|---|---|---|
   | Experimenta | Dúvida entre Performance e Premium | 4 | 4 de 6 conversas | Atrasa a decisão; precisa de clareza no que cada plano libera |
   | Começa a usar | Primeiro programa enviado ao paciente (momento da verdade) | 5 | Hipótese: validar com dados de uso | Pode virar o critério de ativação da clínica |

8. **Oportunidades por estágio** (1-3) — onde o produto pode intervir para reduzir dor ou amplificar um MdV. Tabela: estágio · oportunidade · mudança de produto que resolve · esforço (grosso).
9. **Visual (mermaid)** — quando viável; tabelas markdown são sempre o fallback válido. `timeline` para jornada linear; `flowchart` para ramificada com pontos de decisão. Com **5+ estágios**, gere também blocos seccionais (por estágio ou a cada 2-3) para não sobrecarregar e falhar o render.

   ```
   timeline
       title Jornada da clínica nos primeiros dias
       Experimenta : Cria a conta : Escolhe o plano
       Começa a usar : Cadastra o primeiro paciente : Monta a agenda
       Ativa : Envia o primeiro programa : Paciente faz os exercícios
       Decide : Continua no plano, troca ou cancela
   ```

10. **Lacunas de pesquisa (explícitas)** — o que o mapa **não** endereça por falta de dado, e qual pesquisa de follow-up fecharia as lacunas mais importantes.

## Protocolos de recusa

Você **recusa** produzir o mapa sem qualidade mínima de input:

1. **Sem persona ou escopo** → "Preciso saber de quem é a jornada e o que a pessoa tenta realizar. Me dê uma persona (ou um resumo) e o objetivo."
2. **Fabricar emoção sem pesquisa** → "Posso sugerir emoções hipotéticas, mas elas virão rotuladas como Hipótese (confiança: Baixa) e recomendadas para validação. Segue no modo-hipótese, ou você tem dado de pesquisa para ancorar?"
3. **Escopo excessivo** (a vida inteira da clínica no fisioweb) → é grosso demais para ser útil: "Escolha uma fase: cadastro e primeiros dias, primeiro programa enviado, rotina da agenda, ou renovação e cancelamento."
4. **Um único ponto de contato como "jornada"** (ex.: "a tela de novo paciente") → "Uma tela só não é uma jornada. Expanda para os estágios em volta (cadastrar o paciente, montar o programa, enviar, o paciente abrir), ou trate a tela como outro artefato."

> Escopo: esta skill cobre o lado da **experiência do usuário** (journey maps, user flows, funis como lente de experiência). Não produz *service blueprints*, diagramas operacionais nem mapas de arquitetura de sistema.

## Padrões

- **Linear (default)** — sequência única, início ao fim. Jornadas de compra, onboarding, resolução de suporte.
- **Cíclica** — loop recorrente; o cliente volta a um estágio numa cadência. Ciclos de renovação, loops de engajamento, tarefas recorrentes.
- **Multi-ator (avançado)** — personas com jornadas que se cruzam (ex.: comprador + influenciador + usuário em B2B). Use **com parcimônia**: tabelas markdown paralelas (uma por ator) com touchpoints compartilhados anotados, mermaid simplificado ou omitido, e um aviso de complexidade — priorize a profundidade de pesquisa no ator primário.

## Checklist de qualidade

- [ ] Persona e escopo declarados explicitamente.
- [ ] 3-7 estágios nomeados, cada um com objetivo, duração, gatilho e critério de saída.
- [ ] **Toda** entrada da curva emocional tem confiança **e** fonte (ou está marcada como Hipótese).
- [ ] Momentos da verdade limitados aos 3-5 que decidem continuar × abandonar, não toda interação.
- [ ] Cada oportunidade se amarra a uma dor ou MdV específico.
- [ ] Mermaid presente quando viável, com tabelas como fallback.
- [ ] Lacunas de pesquisa declaradas explicitamente.
