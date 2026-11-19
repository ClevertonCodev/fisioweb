# Criar o módulo Email com o layout IVS MED e passar os e-mails do sistema para ele

**Tipo:** Tarefa
**Plano:** `../plans/modulo-comunicacao.md`
**Histórias:** 34, 35, 36
**Issue:** ainda não criada

## Descrição

Os dois e-mails que o sistema manda hoje, a confirmação de cadastro da clínica e o esqueci minha senha (admin e clínica), saem com o layout padrão do Laravel. Esta tarefa cria o módulo `Email`, que vai ser o dono de todos os templates, com o layout escolhido no protótipo (variante A), e faz os dois e-mails do sistema usarem esse layout.

A origem não passa a depender do `Email`: o provider do módulo aponta o tema de e-mail das notificações do Laravel para o layout IVS MED. O reset de senha, que hoje sai na hora, passa a sair pela fila.

## O que construir

- **Módulo `modules/Email`:** registrado como os outros, com raiz em minúsculo, providers, `config` e `tests/Unit` e `tests/Feature`.
  - Ele é técnico, como `Pdf` e `Cloudflare`, e não entra no mapa de capacidades com prefixo `Clinic`.
  - Entra no teste de fronteira (`ModuleBoundaryTest`): sem `use` de Model, Repository ou interface de Repository de outro módulo.
- **Layout A em componente Blade:**
  - HTML de e-mail com tabelas, estilo inline, 600px e versão de celular.
  - Faixa azul-marinho com o logo em PNG embutido (anexo inline) e o nome do remetente.
  - Cartão branco com selo do tipo, título, corpo, bloco de detalhes, citação opcional e botão largo.
  - "Se o botão não funcionar", com o link.
  - Rodapé "Enviado pela IVS MED… Este endereço não recebe respostas".
  - Os e-mails do sistema mostram só "IVS MED" no cabeçalho.
- **Tema das notificações do Laravel (`MailMessage`):** apontado para o layout. A `VerifyClinicEmailNotification` (já na fila pelo `SendClinicEmailVerificationJob`) e o `ResetPassword` ganham o visual sem a origem saber do `Email`.
- **Reset de senha pela fila:** para os brokers de admin e de clínica, com o mesmo link de hoje.
- **Textos:** os de hoje continuam, em português, com as traduções de `lang/pt_BR.json` (feature 021).
- **Remetente:** "IVS MED" `<naoresponda@ivsmed.com>`, sem Reply-To.
- **Sem migration.** Não toca dado de clínica nem de paciente; só muda como dois e-mails existentes são montados e enviados.
- **ADR novo:** o módulo `Email`, a regra "a origem autoriza, o `Email` monta e envia", os eventos de integração "…EmailRequested" e `AppointmentReminderDue`, e o tema único dos e-mails.

## Critérios de Aceite

- [ ] O módulo `Email` aparece registrado e ativo, e os testes de arquitetura (`--testsuite Architecture`) passam com ele incluído no teste de fronteira.
- [ ] A confirmação de cadastro da clínica sai com o layout IVS MED: cabeçalho "IVS MED", botão "Confirmar meu e-mail", o aviso de 24 horas e o rodapé novo (teste que renderiza a notificação).
- [ ] O e-mail de redefinição de senha (admin e clínica) sai com o layout IVS MED, em português, com o link de hoje e "expira em 60 minutos" (teste que renderiza).
- [ ] Pedir redefinição de senha põe o envio na fila em vez de mandar na hora (teste com `Notification::fake` ou `Queue::fake`).
- [ ] O remetente é "IVS MED" `<naoresponda@ivsmed.com>` e os e-mails não têm Reply-To.
- [ ] O logo vai embutido no e-mail (anexo inline), não como link para fora.
- [ ] O ADR do módulo `Email` está em `docs/adr/`.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/modulo-comunicacao`
- **Exemplo no código:**
  - `modules/Clinic/tests/Feature/ClinicRegistrationTest.php` (`Notification::fake` e o job da verificação)
  - `tests/Unit/Mail/ResetPasswordEmailTranslationTest.php` (render do reset em português)
  - Para criar o módulo, copiar a estrutura de `modules/ClinicQuestionnaire` (`module.json`, `composer.json`, providers).
- **Referência visual:** branch `prototype/022-emails`, layout `resources/views/prototype/emails/variant-a.blade.php`. O logo em PNG está em `public/images/email-prototype/`. É referência; reescreva.
- **Skills:** `architecture-paradigm-modular-monolith`, `backend-clean-code`, `laravel-queues`, `php-testing`, `domain-modeling` (ADR).

## Como testar na mão

1. Com o SMTP do Resend no `.env` local (`MAIL_MAILER=smtp`) e o worker da fila rodando, cadastre uma clínica nova em `/clinica/criar-conta` com um e-mail seu do Gmail.
2. No Gmail, a confirmação chega de "IVS MED", com a faixa azul-marinho, o logo e o botão "Confirmar meu e-mail".
3. Em `/clinica/recuperar-senha`, peça a redefinição. O e-mail chega pela fila, em português, com o mesmo visual.
4. Repita o passo 3 em `/admin/recuperar-senha`.
5. Abra os dois no celular e confira que o layout se ajusta.
