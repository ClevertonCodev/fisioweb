# Finanças no DS v2

Data: 2026-10-31
Fonte: `decisoes.md` da feature (sessão 2026-10-30), `.ai-workbench/HANDOFF.md` (parte 2), protótipo C (`resources/js/pages/clinic/finances/finance-prototype/`) e a conversa de 2026-10-31, que confirmou as camadas, a ordem (protótipo primeiro, extras depois) e os testes.

## Problema

A clínica controla o caixa numa tela v1 (tabela com filtros) que não segue o design system v2. O protótipo C, o "calendário de caixa", foi escolhido, mas tudo nele é de mentira: lançar, editar, excluir, dar baixa, restaurar, mexer em categoria e salvar o saldo inicial mostram um toast "Protótipo: não foi salvo". Além disso:

- o disponível e os relatórios somam o valor **bruto**, e o dinheiro que de fato entrou é o **líquido** (depois da taxa da maquininha);
- o calendário busca no máximo 100 lançamentos e erra num mês cheio;
- uma pendência atrasada some quando a pessoa muda de mês;
- o saldo inicial é R$ 0 todo mês em que ninguém digita um valor;
- só o administrador entra, e quem cuida do caixa no dia a dia costuma ser a secretária;
- não há como lançar uma conta que se repete, uma venda parcelada, o paciente que pagou nem o comprovante.

## Solução

`/clinica/financas` vira a tela v2 do protótipo C, de verdade, com três abas:

- **Lançamentos:** o mês em calendário, com o que entrou e saiu em cada dia (líquido, calculado no servidor), a lista do dia escolhido, "a receber" e "a pagar" (o mês na tela mais todos os atrasados) com baixa em um clique e "Desfazer", e uma busca em todo o histórico com filtro por tipo. O resumo do mês mostra o disponível e o saldo inicial, que vem sozinho do mês anterior ou é digitado.
- **Novo lançamento** (entrada ou saída): valor, categorias mais usadas em chips, forma de pagamento, taxa da maquininha em R$ ou %, com o líquido calculado, status, data, descrição e observação. Também a repetição (não repete, parcelado ou recorrente semanal/mensal/anual), o paciente e o atendimento (só na entrada) e até 5 comprovantes. Editar e excluir uma parcela ou ocorrência pergunta "só este" ou "este e os próximos".
- **Relatório:** dia a dia, últimos 12 meses, por categoria (com a % dentro de entradas ou de saídas) e tabela, tudo no líquido.
- **Configurações:** categorias (criar, ligar/desligar, excluir), saldo inicial do mês e lixeira com restaurar. A secretária vê só a lixeira. O cartão de repasses sai.

Administrador e secretária usam Finanças; o fisioterapeuta não entra. A v1 sai inteira.

## Histórias de Usuário

**Acesso**

1. Como administrador da clínica, quero continuar usando tudo em Finanças, para controlar o caixa como hoje.
2. Como secretária, quero ver Finanças no menu e lançar, editar, excluir, dar baixa, buscar, exportar, ver o relatório e restaurar da lixeira, para cuidar do caixa do dia a dia sem depender do administrador.
3. Como secretária, não quero ver criar, ligar/desligar ou excluir categoria, nem editar o saldo inicial, porque essas decisões são do administrador.
4. Como administrador, quero que a secretária receba 403 da API ao tentar mexer em categoria ou no saldo inicial, mesmo chamando a rota direto, para a regra valer de verdade.
5. Como fisioterapeuta, não quero ver Finanças no menu, e a API me responde 403 em qualquer rota de Finanças, para os valores da clínica não chegarem a mim.
6. Como administrador, quero que nenhuma pessoa de outra clínica veja, altere, baixe, restaure ou exporte um lançamento, uma categoria, um saldo ou um comprovante da minha clínica.

**Resumo do mês e saldo inicial**

7. Como administrador, quero ver no resumo do mês o disponível em destaque, o que entrou, o que saiu, o que falta receber e pagar e a previsão, todos no líquido, para saber o dinheiro que de fato tenho.
8. Como administrador, quero que o saldo inicial de um mês venha sozinho do disponível do fim do mês anterior, para não digitar todo mês.
9. Como administrador, quero digitar o saldo inicial de um mês para acertar com o banco, e que os meses seguintes partam desse valor.
10. Como administrador, quero ver se o saldo inicial foi "calculado do mês anterior" ou "digitado" e poder voltar ao calculado, para não esquecer um acerto antigo.
11. Como secretária, quero ver o saldo inicial no resumo sem o botão de editar.
12. Como administrador, quero esconder os valores da tela (o olho) quando alguém está do lado.

