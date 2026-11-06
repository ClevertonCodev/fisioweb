# Corte v2 da área do paciente

Data: 2026-11-05
Fonte: `decisoes.md` da feature (tabela D1–D7 e sessões de 2026-11-05) e o código atual das sete telas.

## Problema

O paciente abre a jornada e, em três rotas, ainda cai na tela antiga. A lista de programas mostra a versão v1; a variante C (hero e cards) só aparece com `?variant=C`. O detalhe do exercício abre a v1; a variante B (estúdio, vídeo quadrado) só aparece com `?variant=B`, junto com a barra de trocar variante. O programa concluído abre o fundo teal antigo; a variante A (gradiente da marca) só aparece com `?variant=A`, também com a barra. Login, detalhe do programa, executar sessão e feedback já são a variante escolhida, mas a navbar v1 e as pastas de protótipo continuam no código.

## Solução

As sete rotas passam a abrir a variante escolhida sem query e sem barra de troca. A lista é o hero com cards. O detalhe do exercício é o estúdio com vídeo quadrado. O programa concluído é a tela imersiva no gradiente da marca, sem navbar. A v1 dessas três telas, as pastas de protótipo e a navbar v1 saem. O badge “Protótipo” permanece nas telas que têm a navbar nova.

## Histórias de Usuário

1. Como paciente, quero abrir a lista de programas sem `?variant=` e ver o hero “Meus programas”, para usar a variante C no dia a dia.
2. Como paciente, quero ver no hero o rótulo “Área do paciente”, para reconhecer a área.
3. Como paciente, quero que, enquanto a lista carrega, o hero diga “Carregando sua lista…” e o miolo mostre “Carregando programas. Aguarde…”, para saber que a espera é da lista.
4. Como paciente, quero ver “1 programa ativo para você seguir em casa.” quando há exatamente um programa com status disponível ou disponível em breve, para saber o que posso fazer agora.
5. Como paciente, quero ver “N programas ativos para você seguir em casa.” quando há dois ou mais com status disponível ou disponível em breve, para ter a conta certa.
6. Como paciente, quero ver “Acompanhe aqui os programas prescritos pelo seu profissional.” depois que a lista carregou e não há nenhum disponível nem disponível em breve, mesmo que existam programas indisponíveis, concluídos ou inativos, para não contar como ativo o que não posso fazer.
7. Como paciente, quero tocar em atualizar e ver o ícone girar, com o botão desabilitado enquanto a nova busca não termina, para não disparar várias buscas.
8. Como paciente, quero ver “Nenhum programa disponível” e “Entre em contato com o profissional da saúde.” quando a lista vem vazia, para saber o que fazer.
9. Como paciente, quero ver o badge Disponível, Disponível em breve, Indisponível, Concluído ou Inativo, um por status, para ler a situação em português.
10. Como paciente, quero ver a contagem de exercícios do programa (a contagem pronta, ou a soma dos grupos quando ela não vier), no singular ou no plural, para saber o tamanho do programa.
11. Como paciente, quero ver o nome do profissional em cada card, para saber quem prescreveu.
12. Como paciente, quero ver o período em data brasileira, com “—” no lugar da data que faltar, para ler início e fim sem formato cru.
13. Como paciente, quero tocar num card e ir ao detalhe daquele programa, para começar por ele.
14. Como paciente, quero o card desabilitado quando não há slug de clínica para montar o caminho, para não navegar para um endereço vazio.
15. Como paciente, quero a navbar da lista sem título de tela, com a marca IVS Fisioterapia e Saúde e o badge Protótipo, para a lista continuar sendo a home da área.
16. Como paciente, quero que `?variant=` na lista não mude a tela, para um link antigo não me devolver a v1.
17. Como paciente, quero abrir o detalhe de um exercício sem `?variant=` e ver o estúdio da variante B, para não cair mais na v1.
18. Como paciente, quero o vídeo em quadrado 1:1, para ficar igual ao detalhe do programa e à execução.
19. Como paciente, quero o iframe com o nome do exercício e tela cheia quando há vídeo, para assistir à orientação.
20. Como paciente, quero ver “Vídeo indisponível” quando o exercício não tem vídeo, para não ficar numa área preta.
21. Como paciente, quero ler a descrição do exercício quando ela existir, para entender o movimento.
22. Como paciente, quero ver a dose só com os campos preenchidos (séries, repetições, carga, sustentar, descanso, esforço), para não ver linha vazia.
23. Como paciente, quero a faixa “mín–máx” quando o máximo existe e é diferente do mínimo, para ver o intervalo prescrito.
24. Como paciente, quero “série” no singular quando há uma série e não há máximo, para a frase ficar certa.
25. Como paciente, quero a seção “Quando fazer” com os dias e os períodos em chips, e quero que a seção suma quando não há dia nem período, para não ver um bloco vazio.
26. Como paciente, quero as orientações sem o prefixo “Descrição:”, para ler só o texto.
27. Como paciente, quero que o bloco de orientação não apareça quando não há nota, para a tela não inventar texto.
28. Como paciente, quero ver “Carregando exercício…” enquanto o programa carrega, para saber que a espera é deste exercício.
29. Como paciente, quero ver “Exercício não encontrado” quando o programa não carrega ou o identificador não vem, com um Voltar, para sair do erro.
30. Como paciente, quero ver “Exercício não encontrado no programa” quando o identificador não está em nenhum grupo, para saber que ele saiu do programa.
31. Como paciente, quero que Voltar, na navbar, no vazio e no botão Sair, retorne à tela anterior, para desfazer o passo.
32. Como paciente, quero tocar em “Iniciar exercícios” e ir à execução começando neste exercício, para seguir a jornada.
33. Como paciente, quero o rodapé Sair e Iniciar exercícios encostado na base da tela, no desenvolvimento e em produção, para não sobrar faixa vazia onde estava a barra de variantes.
34. Como paciente, quero a navbar do exercício com o nome do exercício, o nome da clínica, voltar e o badge Protótipo, para me localizar.
35. Como paciente, quero que `?variant=` no detalhe do exercício não mude a tela, para um link antigo não me devolver a v1.
36. Como paciente, quero abrir “programa concluído” sem `?variant=` e ver o gradiente da marca, o ícone, “Programa concluído” e “Você finalizou todas as sessões. Continue cuidando da sua saúde no dia a dia.”, para ver a variante A.
37. Como paciente, quero tocar em “Voltar aos programas” e ir à lista da clínica da URL, para recomeçar dali.
38. Como paciente, quero essa tela de conclusão sem navbar e sem badge, para ela continuar imersiva como a variante A.
39. Como paciente, quero que a tela de conclusão não chame a API, para ela seguir sendo só a confirmação visual.
40. Como paciente, quero que `?variant=` na conclusão não mude a tela, para um link antigo não me devolver o teal.
41. Como paciente, quero que login, detalhe do programa, executar sessão e feedback continuem exatamente como estão, para o corte não redesenhar o que já foi escolhido.
42. Como paciente, quero o badge Protótipo nas seis telas que têm a navbar nova, para a marca de migração só sair quando isso for pedido à parte.
43. Como paciente, quero a marca IVS Fisioterapia e Saúde, e não “Fisioweb”, em toda a jornada, para a área continuar com a marca da clínica.
44. Como paciente, quero não encontrar a navbar v1 em nenhuma tela, para a área ter uma navbar só.
45. Como paciente, quero continuar vendo só os meus programas, para o corte de tela não ampliar o que a API já me entrega.

