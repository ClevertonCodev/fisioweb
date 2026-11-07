# Exercício B de verdade

**Tipo:** História
**Plano:** `../plans/patient-area-ds-restante.md`
**Histórias:** 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 41, 42, 43, 45
**Issue:** ainda não criada

## Descrição

O detalhe do exercício ainda abre a v1. O estúdio com vídeo quadrado (variante B) só aparece com `?variant=B`, junto com a barra de trocar variante. Esta tarefa torna essa variante a página oficial, num componente só, e tira a folga do rodapé que só existia para essa barra.

## O que construir

Na rota do detalhe do exercício, a tela passa a ser o estúdio: navbar com o nome do exercício, o nome da clínica, voltar e o badge Protótipo; vídeo quadrado 1:1; dose; “Quando fazer”; orientações. A marca é IVS Fisioterapia e Saúde. A página não lê `variant`.

Com vídeo, o iframe usa o nome do exercício e permite tela cheia. Sem vídeo, a área diz “Vídeo indisponível”. A descrição aparece só quando existe. A dose mostra só o que está preenchido (séries, repetições, carga, sustentar, descanso, esforço); se há máximo diferente do mínimo, mostra a faixa; “série” fica no singular quando há uma série e não há máximo. “Quando fazer” lista dias e períodos e some se não houver nenhum. A orientação tira o prefixo “Descrição:” e o bloco some se não houver nota.

Enquanto carrega, a tela diz “Carregando exercício…”. Se o programa não carrega ou o identificador não vem, “Exercício não encontrado”, com Voltar. Se o identificador não está em nenhum grupo, “Exercício não encontrado no programa”. Voltar, na navbar, no vazio e em Sair, retorna à tela anterior. “Iniciar exercícios” abre a execução começando neste exercício.

O rodapé Sair e Iniciar exercícios encosta na base da tela no desenvolvimento e em produção. Não há faixa vazia no lugar da barra de variantes.

Não há migration, endpoint, Policy, guard nem fila. O paciente continua vendo só o programa que a API já entrega. Login, detalhe do programa, execução, feedback e a lista não são redesenhados. A página não chama o cliente HTTP direto.

Saem a v1 e o arquivo separado da variante B. O teste de corte passa a incluir esta página.

## Critérios de Aceite

- [x] A URL do exercício, sem query, abre o estúdio com vídeo quadrado, não a v1.
- [x] `?variant=` não muda a tela.
- [x] Com vídeo, o iframe tem o nome do exercício e tela cheia. Sem vídeo, aparece “Vídeo indisponível”.
- [x] A dose, a faixa, o singular “série”, “Quando fazer” e a orientação seguem as regras desta tarefa, inclusive quando o bloco não deve aparecer.
- [x] Carregando, programa ausente e exercício fora dos grupos mostram os textos desta tarefa, com Voltar.
- [x] Sair e Voltar retornam à tela anterior. “Iniciar exercícios” abre a execução deste exercício.
- [x] O rodapé encosta na base no desenvolvimento e em produção.
- [x] A navbar tem o nome do exercício, o nome da clínica, voltar, a marca IVS e o badge Protótipo.
- [x] A v1 e o arquivo separado da variante B não existem. O teste de corte inclui esta página e passa.
- [x] Login, detalhe do programa, execução e feedback não entram no diff desta tarefa.
- [x] Caso de outra clínica: N/A. Não muda API, Policy nem guard; registrar isso no `SUMMARY.md`.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `001-lista-c-de-verdade` (Lista C de verdade), porque o teste de corte nasce nela.

## Notas de Implementação

- **Branch:** `feat/patient-area-ds-restante`
- **Exemplo no código:** o corpo atual da variante B do detalhe do exercício; o teste de corte criado na tarefa 001.
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`, `qa-navegador`

## Como testar na mão

Paciente autenticado, na clínica do ambiente local. Abra um programa e entre num exercício. A base e o slug vêm desse ambiente.

1. A URL do exercício, sem query, mostra o estúdio e o vídeo quadrado.
2. Acrescente `?variant=O`. A tela não volta para a v1.
3. Num exercício sem vídeo, leia “Vídeo indisponível”.
4. Confira dose, dias e orientação de um exercício que tenha esses dados.
5. Toque em Sair e volte. Entre de novo e toque em “Iniciar exercícios”: a execução abre neste exercício.
6. Olhe o rodapé no ambiente de desenvolvimento: ele encosta na base, sem faixa vazia.