**Calendário de caixa**

13. Como administrador, quero ver o mês em calendário, com o que entrou e o que saiu em cada dia, para enxergar o movimento do mês de uma vez.
14. Como administrador, quero que o calendário esteja certo num mês com centenas de lançamentos.
15. Como administrador, quero tocar num dia e ver os lançamentos dele ao lado (embaixo, no celular), para conferir o dia.
16. Como administrador, quero ir para o mês anterior ou o seguinte, e voltar para hoje.
17. Como administrador, quero ver "a receber" e "a pagar" com as pendências do mês na tela e todas as atrasadas de meses anteriores, marcadas como "Atrasado", para nada vencido ficar escondido.
18. Como administrador, quero ver o total de "a receber" e de "a pagar".

**Lançar, editar e excluir**

19. Como administrador, quero tocar em "Nova entrada" ou "Nova saída" e abrir o modal já no tipo certo.
20. Como administrador, quero escolher a categoria pelos chips das mais usadas ou numa lista com busca com as outras.
21. Como administrador, quero informar a forma de pagamento em chips.
22. Como administrador, quero informar a taxa da maquininha em R$ ou em % (no cartão de crédito e de débito) e ver o líquido calculado, para não fazer conta por fora.
23. Como administrador, quero escolher o status (recebido/pago ou pendente), a data, a descrição e a observação.
24. Como administrador, quero mensagens claras quando faltar valor, descrição ou categoria, ou quando a taxa passar do valor.
25. Como administrador, quero tocar num lançamento (no dia, nas pendências ou na busca) e editá-lo.
26. Como administrador, quero excluir um lançamento e ver que ele foi para a lixeira.
27. Como administrador, quero que o calendário, as pendências, o resumo e o relatório se atualizem sozinhos depois de lançar, editar, excluir ou dar baixa.

**Dar baixa**

28. Como secretária, quero marcar uma pendência como recebida ou paga com um clique, sem mudar a data nem a forma de pagamento.
29. Como secretária, quero um "Desfazer" no aviso da baixa, para corrigir um clique errado.

**Busca**

30. Como administrador, quero buscar um lançamento por texto (descrição, categoria ou nome do paciente) em todo o histórico, do mais novo para o mais antigo, com a data de cada um, para responder "quando foi que paguei aquilo?".
31. Como administrador, quero filtrar a busca por entrada ou saída.
32. Como administrador, quero que a busca não diferencie maiúscula de minúscula ("aluguel" acha "Aluguel").
33. Como administrador, quero ver mais resultados quando a busca tem muitos, e limpar a busca para voltar ao dia.

**Configurações**

34. Como administrador, quero ver as categorias de entrada e de saída, as do sistema e as da clínica, com quantas estão ligadas.
35. Como administrador, quero criar uma categoria da clínica.
36. Como administrador, quero ligar e desligar qualquer categoria, para ela sair do modal sem perder o histórico.
37. Como administrador, quero excluir uma categoria da clínica que não tem lançamentos, e, se tiver, ver a mensagem "desative em vez de excluir".
38. Como administrador, quero definir o saldo inicial do mês nas Configurações.
39. Como administrador ou secretária, quero ver a lixeira e restaurar um lançamento.
40. Como administrador, quero que `/clinica/financas/categorias` e `/clinica/financas/lixeira` abram as Configurações já na seção certa, para os links antigos continuarem funcionando.

**Relatório**

41. Como administrador, quero ver o relatório do mês dia a dia, os últimos 12 meses, a divisão por categoria e uma tabela, tudo no líquido.
42. Como administrador, quero ver a % de cada categoria dentro das entradas ou dentro das saídas.
43. Como pessoa daltônica, quero distinguir entradas (azul) e saídas (vermelho) nos gráficos, nos dois temas.

**Exportar**

44. Como administrador ou secretária, quero exportar os lançamentos do período em Excel, PDF ou CSV, com bruto, taxa, líquido e o paciente quando houver.

**Paciente e atendimento**

