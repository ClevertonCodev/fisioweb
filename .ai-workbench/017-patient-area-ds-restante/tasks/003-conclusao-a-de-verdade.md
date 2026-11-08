# Conclusão A de verdade

**Tipo:** História
**Plano:** `../plans/patient-area-ds-restante.md`
**Histórias:** 36, 37, 38, 39, 40, 41, 43, 45
**Issue:** ainda não criada

## Descrição

A tela de programa concluído ainda abre o fundo teal antigo. O gradiente da marca (variante A) só aparece com `?variant=A`, com a barra de trocar variante. Esta tarefa torna essa variante a página oficial: imersiva, sem navbar e sem a pasta de protótipo.

## O que construir

Na rota de programa concluído, a tela é o gradiente da marca, com o ícone, o título “Programa concluído” e o texto “Você finalizou todas as sessões. Continue cuidando da sua saúde no dia a dia.” Não há navbar e não há badge. A página não lê `variant` e não chama a API.

“Voltar aos programas” leva à lista da clínica que está na URL. O helper da lista exige slug: a página só o chama quando a URL tem slug. Se o parâmetro vier vazio, a tela não dispara o erro do helper.

Não há migration, endpoint, Policy, guard nem fila. Login, detalhe do programa, execução, feedback, lista e detalhe do exercício não são redesenhados.

Sai a pasta de protótipo da conclusão, inclusive o teal. O teste de corte passa a incluir esta página e confirma que não resta pasta de protótipo na área do paciente.

## Critérios de Aceite

- [x] A URL de concluído, sem query, mostra o gradiente, o ícone, “Programa concluído” e o texto de continuar cuidando da saúde.
- [x] Não há navbar nem badge nesta tela, e o fundo não é o teal antigo.
- [x] `?variant=` não muda a tela.
- [x] “Voltar aos programas” abre a lista da clínica da URL.
- [x] A tela não dispara busca de programa.
- [x] A pasta de protótipo da conclusão não existe, nem outra pasta de protótipo na área do paciente. O teste de corte inclui esta página e passa.
- [x] Login, detalhe do programa, execução e feedback não entram no diff desta tarefa.
- [x] Caso de outra clínica: N/A. Não muda API, Policy nem guard; registrar isso no `SUMMARY.md`.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `002-exercicio-b-de-verdade` (Exercício B de verdade), porque as fatias escrevem no mesmo teste de corte, em ordem.

## Notas de Implementação

- **Branch:** `feat/patient-area-ds-restante`
- **Exemplo no código:** a variante A da tela de conclusão; o teste de corte das tarefas 001 e 002.
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`, `qa-navegador`

## Como testar na mão

Paciente autenticado, na clínica do ambiente local. Abra `/{slug}/paciente/programas/{token}/executar/concluido` sem query. A base, o slug e o token vêm desse ambiente.

1. A tela é o gradiente, sem navbar e sem o fundo teal.
2. Acrescente `?variant=original`. A tela não muda.
3. Toque em “Voltar aos programas” e caia na lista dessa clínica.