## Decisões de Implementação

- **Dono e telas:** nenhum módulo de `modules/` muda. Mudam só três telas do SPA do paciente (lista de programas, detalhe do exercício, programa concluído) e a navbar v1, que sai. Login, detalhe do programa, executar sessão e feedback foram auditados e não são reescritos: já usam a navbar nova, o badge, o container de scroll da superfície e não importam componente v1 nem protótipo.
- **Sem migration e sem dado antigo.** Nada é convertido.
- **Sem endpoint novo ou alterado.** A lista segue o hook dos programas do paciente. O exercício segue o hook do programa e procura o exercício nos grupos pelo id da URL. A conclusão não busca nada. O envelope `data` não muda.
- **Permissões:** continua o paciente autenticado nas rotas que já exigem isso, e o visitante no login. Nenhuma Policy muda. O badge e o que a tela esconde não são autorização.
- **Isolamento:** o filtro por paciente permanece onde já está, no backend. Este corte não acrescenta filtro na tela nem aceita id de outro paciente vindo da URL além do token de programa que a API já valida.
- **Colaboração entre módulos:** nenhuma. Sem contrato, DTO ou evento novo.
- **Fila, integração e cache:** nenhum.
- **Arquitetura:** não há fronteira nova e não há ADR. As três telas deixam de escolher variante por query. O conteúdo da variante escolhida passa a ser a própria página. Pastas de protótipo, páginas v1 e a navbar v1 saem.
- **Lista:** hero e cards. “Ativo” para o texto do hero é só status disponível ou disponível em breve. Atualizar refaz a busca. O card abre o detalhe pelo token público, usando o slug da URL ou, na falta dele, o slug que o programa já traz. Sem slug, o card fica desabilitado. A navbar da lista não recebe título.
- **Exercício:** um único componente de página, com params e hooks nele. Vídeo quadrado. Dose, chips de dia e período, e nota sem o prefixo “Descrição:” permanecem como na variante B. Iniciar exercícios abre a execução já neste exercício. O rodapé reserva espaço para a barra de variantes só no desenvolvimento; essa folga sai, porque a barra sai. O rodapé encosta na base em qualquer ambiente.
- **Conclusão:** um único componente. Fundo é o gradiente da marca, não a superfície do corpo e não os tokens de status de sucesso. Sem navbar. O botão volta à lista da clínica. O helper da lista exige slug: a página só o chama quando a URL tem slug; se o parâmetro vier vazio, não dispara o erro do helper (hoje a tela cai na raiz).
- **Navbar v1:** sai o componente e o teste que só existe para ele. A navbar nova já tem teste próprio e permanece, com o badge.
- **Marca:** IVS Fisioterapia e Saúde.
- **O que a query antiga faz:** a página não lê `variant`. Qualquer `?variant=` mostra a mesma tela escolhida.