45. Como secretária, quero escolher o paciente num lançamento de entrada e, se quiser, um atendimento dele na agenda, para saber quem pagou e o quê.
46. Como secretária, quero ver o nome do paciente no lançamento e achar o lançamento buscando pelo nome dele.
47. Como administrador, quero que um paciente ou um atendimento de outra clínica, ou um atendimento de outro paciente, seja recusado (422).
48. Como fisioterapeuta, quero que o prontuário do paciente continue sem nenhum valor financeiro.

**Comprovante**

49. Como secretária, quero anexar até 5 comprovantes (foto ou PDF, até 10 MB cada) a um lançamento, inclusive tirando a foto pelo celular.
50. Como secretária, quero abrir e remover um comprovante anexado.
51. Como administrador, quero que um comprovante só abra para quem está logado na minha clínica, nunca por um link público.
52. Como administrador, quero mensagem clara quando o arquivo for de outro tipo, grande demais, ou já houver 5.
53. Como administrador, quero que o comprovante vá junto para a lixeira com o lançamento e volte ao restaurar.

**Parcelamento**

54. Como administrador, quero lançar um valor total em N parcelas (de 2 a 48), uma por mês a partir da data escolhida, para enxergar o que ainda vou receber ou pagar.
55. Como administrador, quero que o centavo que sobrar da divisão vá para a 1ª parcela, e a taxa seja dividida do mesmo jeito, para o total bater.
56. Como administrador, quero ver cada parcela como "Descrição (2/3)".
57. Como administrador, quero que a 1ª parcela fique com o status escolhido e as outras nasçam pendentes.
58. Como administrador, quero editar ou excluir "só esta" parcela ou "esta e as próximas", e que só as pendentes mudem.

**Recorrência**

59. Como administrador, quero lançar uma conta que se repete toda semana, todo mês ou todo ano, sem fim ou até uma data, para não lançar o aluguel todo mês.
60. Como administrador, quero que as ocorrências apareçam até 12 meses à frente, em "a pagar" e na previsão.
61. Como administrador, quero que, no mensal, o dia 31 caia no último dia dos meses mais curtos e que, no anual, 29/02 caia em 28/02 nos anos não bissextos.
62. Como administrador, quero que as próximas ocorrências continuem aparecendo conforme o tempo passa, sem ninguém fazer nada.
63. Como administrador, quero editar "só este" ou "este e os próximos", e que "este e os próximos" mude a regra dali para frente sem mexer nas anteriores nem nas já pagas.
64. Como administrador, quero excluir "este e os próximos" para encerrar a repetição.

**v1**

65. Como administrador, quero que a tela antiga e o seletor de variantes sumam, para existir uma Finanças só.

## Decisões de Implementação

### Dono e telas

- O backend é todo do módulo `ClinicFinance` (ADR 006). Nenhuma regra financeira nova entra em `Clinic`. As rotas continuam em `/api/clinic/finances/*`: as novas entram ao lado, e as que mudam só mudam a semântica dos valores.
- Telas: `/clinica/financas` (abas por `?aba=lancamentos|relatorio|configuracoes`), com `/clinica/financas/categorias` e `/clinica/financas/lixeira` abrindo Configurações na seção. O protótipo vira o código de verdade em `pages/clinic/finances/`; as cascas das três rotas apontam para ele, sem `?variant=`.
- Saem: as páginas v1 de Finanças, `components/clinic/finances/*` e o ligamento ao `PrototypeSwitcher` nessas rotas. Hooks de `application/` e repositórios de `infrastructure/` que já servem ficam e ganham o que faltar.
- Contêiner em `max-w-(--breakpoint-ds-xl)`; componentes de `@/components/ds`. Cores dos gráficos: entradas `--ds-chart-c1`, saídas `--ds-chart-negative`.

### Dados (migrations novas em `ClinicFinance`)

