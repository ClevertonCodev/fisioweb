# Secretária só lê o prontuário

**Tipo:** História
**Plano:** `../plans/isolamento-clinicas-e-papeis.md`
**Issue:** ainda não criada

## Descrição

A secretária pode ler evoluções, avaliações e arquivos do paciente, e isso continua. Mas a leitura hoje não passa por Policy nenhuma: o `EvolutionController::show` nem chama `authorize`. E a proteção da escrita depende de cada endpoint lembrar de chamar `authorize`. As Policies de evolução e avaliação já exigem fisio para criar, editar e assinar; a de arquivos precisa ser conferida.

A abordagem faz toda leitura e escrita do prontuário passar pela Policy. A leitura fica liberada para os três papéis, e a escrita só para admin e fisio. No SPA, as ações de escrita somem para a secretária.

## O que construir

- Backend (ClinicalRecord, guard `clinic`):
  - listar e mostrar evoluções, avaliações e arquivos chamam `authorize` de `viewAny` e `view`, que continuam liberados para os três papéis;
  - criar, editar, assinar, gerar texto, apagar evolução e avaliação, anexar e remover arquivo chamam `authorize` da habilidade certa;
  - a `PatientFilePolicy` passa a exigir admin ou fisio para anexar e remover;
  - secretária recebe 403 em toda escrita.
- SPA (`pages/clinic/patient`, `components/clinic/patient`): na ficha do paciente e nos drawers de evolução, avaliação e arquivo, os botões de criar, editar, assinar, gerar texto, anexar e apagar só aparecem quando `can.manageClinicalRecords` (já existe em `permissions.ts`) é verdadeiro. A leitura continua igual.
- Sem migration.

## Critérios de Aceite

- [ ] Secretária recebe 200 ao listar e abrir evolução, avaliação e arquivo de paciente da própria clínica.
- [ ] Secretária recebe 403 ao criar, editar, assinar, gerar texto e apagar evolução; criar, editar, assinar e apagar avaliação; anexar e remover arquivo.
- [ ] Fisio e admin continuam fazendo tudo o que fazem hoje.
- [ ] Teste de UI (Vitest): com papel `secretary`, a ficha e os drawers não mostram as ações de escrita, mas mostram o conteúdo. Com `physiotherapist`, mostram as ações.
- [ ] Testes de Policy atualizados para a `PatientFilePolicy`.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis`
- **Exemplo no código:**
  - `modules/ClinicalRecord/app/Policies/PatientEvolutionPolicy.php` (regra de escrita já certa);
  - `modules/ClinicalRecord/tests/Unit/Policies/PatientFilePolicyTest.php`;
  - `resources/js/application/clinic/permissions.ts`.
- **Skills:** `security`, `frontend-ui-patterns`, `frontend-testing`, `php-testing`
- Frontend esconde para UX; quem protege é o backend.

## Como testar na mão

1. Entre como secretária da clínica A e abra a ficha de um paciente com evoluções, avaliações e arquivos.
2. O conteúdo aparece, mas não aparecem os botões "Nova evolução", "Editar", "Assinar", "Gerar texto", "Anexar" nem "Excluir".
3. Pela API, como secretária, `POST /api/clinic/patients/{id}/evolutions` → 403.
4. Entre como fisio e repita → os botões aparecem e as ações funcionam.
