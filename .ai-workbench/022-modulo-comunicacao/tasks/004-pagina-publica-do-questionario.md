# Página pública para o paciente responder o questionário

**Tipo:** História
**Plano:** `../plans/modulo-comunicacao.md`
**Histórias:** 24, 25, 26, 27, 33
**Issue:** ainda não criada

## Descrição

O link do questionário (`/<clínica>/paciente/questionarios/<token>`) cai hoje num 404 do front: a API pública existe, mas a tela não. Esta tarefa cria a página onde o paciente responde, na variante B do protótipo ("Formulário inteiro"). Ela vem antes do e-mail do questionário, que só faz sentido com a página no ar.

## O que construir

- **Backend (módulo `ClinicQuestionnaire`, rotas públicas sem guard, achando o envio só pelo `public_token`, ADR 023):**
  - O `GET` público passa a devolver o nome da clínica (`clinic_name`). Continua sem o profissional (`clinicUser`) e sem e-mail ou documento de ninguém.
  - O 422 do `GET` e do `POST` públicos ganha `reason`: `answered` quando o envio já foi respondido, `expired` quando venceu. Hoje a mensagem é a mesma para os dois.
- **Página no SPA em `/:clinicSlug/paciente/questionarios/:token`,** pública e sem login, com domínio, port, hook, repositório e mapper próprios (snake_case para camelCase):
  - Cabeçalho com o nome da clínica, o título, o prazo e "A <clínica> pediu que você responda…".
  - Todas as perguntas numa página, por seção numerada.
  - Tipos de pergunta: escala (botões de mínimo a máximo, com legenda nas pontas), escolha única, múltipla escolha ("pode marcar mais de uma") e texto.
  - Obrigatórias marcadas com `*`.
  - Barra fixa embaixo com "x de N respondidas" e "Enviar".
  - Enviar com obrigatória sem resposta rola até a primeira e a marca em vermelho, sem chamar a API.
  - Enviar com tudo certo chama o `POST` e mostra "Respostas enviadas".
  - Estados próprios: prazo vencido, já respondido e link inválido (404).
  - Funciona no celular, com o design system v2.
- **Sem migration.** A rota pública não recebe `clinic_id` da requisição: o envio é achado só pelo token, e a resposta não traz dado de outro paciente.

## Critérios de Aceite

- [x] O `GET` público devolve `clinic_name` e continua sem `clinic_user_id` nem dado do profissional (teste).
- [x] Envio já respondido dá 422 com `reason: answered`; envio vencido dá 422 com `reason: expired`, no `GET` e no `POST` (teste).
- [x] Id numérico ou token inexistente continua dando 404 (os testes do ADR 023 seguem passando).
- [x] A página mostra as perguntas dos quatro tipos por seção, com o nome da clínica no cabeçalho (Vitest).
- [x] Enviar com obrigatória em branco não chama a API, rola até a primeira e mostra "Responda esta pergunta" (Vitest).
- [x] Enviar completo chama o `POST` com `{ answers: [{ question_id, answer }] }` e mostra "Respostas enviadas" (Vitest).
- [x] Os estados vencido, já respondido e link inválido mostram a mensagem certa (Vitest).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Um paciente não vê nem altera nada de outro paciente
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/modulo-comunicacao`
- **Exemplo no código:**
  - Back: `QuestionnaireAnswerController` e `PatientQuestionnaireService` (`showForPublic`, `ensurePendingAndNotExpired`); ADR 023.
  - Front: as telas da área do paciente em `pages/patient/program/` (`DsPatientNavbar`, layout no celular), por exemplo a de feedback do programa.
- **Referência visual:** branch `prototype/022-emails`, `pages/patient/questionnaire-answer-prototype/` (`VariantB`).
- **Skills:** `frontend-ddd`, `design-system`, `api-client`, `frontend-testing`, `php-testing`, `security-audit`.

## Como testar na mão

1. Como profissional da clínica A, envie um questionário a um paciente pelo prontuário e copie o link.
2. Abra o link numa janela anônima, no celular ou com a janela estreita. A página mostra o nome da clínica e as perguntas.
3. Tente enviar faltando uma obrigatória: a página rola até ela.
4. Responda tudo e envie: aparece "Respostas enviadas", e o prontuário mostra o questionário respondido.
5. Abra o mesmo link de novo: aparece "Você já respondeu este questionário".
6. Troque uma letra do token: aparece "Link não encontrado".