- **Série** (`clinic_financial_series`): `clinic_id`, `kind` (`installments` | `recurrence`), `frequency` (`weekly` | `monthly` | `yearly`, só recorrência), `anchor_date` (a data da 1ª), `ends_on` (nulo = sem fim), `installments_total` (só parcelamento), `generated_until` (até onde a recorrência já foi gerada) e os dados-modelo do lançamento (tipo, valor bruto, taxa, categoria, forma de pagamento, descrição, observação, paciente). Os dados-modelo servem para gerar as próximas ocorrências.
- **Lançamento** (`clinic_financial_transactions`) ganha `series_id` (nulo), `series_index` (1, 2, 3...), `patient_id` (nulo) e `appointment_id` (nulo), com índice único em (`series_id`, `series_index`), o que dá a idempotência do job, e índices em (`clinic_id`, `patient_id`) e (`clinic_id`, `status`, `date`).
- **Comprovante** (`clinic_financial_attachments`): `clinic_id`, `financial_transaction_id`, `path` no R2, nome original, tipo e tamanho e `uploaded_by`. Sem `cdn_url`.
- Dado antigo: nada a converter. Os lançamentos que existem ficam avulsos, sem série nem paciente, e os saldos digitados continuam valendo como "digitado".
- Tabela grande: `clinic_financial_transactions` ganha colunas nulas e índices; sem reescrever linhas.

### Valores

- Tudo soma `net_amount`: `summary` (disponível, recebido, pago, pendentes, previsão), `reports/*`, `category-breakdown` e o calendário. A exportação continua com bruto, taxa e líquido por linha.
- **Disponível** = saldo inicial + líquido recebido − líquido pago no mês. **Previsão** = disponível + líquido pendente a receber − líquido pendente a pagar no mês.
- **Saldo inicial encadeado:** o saldo de um mês é o valor digitado nele, quando há. Sem valor digitado, o servidor acha o último mês anterior com valor digitado e soma a ele o líquido realizado (recebido − pago) do início desse mês até o fim do mês anterior ao pedido. Sem nenhum valor digitado antes, soma todo o realizado antes do mês. É uma consulta agregada, não um laço de meses. O `summary` passa a dizer a origem: `opening_balance_source` = `typed` | `computed`.
- Taxa em %: só na tela. Ela calcula os reais arredondados em centavos e manda `fee_amount` em reais, como hoje.
- **Divisão das parcelas:** valor ÷ N truncado em centavos para cada parcela, e o resto vai para a 1ª. O mesmo vale para a taxa. O líquido de cada parcela é calculado no servidor como hoje (`computeNetAmount`).
- **Calendário:** soma por dia todos os lançamentos do dia (pendentes também), entradas e saídas separadas, como no protótipo.

### Contratos de API (guard `clinic`, envelope `data`)

Novas:

- `GET /clinic/finances/calendar?period=YYYY-MM` → `data: { period, days: [{ date, income, expense }] }`, só os dias com lançamento, valores líquidos.
- `PATCH /clinic/finances/transactions/{id}/status` com `{ status }` → o lançamento atualizado. Valida o status contra o tipo (`isValidFor`) e muda só o status. O "Desfazer" chama a mesma rota com `pendente`.
- `DELETE /clinic/finances/opening-balance?period=YYYY-MM` → apaga o valor digitado do mês e volta ao calculado. Só o administrador.
- `GET /clinic/finances/transactions/{id}/attachments` → lista. `POST` (multipart, `files[]`) → os criados. `GET .../attachments/{attachmentId}/url` → `{ url, expires_at }`, um link assinado de poucos minutos, depois de conferir a clínica. `DELETE .../attachments/{attachmentId}` → remove.
- `GET /clinic/finances/patients/{patientId}/appointments` → os atendimentos do paciente para o seletor (data/hora e título), lidos pelo contrato de `ClinicScheduling`.

Alteradas:

- `GET /clinic/finances/transactions`:
  - `q` sem `period`/`from`/`to` busca em todo o histórico, ordenado por data desc. Com `q`, o `period` atual não é imposto.
  - Novo filtro `overdue_until=YYYY-MM-DD`: devolve as pendências com data até o fim do mês na tela. Com `status=pendente`, isso é a lista "a receber/a pagar".
  - A busca usa `LOWER(coluna) LIKE` com o termo em `mb_strtolower` e também acha pelo nome do paciente (ids vindos do contrato de `Patient`).
  - Cada item ganha `patient: { id, name } | null`, `appointment: { id, starts_at } | null`, `series: { id, kind, index, total | null } | null` e `attachments_count`.
- `POST /clinic/finances/transactions`:
  - aceita `patient_id` e `appointment_id`, ambos opcionais e só em entrada;
  - aceita `repeat`, com uma destas formas:
    - `{ kind: 'none' }`;
    - `{ kind: 'installments', total: 2..48 }`;
    - `{ kind: 'recurrence', frequency, ends_on | null }`.
  - Devolve o 1º lançamento criado e quantos foram criados.
