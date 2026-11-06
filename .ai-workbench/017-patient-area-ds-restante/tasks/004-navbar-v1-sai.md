# Navbar v1 sai

**Tipo:** Tarefa
**Plano:** `../plans/patient-area-ds-restante.md`
**Histórias:** 41, 44, 45
**Issue:** ainda não criada

## Descrição

Depois que a lista deixa de usar a navbar v1, o componente só existe para o teste dele. A área do paciente já usa a navbar nova, que tem teste próprio. Esta tarefa apaga a navbar v1 e o teste que só a cobre, e o teste de corte passa a garantir que os dois arquivos não existem.

## O que construir

A navbar v1 e o teste que a renderiza saem do projeto. Nenhuma tela passa a importá-la. A navbar nova permanece, com o badge Protótipo nas seis telas que já a usam, e o teste dela continua passando.

O teste de corte ganha a conferência de que o componente e o teste antigo não existem. Login, detalhe do programa, execução, feedback, lista, exercício e conclusão não são redesenhados.

Não há migration, endpoint, Policy, guard nem fila. O que o paciente vê nos dados não muda.

## Critérios de Aceite

- [x] Nenhuma tela mostra a navbar v1.
- [x] O componente da navbar v1 e o teste dele não existem.
- [x] O teste da navbar nova passa.
- [x] O teste de corte confirma a ausência dos dois arquivos e continua passando para as sete páginas e as duas rotas.
- [x] Login, detalhe do programa, execução e feedback não entram no diff desta tarefa.
- [x] Caso de outra clínica: N/A. Não muda API, Policy nem guard; registrar isso no `SUMMARY.md`.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `003-conclusao-a-de-verdade` (Conclusão A de verdade), para o teste de corte fechar por último. O último uso em tela já sai na tarefa 001.

## Notas de Implementação

- **Branch:** `feat/patient-area-ds-restante`
- **Exemplo no código:** o teste da navbar nova em `resources/js/test/ds/DsPatientNavbar.test.tsx`; o teste de corte da tarefa 003.
- **Skills:** `frontend-testing`, `design-system`

## Como testar na mão

Paciente autenticado, na clínica do ambiente local.

1. Abra a lista, um programa, um exercício, a execução e o feedback. A navbar é a nova, com a marca IVS e o badge Protótipo.
2. Abra a conclusão. Ela continua sem navbar.
3. Rode o teste de corte e o teste da navbar nova.
