# Dados da clínica no DS v2 substituem a v1

**Tipo:** História
**Plano:** `../plans/clinic-dados-ds.md`
**Issue:** ainda não criada

## Descrição

A `/clinica/dados` ainda mostra a ficha v1 (e o protótipo A só em
desenvolvimento, com salvar stub). Esta tarefa troca a v1 pela tela v2
"Cartão de visita ao vivo", com formulário de verdade (RHF + Zod), gravando
no `PUT /api/clinic/profile` que já existe, e corrige o CNPJ inválido do seed
da clínica 1.

## O que construir

- **Página:** `/clinica/dados` no DS v2, dentro do `ClinicLayout`, largura
  máxima de 1920px. Cartões Identidade, Contato, Endereço e Conta; coluna
  "Como o paciente vê"; rodapé fixo para o mestre.
- **Identidade:** nome; tipo Empresa (CNPJ) / Autônomo (CPF) em dois botões
  tipo rádio; documento com máscara e validação (CPF/CNPJ numérico alinhado ao
  backend).
- **Contato:** e-mail e telefone com máscara. Telefone opcional; aviso se
  faltar, porque o PDF do programa sai sem contato da clínica.
- **Endereço:** CEP com máscara, rua, número, cidade, UF em `DsFieldSelect`.
- **Conta:** situação em badge (só leitura), plano e código da clínica, só
  para ler.
- **Prévia:** topo do PDF (nome e e-mail do profissional, telefone da
  clínica); sugestão de mensagem com o link; endereço
  `{host}/{slug}/paciente/programas/…` fixo (o slug não muda).
- **Rodapé (só mestre):** "Alterações não salvas" / "Tudo salvo"; Descartar e
  Salvar desabilitados sem mudança.
- **Não mestre:** tudo só para ler e `DsAlert` "Só o usuário mestre da clínica
  muda estes dados." (`can.editClinicData`).
- **Seed:** CNPJ válido na clínica 1.
- **Remoção:** `ClinicDataForm` v1, pasta `clinic-data-prototype/` e o
  seletor `?variant=` nesta rota.
- **Backend:** não muda regra. O `PUT` continua exigindo `status`; o front
  reenvia o valor atual. Se faltar teste de outra clínica no perfil, acrescentar.

## Critérios de Aceite

- [x] Em produção e em dev, `/clinica/dados` mostra a tela v2. A v1 e o
      seletor `?variant=` não aparecem mais.
- [x] O mestre edita e salva pelo `PUT /api/clinic/profile` (teste da página).
- [x] Quem não é mestre vê o alerta de só leitura, campos sem edição e sem
      rodapé de salvar (teste).
- [x] CPF, CNPJ, e-mail e CEP inválidos mostram erro e não enviam (teste do
      schema e da página).
- [x] A prévia muda ao digitar nome e telefone; o endereço do link não muda
      com o nome (teste).
- [x] Descartar e Salvar começam desabilitados e só ligam com mudança (teste).
- [x] Situação da clínica aparece só para ler; o front reenvia o `status`
      atual porque o backend ainda exige o campo.
- [x] O seed da clínica 1 usa um CNPJ válido de 14 dígitos.
- [x] Um usuário de outra clínica não vê nem altera este perfil (teste de
      backend já existente ou acrescentado).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/clinic-dados-ds`.
- **Exemplo no código:** protótipo A (`VariantA`, `parts`, `shared`) como
  referência visual; `UpdateClinicProfileRequest` e
  `ClinicProfileControllerTest`; `PatientListPage.tsx` para a largura;
  `ExampleForm.tsx` para RHF + DS.
- **Skills:** `design-system`, `frontend-ddd`, `frontend-react`,
  `frontend-testing`, `php-testing`.
- Formulário com RHF + Zod; não copiar o `useState` do protótipo.
- CNPJ alfanumérico do DS não vai para a API: validar também com `isValidCnpj`
  de `@/lib/br-document-validation`.
- Página não importa `apiClient`. Loader/hooks em `application/`.
- `status` no `PUT`: registrar no `DEFERRED.md` se o backend deve parar de
  aceitar; não mudar sem perguntar.

## Como testar na mão

1. Entrar como mestre da clínica 1 (credencial do `DatabaseSeeder`). Abrir
   `/clinica/dados`.
2. Conferir CNPJ válido, cartões, prévia e rodapé "Tudo salvo".
3. Mudar o telefone: a prévia do PDF e a mensagem mudam; o link não. Salvar.
   Recarregar: o telefone permanece.
4. Descartar uma mudança volta ao salvo. Sem mudança, Descartar e Salvar
   desabilitados.
5. Entrar como administrador não mestre da mesma clínica: alerta de só
   leitura, sem salvar.
6. Entrar na Clínica Start: os dados são os dela, não os da clínica 1.
7. Desktop 1920 e 1440, celular 390px sem rolagem lateral, tema claro e
   escuro.