- `PUT` e `DELETE /clinic/finances/transactions/{id}` aceitam `scope=only|following`, que só tem efeito em lançamento de série:
  - nas **parcelas**, `following` aplica a esta e às próximas pendentes;
  - na **recorrência**, `following` divide a série: a antiga termina na ocorrência anterior, e uma nova nasce a partir desta com os dados novos. As futuras pendentes da série antiga vão para a lixeira e são geradas de novo na série nova; as já pagas e recebidas ficam.
  - `DELETE` com `following` na recorrência encerra a série (`ends_on`) e manda as futuras pendentes para a lixeira.
  - A repetição não muda na edição: não dá para transformar um avulso em série nem mudar o número de parcelas.
- `GET /clinic/finances/summary` → valores líquidos, mais `opening_balance_source`.
- `GET /clinic/finances/reports/*` → líquido. `category-breakdown` devolve a % dentro do tipo.
- Categorias mais usadas no modal: `category-breakdown` do mês na tela, que já devolve `count` por categoria e tipo.

### Permissões

| Ação | Administrador | Secretária | Fisioterapeuta |
|---|---|---|---|
| Ver, lançar, editar, excluir, dar baixa, buscar, exportar, relatório, lixeira e restaurar | sim | sim | 403 |
| Comprovante (listar, enviar, abrir, remover) | sim | sim | 403 |
| Ler categorias | sim | sim | 403 |
| Criar, ligar/desligar e excluir categoria | sim | 403 | 403 |
| Salvar ou apagar o saldo inicial digitado | sim | 403 | 403 |

- Um middleware novo do `ClinicFinance` ("administrador ou secretária") substitui o `clinic.admin` no grupo de Finanças. As rotas de escrita de categoria e de saldo continuam com o `clinic.admin`.
- As Policies (`FinancialTransactionPolicy`, `FinancialCategoryPolicy` e uma de saldo) passam a usar a mesma regra de papel, e a posse por clínica continua nelas. Os controllers chamam a Policy em toda ação.
- Frontend: `can.manageFinances` (administrador ou secretária) e `can.manageFinanceSettings` (administrador) em `permissions.ts`. O menu (`ClinicSidebar`, `ClinicTopbar`) e as rotas usam `manageFinances` no lugar de `RequireClinicAdmin`/`can.manageUsers`. A tela esconde o que a Policy proíbe.

### Isolamento

- Toda consulta e escrita de lançamento, série, comprovante e saldo filtra por `clinic_id` do usuário autenticado, no Repository. `find` de lançamento, série ou comprovante de outra clínica responde 404.
- Paciente e atendimento são validados no FormRequest ou no Service. O paciente precisa ser da clínica (`PatientServiceInterface::findForClinic`); o atendimento precisa ser da clínica e do paciente escolhido (o `AppointmentSnapshotDTO` traz `clinicId` e `patientId`). Senão, 422.
- O comprovante só abre pelo link assinado gerado depois de conferir a clínica e que o lançamento não está na lixeira. O caminho no R2 começa pela clínica.
- O job de recorrência trabalha série por série e grava com o `clinic_id` da série.

### Colaboração entre módulos

- `Patient`: usa o `PatientServiceInterface::findForClinic`, que já existe, para validar. Ganha uma leitura pública para nomes por ids e ids por termo de busca, limitada à clínica, que devolve DTO e não Model.
- `ClinicScheduling`: o `AppointmentReadServiceInterface` (público) ganha "atendimentos de um paciente na clínica" (snapshots). O `getSnapshotById` serve para validar.
- `Cloudflare`: usa o `FileServiceInterface` para enviar e apagar. Ganha um método de link de download assinado (já existe o de upload assinado).
- `ClinicFinance` guarda só ids de outros módulos, sem FK entre módulos e sem importar Model de outro módulo.
- Eventos: os que já existem (`FinancialTransactionRecorded`/`Updated`/`Deleted`) continuam disparando por lançamento, inclusive nos gerados por série e pelo job.

### Fila e agendamento

