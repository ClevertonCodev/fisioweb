# Lista C de verdade

**Tipo:** História
**Plano:** `../plans/patient-area-ds-restante.md`
**Histórias:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 41, 42, 43, 45
**Issue:** ainda não criada

## Descrição

A lista de programas do paciente ainda abre a tela v1. O hero com cards (variante C) só aparece com `?variant=C`. Esta tarefa torna essa variante a lista oficial, sem query e sem a v1, e cria o teste de corte com a lista, as quatro telas que já estão prontas e as duas rotas do paciente.

A navbar v1 deixa de ser usada nesta tela. Apagar o componente fica na tarefa 004: até lá, o teste dela ainda importa o arquivo.

## O que construir

Na rota da lista de programas do paciente, a tela passa a ser o hero “Meus programas”, com o rótulo “Área do paciente”, os cards e a navbar nova sem título de tela. A marca é IVS Fisioterapia e Saúde e o badge Protótipo continua. A página não lê `variant`: com ou sem `?variant=`, a tela é a mesma.

Enquanto carrega, o hero diz “Carregando sua lista…” e o miolo diz “Carregando programas. Aguarde…”. Depois de carregar, o hero conta como ativo só o programa disponível ou disponível em breve: “1 programa ativo…” ou “N programas ativos…”. Se não houver nenhum desses, mesmo com indisponível, concluído ou inativo, o texto é “Acompanhe aqui os programas prescritos pelo seu profissional.” Atualizar refaz a busca, o ícone gira e o botão fica desabilitado até terminar. Lista vazia mostra “Nenhum programa disponível” e “Entre em contato com o profissional da saúde.”

Cada card mostra o badge do status (Disponível, Disponível em breve, Indisponível, Concluído, Inativo), a contagem de exercícios no singular ou no plural, o profissional e o período em data brasileira, com “—” se a data faltar. O toque abre o detalhe daquele programa. Sem slug para montar o caminho, o card fica desabilitado.

Não há migration, endpoint, Policy, guard nem fila. O paciente continua vendo só o que a API já devolve. Login, detalhe do programa, execução e feedback não são reescritos. A página não chama o cliente HTTP direto.

Saem a lista v1 e a pasta de protótipo da lista. Nasce o teste de corte, no padrão do corte de tela da clínica: ele lê o fonte da lista, das quatro telas já limpas e das duas rotas, e exige que não haja barra de variantes, caminho de protótipo, `?variant=` nem as páginas v1 da lista e do exercício.

## Critérios de Aceite

- [x] `/{slug}/paciente/programas` abre o hero “Meus programas” e “Área do paciente”, sem `?variant=`.
- [x] Um endereço com `?variant=` mostra a mesma lista.
- [x] Carregando, um ativo, vários ativos, nenhum ativo e lista vazia mostram os textos desta tarefa.
- [x] Atualizar gira o ícone e não aceita outro toque até a busca acabar.
- [x] Cada status tem o badge em português; o card mostra exercícios, profissional e período, e abre o detalhe.
- [x] Card sem slug para o caminho fica desabilitado.
- [x] A navbar da lista não tem título de tela, mostra IVS Fisioterapia e Saúde e o badge Protótipo.
- [x] A lista v1 e a pasta de protótipo da lista não existem.
- [x] O teste de corte passa para a lista, as quatro telas já limpas e as duas rotas.
- [x] Login, detalhe do programa, execução e feedback não entram no diff desta tarefa.
- [x] Caso de outra clínica: N/A. Não muda API, Policy nem guard; registrar isso no `SUMMARY.md`.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/patient-area-ds-restante`
- **Exemplo no código:** a variante C e o `shared` da lista de programas do paciente; o teste `resources/js/test/program-detail-v2-cut.test.ts`.
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`, `qa-navegador`

## Como testar na mão

Paciente autenticado, na clínica do ambiente local. A base e o slug vêm desse ambiente, não de uma porta copiada.

1. Abra `/{slug}/paciente/programas` sem query. Deve aparecer o hero, não a lista v1.
2. Abra a mesma URL com `?variant=C` e com `?variant=A`. A tela não muda.
3. Confira um card (status, exercícios, profissional, período) e o toque até o detalhe.
4. Toque em atualizar e veja o ícone girar.
5. Se a clínica de teste não tiver programa, confira o vazio. O carregamento aparece na primeira abertura.