## Fatias Verticais

Em ordem. As fatias compartilham o teste de corte, então não rodam em paralelo.

1. **Lista C de verdade.** A lista oficial passa a ser o hero e os cards, com a mesma busca e a mesma ida ao detalhe. A página v1 da lista e a pasta de protótipo da lista saem. Nasce o teste de corte cobrindo a lista, as quatro telas já limpas e as duas rotas do paciente. Demonstra: abrir a lista sem query, com programas, vazia e carregando, e um link com `?variant=C` mostrar a mesma tela.
2. **Exercício B de verdade.** O detalhe oficial passa a ser o estúdio, num componente só. A v1, o arquivo separado da variante B e a barra saem. O rodapé encosta na base. O teste de corte passa a incluir essa página. Demonstra: abrir um exercício com vídeo, um sem vídeo, um id que não está no programa, e Iniciar exercícios caindo na execução deste exercício, sem query.
3. **Conclusão A de verdade.** A tela oficial passa a ser o gradiente imersivo, sem navbar. A pasta de protótipo da conclusão sai, inclusive o teal. O teste de corte passa a incluir essa página e confirma que não resta pasta de protótipo na área do paciente. Demonstra: abrir a URL de concluído sem query e voltar à lista.
4. **Navbar v1 sai.** Somem o componente e o teste dele, já sem uso depois da fatia 1. O teste de corte confirma que os dois arquivos não existem. Demonstra: a suíte não procura mais a navbar v1, e a navbar nova continua coberta pelo teste que já tem.

## Testes

- **Como rodam:** `npm run test -- --run` no teste de corte, `npm run types` e `bash bin/verificar.sh`. Não há teste PHPUnit novo: não muda módulo, Policy nem endpoint.
- **Padrão copiado:** o teste de corte do detalhe do programa da clínica, que lê o fonte das páginas e da rota e confere que a pasta do protótipo não existe. O teste da navbar nova permanece como está.
- **O que é testado:**
  - Nas sete páginas oficiais e nas duas rotas do paciente: o fonte não cita a barra de variantes, não cita caminho de protótipo, não cita `?variant=` e não cita a página v1 da lista nem a v1 do exercício.
  - As pastas de protótipo da lista e da conclusão não existem. Nenhuma outra pasta de protótipo sob as páginas do paciente existe.
  - Os arquivos da navbar v1 e do teste dela não existem.
  - Não há teste de outra clínica nem de papel sem permissão neste corte: a query, a Policy e o guard não mudam, e o paciente continua recebendo só o que a API já filtra. O caso de outra clínica no smoke é N/A, dito no resumo da evidência.
- **Smoke, na implementação:** as sete URLs da jornada, sem query, abrem a variante escolhida. A base vem do ambiente local, não de uma porta copiada.

## Fora do Escopo

- Tirar o badge Protótipo.
- Mudar rotas, API, backend, Policy, guard ou filtro por paciente.
- Reescrever login, detalhe do programa, executar sessão ou feedback.
- Apagar os três componentes de métrica, série e trilha da sessão que ninguém importa.
- Tema escuro além do que a variante escolhida já tem.
- Teste de ponta a ponta da jornada e internacionalização.
- Commit, a menos que seja pedido.

## Notas

- A tabela D5 ainda diz que a lista C é só preview. A sessão de 2026-11-05 substitui esse trecho: a lista C é a rota oficial.
- A tarefa antiga da conclusão deixava a navbar em aberto. A variante A fecha: sem navbar.
- As tarefas 001 a 004 desta pasta são o corte. O handoff anterior (v1 ainda na rota, protótipo ao lado, navbar da conclusão indecisa) foi substituído por elas.
- A auditoria das quatro telas já escolhidas bate com o `decisoes.md`. Nenhum ADR em `docs/adr/` fala da área do paciente nem impede este corte.
- Branch da feature: `feat/implementas-ds-telas-pacit`, a partir da `main`. O nome foi o que o usuário pediu.