- Um comando agendado diário do `ClinicFinance` (registrado no service provider, como o `GoogleCalendar` faz) gera, para cada série de recorrência ativa, as ocorrências até 12 meses à frente de hoje, sem passar do `ends_on`, e avança o `generated_until`. A idempotência vem do índice único (`series_id`, `series_index`), e rodar duas vezes não duplica.
- O upload do comprovante é síncrono na requisição, como os arquivos do prontuário.

### ADR

- Prever o ADR 026, "Finanças: líquido, saldo encadeado e séries". Ele registra:
  - o líquido como base de todos os totais;
  - o saldo inicial encadeado;
  - o modelo de série para parcela e recorrência, com o corte em "este e os próximos";
  - os ids de paciente e atendimento lidos por contrato;
  - o comprovante sem URL pública.
- Também registra que os paths REST de Finanças continuam os mesmos (ADR 006) e que a semântica dos valores muda.

## Fatias Verticais

Primeiro o protótipo de verdade (1 a 9), depois os extras (10 a 13). Cada fatia atravessa banco, API, tela e testes e pode ser demonstrada sozinha.

1. **Acesso e resumo no líquido.** Middleware "administrador ou secretária", Policies e `permissions.ts`, com o menu e as rotas para administrador e secretária. A casca v2 real em `pages/clinic/finances/` (abas, seletor de mês, olho, resumo do mês) passa a ser o padrão das três rotas, sem `?variant=`. O `summary` vira líquido. Ações ainda não feitas continuam com o stub do protótipo até a fatia delas.
2. **Saldo inicial encadeado.** Cálculo encadeado no `summary`, com `opening_balance_source`. O `DELETE opening-balance` volta ao calculado. O modal real de saldo inicial (`PUT`) é só do administrador, com a indicação "calculado/digitado" no resumo.
3. **Calendário de caixa.** `GET calendar`, a lista do dia pela listagem (`from = to = dia`, paginada) e "a receber/a pagar" com os atrasados (`status=pendente` + `overdue_until`). Sai o `useMonthTransactions`.
4. **Lançar, editar e excluir.** Modal real: `POST`/`PUT`/`DELETE`, taxa em R$/%, categorias mais usadas do servidor, erros de validação no campo e invalidação de calendário, pendências, resumo e relatório.
5. **Dar baixa com desfazer.** `PATCH status` e o botão nas pendências com toast "Desfazer".
6. **Busca no histórico.** `q` em todo o histórico, filtro por tipo, `LOWER LIKE`, resultado no lugar da lista do dia, com mais resultados e o botão de limpar.
7. **Configurações.** Categorias reais (criar, ligar/desligar, excluir com a mensagem do 409), saldo inicial, lixeira com restaurar e o cartão de repasses fora. A secretária vê só a lixeira. As rotas `/categorias` e `/lixeira` rolam até a seção.
8. **Relatório no líquido.** `reports/*` no líquido, `category-breakdown` com a % por tipo e a tela sem recalcular.
9. **Sai a v1.** Apaga as páginas v1, `components/clinic/finances/*`, o `?variant=` e o que só a v1 usava. Atualiza `docs/prototipos-v2.md` (Finanças feita).
10. **Paciente e atendimento.** Contratos de leitura em `Patient` e `ClinicScheduling`, colunas no lançamento, validação, nome no item, busca pelo paciente, seletor de paciente e de atendimento no modal (só entrada) e a coluna "Paciente" na exportação.
11. **Comprovantes.** Tabela, upload e remoção, link assinado (método novo no `FileServiceInterface`), limites de tipo, tamanho e quantidade e a área de anexos no modal (com câmera no celular). O comprovante fica inacessível na lixeira e volta ao restaurar.
12. **Parcelamento.** Tabela de séries, "Repetir: parcelado" no modal, divisão com centavos, "Descrição (n/N)", status da 1ª e `scope=only|following` no `PUT`/`DELETE`, com a pergunta "Só esta / Esta e as próximas".
13. **Recorrência.** "Repetir: recorrente" (semanal/mensal/anual, sem fim ou até uma data), geração até 12 meses, fim de mês e 29/02, comando diário agendado e idempotente, e "este e os próximos" dividindo a série. Fecha com o ADR 026.

## Testes

