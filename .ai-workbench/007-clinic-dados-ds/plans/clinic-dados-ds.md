# Dados da clínica no DS v2

Data: 2026-10-19
Fonte: conversa (protótipo aprovado na variante A, item em `docs/prototipos-v2.md`)

## Problema

Quem administra a clínica ainda vê `/clinica/dados` no visual v1, sem a prévia
de como o paciente encontra a clínica (PDF do programa, mensagem com o link,
endereço do link). O protótipo A já foi escolhido, mas salvar é stub, e o CNPJ
do seed da clínica 1 é inválido (11 dígitos em clínica PJ), o que trava o
salvar de verdade.

## Solução

A rota `/clinica/dados` passa a ser a tela v2 de verdade, no design system,
com React Hook Form + Zod, gravando no perfil que já existe. O mestre edita;
os outros administradores só leem. A coluna "Como o paciente vê" muda enquanto
se digita. O rodapé mostra se há alteração e só habilita Descartar e Salvar
quando há mudança.

## Histórias de Usuário

1. Como mestre da clínica, quero ver identidade, contato, endereço e conta em
   cartões, para achar o que preciso mudar sem uma ficha longa.
2. Como mestre, quero escolher Empresa (CNPJ) ou Autônomo (CPF) em dois botões,
   para o documento certo ser pedido e validado.
3. Como mestre, quero máscara e validação de CPF, CNPJ, e-mail e CEP, para o
   salvar não voltar 422 por documento inválido.
4. Como mestre, quero ver ao lado como o paciente vê: topo do PDF (telefone da
   clínica; nome e e-mail do profissional), sugestão de mensagem com o link e
   o endereço do link, para não descobrir o efeito só depois de enviar.
5. Como mestre, quero que a prévia mude enquanto eu digito, para conferir
   nome, telefone e aviso de telefone faltando antes de salvar.
6. Como mestre, quero o endereço do link fixo (`{host}/{slug}/paciente/programas/…`),
   para não quebrar links já enviados.
7. Como mestre, quero um rodapé com "Alterações não salvas" ou "Tudo salvo" e
   os botões Descartar e Salvar desabilitados sem mudança, para não gravar à toa.
8. Como administrador que não é mestre, quero ver os mesmos dados só para
   leitura e um aviso de que só o mestre muda, para não achar que o salvar
   falhou.
9. Como mestre, quero a situação da clínica só para leitura (badge), porque na
   v2 ela não se edita mais nesta tela.
10. Como quem usa o seed local, quero o CNPJ da clínica 1 válido, para conseguir
    salvar os dados depois de abrir a tela.
11. Como usuário de outra clínica, não quero ver nem alterar o perfil desta
    clínica.
12. Como fisioterapeuta ou secretária, não quero entrar em `/clinica/dados`
    (a rota já exige administrador).

## Decisões de Implementação

- Dono: módulo Clinic. Endpoints já existem: `GET` e `PUT /api/clinic/profile`
  no guard `clinic`. `GET` exige administrador; `PUT` exige administrador
  mestre. Isolamento pelo `clinic_id` da sessão, não por id na URL.
- Front: reusa `ClinicProfile`, `useClinicProfile`, `useUpdateClinicProfile` e
  o repositório atuais. A página não importa `apiClient`. Schema Zod em
  `application/clinic`. Formulário com RHF + Zod, não `useState` do protótipo.
- Tela v2 só com `@/components/ds` (DsInput, DsFieldSelect, DsAlert, DsBadge,
  DsButton). Largura `mx-auto w-full max-w-(--breakpoint-ds-xl)`. Protótipo e
  `?variant=` saem.
- Situação: só leitura na v2. O `PUT` ainda exige e aceita `status`; o front
  reenvia o valor atual. Não mudar o backend sem perguntar — fica no
  `DEFERRED.md`.
- PDF do programa: nome e e-mail do profissional; só o telefone é da clínica
  (`ProgramPdfViewModelBuilder`). Sem telefone, aviso na prévia.
- Permissão de editar no front: `can.editClinicData` (mestre). Backend continua
  sendo a fonte de verdade.
- CNPJ do seed da clínica 1: trocar `85628325023` por um CNPJ numérico válido.
  O documento do usuário mestre (CPF) não entra neste corte.
- Testes: schema puro; página (mestre salva, não mestre só lê, validação,
  prévia ao vivo); backend de perfil já cobre outra clínica e papel sem
  permissão — rodar e só acrescentar se faltar.

## Fatias Verticais

1. Tela v2 de dados da clínica no lugar da v1, com schema, seed do CNPJ,
   testes e a prévia ao vivo. Uma fatia: quem abre `/clinica/dados` já usa a
   tela de verdade e consegue salvar.

## Testes

- Frontend: `npx vitest run resources/js/test/clinic-profile-form.test.ts` e
  `npx vitest run resources/js/test/ClinicDataPage.test.tsx`. Padrão:
  `PatientListPage.test.tsx` e `ExampleForm.test.tsx` (RHF + DS).
- Backend: `php artisan test --filter=ClinicProfileControllerTest` e a suíte
  `modules/Clinic/tests`. Já existem: outra clínica no GET e no PUT; não mestre
  e fisioterapeuta no PUT; não autenticado no GET.
- Comportamentos do front: mestre edita e salva; não mestre só lê; CPF/CNPJ,
  e-mail e CEP inválidos; prévia muda ao digitar; Descartar/Salvar
  desabilitados sem mudança.

## Fora do Escopo

- Parar de aceitar `status` no `UpdateClinicProfileRequest`.
- Corrigir o documento de 11 dígitos da Clínica Start no seed.
- Auto-cadastro (`/clinica/criar-conta`).
- O mestre mudar a situação da clínica nesta tela (era da v1; na v2 não volta).

## Notas

- Protótipo de referência (não copiar): pasta
  `resources/js/pages/clinic/clinic-data/clinic-data-prototype/` (commit
  `53bb847`).
- Login local do mestre da clínica 1: credencial do `DatabaseSeeder`.
- Não mestre para smoke: administrador extra do `ClinicUserSeeder`.
- Outra clínica: Clínica Start do mesmo seeder.
