# Adiado · 009-clinic-prontuario-ds

O que esta feature deixou de fora, na hora da decisão.

## Desenhos v2 das ações de escrita

- Nova evolução B (“Folha da evolução”) — pasta `new-evolution/`. Feature própria.
- Enviar arquivo B — pasta `new-file/`. Feature própria.
- Enviar questionário A (“Escolher e prever”) — pasta `new-questionnaire/`. Feature própria.

Nesta entrega as três ações abrem os fluxos da v1 que já gravam.

## Tela do paciente responder o questionário

A URL nasce com token (`/{slug}/paciente/questionarios/{token}`). A página
da área do paciente não é construída agora. A API pública já acha pelo
token para essa tela não nascer sem contrato.

## Agenda inteira do paciente para o fisioterapeuta

O painel do fisio conta só as consultas dele. Abrir as consultas que outro
profissional fez com o mesmo paciente exige mudar Policy e service da
agenda (ADR 018). Evoluções, avaliações, questionários, arquivos e
programas do paciente o fisio já vê.

## Fora de propósito desta tela

- WhatsApp pela Twilio ou e-mail pelo servidor (aqui é `wa.me` e `mailto`).
- Endpoint de resumo (`care-summary`).
- Busca e drawer abertos na URL (só a aba vai).
- Avaliação e builder de programa em v2 (só o `patientId` no cadastro de programa).