- **Como rodar:** `php artisan test --filter=...`, `vendor/bin/phpunit modules/ClinicFinance/tests`, `npm run test` e `bash bin/verificar.sh` no fim de cada fatia.
- **Padrões a copiar:**
  - `FinanceClinicIsolationTest` (duas clínicas, 404/422);
  - `FinancialTransactionControllerTest` e `FinancialReportControllerTest` (`actingAs($user, 'clinic')`, factories, `RefreshDatabase`, envelope `data`);
  - `PatientFileControllerTest` (`FileServiceInterface` substituído por mock);
  - `travelTo` para datas;
  - no frontend, os testes de página v2 da 012 (`program-builder.test.tsx`), com `vi.mock` do repositório e `userEvent`.
- **Básico em toda fatia:**
  - cada rota responde;
  - outra clínica dá 404 (ou 422 no id dentro do payload);
  - secretária com 403 só em categoria e saldo;
  - fisioterapeuta com 403 em tudo.
- **Contas de dinheiro:**
  - `summary` e relatórios somam o líquido (lançamento com taxa);
  - previsão com pendentes;
  - % por tipo no `category-breakdown`;
  - parcelas com centavo (R$ 100 em 3x = 33,34 + 33,33 + 33,33) e taxa dividida;
  - taxa em % convertida na tela;
  - saldo encadeado: sem valor digitado, com valor num mês do meio, apagando o digitado, e o mês sem lançamento.
- **Datas da recorrência:**
  - mensal no dia 31 (fevereiro, abril);
  - anual em 29/02;
  - semanal;
  - `ends_on` respeitado;
  - geração até 12 meses;
  - comando rodado duas vezes sem duplicar, e rodado depois de `travelTo` gerando as próximas;
  - "este e os próximos" na edição (divide a série, mantém as pagas) e na exclusão (encerra).
- **Comprovante:**
  - tipo recusado, mais de 10 MB e o 6º arquivo, todos com 422;
  - link só para a própria clínica (outra clínica 404);
  - lançamento na lixeira com comprovante inacessível e de volta ao restaurar;
  - o caminho no R2 começa pela clínica;
  - nenhuma resposta traz URL pública.
- **Telas (Vitest):**
  - modal: tipo, repetição, taxa R$/% e líquido, erros de validação, paciente só na entrada, pergunta "só este / este e os próximos";
  - baixa com desfazer;
  - busca com filtro de tipo e limpar;
  - calendário com os totais do servidor e o dia escolhido;
  - pendências com atrasados de outro mês;
  - a secretária não vê categorias, saldo editável nem repasses, e o fisioterapeuta não vê o menu;
  - `/categorias` e `/lixeira` abrem a seção.
- **Smoke no navegador headless** (skill `qa-navegador`), desktop e celular, com evidência por tarefa e o caso de outra clínica. No fim, apagar os dados criados.

## Fora do Escopo

- Repasses aos profissionais (cálculo e a vitrine "plano avançado").
- Preço no tipo de atendimento e entrada gerada pela agenda.
- Pagamentos na tela do paciente ou no prontuário.
- Filtros da busca por status, categoria e forma de pagamento.
- Taxa padrão por forma de pagamento nas Configurações.
- Transformar um lançamento avulso em série, ou mudar o número de parcelas, depois de criado.
- Excluir de vez da lixeira (esvaziar) e prazo de retenção, inclusive dos arquivos no R2.
- Lembrete de cobrança (WhatsApp, e-mail) para pendências.
- Busca sem diferenciar maiúscula nos outros repositórios (DEFERRED da raiz).
- Conferir se o CDN dos arquivos do prontuário é público (DEFERRED da raiz).

## Notas

- **Decididas no plano, sem pergunta ao usuário** (confirmar se quiser diferente):
  - o calendário soma os pendentes do dia junto, como o protótipo;
  - a repetição não muda na edição;
  - "este e os próximos" na recorrência divide a série;
  - o comprovante abre por link assinado de poucos minutos, e não por streaming;
  - as categorias mais usadas vêm do mês na tela.
- **Riscos:**
  - a mudança para o líquido baixa o disponível de meses já lançados, porque a taxa sai;
  - o saldo encadeado muda o saldo de todo mês sem valor digitado (antes, R$ 0).
  - Os dois são o comportamento pedido, mas a clínica vai notar.
- **Falhas que já existiam antes da feature e continuam:** 3 em `tests/Architecture` e `ExerciseLibraryPage.test.tsx` "grade D" (DEFERRED da 012).
- A 013 é feita na mesma branch da 012 (`feat/clinic-programa-assistente-ds`).
