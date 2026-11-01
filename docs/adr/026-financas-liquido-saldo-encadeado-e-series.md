# ADR: Finanças: líquido, saldo encadeado e séries

## Contexto

Finanças (`/clinica/financas`) é do módulo `ClinicFinance` (ADR 006). Na feature
013 a tela passou para o DS v2 e ganhou parcelamento, recorrência, paciente e
comprovante. Como estava antes da 013:

- **Os totais somavam o bruto.** O `summary` e todos os `reports/*` somavam
  `gross_amount`. A taxa da maquininha (`fee_amount`) não saía do disponível, e o
  caixa mostrado era maior que o dinheiro que entrou de fato.
- **O saldo inicial era R$ 0 sem valor digitado.** Cada mês só tinha saldo se
  alguém digitasse; o mês seguinte não partia do fim do anterior.
- **Não havia série.** Para lançar um aluguel ou uma venda parcelada, a pessoa
  lançava cada mês na mão.
- **Lançamento não tinha paciente nem comprovante.** Os arquivos do prontuário
  (`PatientFile`) guardam `cdn_url`, um link público de CDN, e esse padrão não
  serve para comprovante de pagamento.

## Decisão

1. **O líquido é a base de todos os totais.** Disponível, previsão, calendário,
   "a receber"/"a pagar", `summary`, `reports/*` e `category-breakdown` somam
   `net_amount` (bruto menos taxa, calculado no servidor). A taxa aparece só no
   lançamento, e a exportação continua com bruto, taxa e líquido por linha. Na
   tela, a taxa pode ser digitada em %; a tela converte para reais (arredondado em
   centavos) e a API continua recebendo `fee_amount` em reais.
2. **O saldo inicial é encadeado.** O saldo de um mês é o valor digitado nele,
   quando há. Sem valor digitado, o servidor parte do último mês anterior com
   valor digitado (ou de R$ 0, se não há nenhum) e soma o líquido realizado
   (recebido menos pago) até o fim do mês anterior ao pedido, numa consulta
   agregada, sem laço de meses. O `summary` diz a origem em
   `opening_balance_source` (`typed` | `computed`), e `DELETE opening-balance`
   volta o mês ao calculado.
3. **Parcela e recorrência são séries.** A tabela `clinic_financial_series`
   guarda a regra (`kind` = `installments` | `recurrence`, `frequency`,
   `anchor_date`, `anchor_day`, `ends_on`, `installments_total`,
   `next_occurrence_on`, `generated_until`) e os dados-modelo do lançamento
   (tipo, categoria, forma de pagamento, descrição, valores, observação,
   paciente, autor). Cada lançamento da série tem `series_id` e `series_index`,
   com índice único no par, o que torna a geração idempotente.
   - `anchor_date` é a data da posição 1 pela regra, de onde todas as datas são
     contadas; `anchor_day` é o dia do mês da regra no mensal e no anual (31 no
     "todo dia 31"), que pode não ser o dia da `anchor_date` quando a série nasce
     de uma divisão em 28/02 (nulo = o dia da `anchor_date`).
   - `next_occurrence_on` é a data, pela regra, da próxima posição ainda não
     criada (nula quando ela passaria do `ends_on`). É por ela que o comando diário
     escolhe as séries: só as com `next_occurrence_on` antes do horizonte e até o
     `ends_on` (ou sem fim), por um índice (`kind`, `next_occurrence_on`), e cada
     uma é travada antes de gerar. Ela é atualizada a cada geração, divisão e
     encerramento.
   - `generated_until` só informa a data da última ocorrência criada; nenhuma
     regra de geração ou parada lê esse campo.
   - **Parcelamento:** de 2 a 48, uma por mês a partir da data; valor e taxa
     divididos com o centavo que sobra na 1ª; descrição "Descrição (n/N)"; a 1ª
     com o status escolhido e as outras pendentes. "Esta e as próximas" leva o que
     mudou às próximas **pendentes**; data e status ficam.
   - **Recorrência:** semanal, mensal ou anual, sem fim ou até uma data. As datas
     contam sempre da 1ª (mensal no dia 31 cai no último dia dos meses curtos e
     volta ao 31; anual em 29/02 cai em 28/02). As ocorrências ficam criadas até
     12 meses à frente de hoje, e o comando diário
     `clinic-finance:generate-recurrences` (03:00) cria as próximas. A geração
     continua depois da maior posição já criada, contando as da lixeira, que não
     voltam.
4. **"Este e os próximos" na recorrência corta a série, como no Google Agenda.**
   - **Editar** a ocorrência na posição *k*: a série antiga termina na ocorrência
     anterior (`ends_on` = data da posição *k − 1* pela regra; a véspera da 1ª
     quando *k* = 1; um fim que já vinha antes fica). Nasce uma série nova com os
     dados novos e a mesma frequência da antiga. A ocorrência editada vira a 1ª
     da nova, com a data enviada.
     - **O dia da regra:** a data enviada é comparada com a data **gravada** da
       ocorrência e com a data que a regra dá à posição *k*. Se ela é igual a
       uma das duas (a pessoa não mudou o dia nesta edição, mesmo que a
       ocorrência já estivesse fora da regra por um "só este" ou por uma divisão
       anterior, ou voltou à data da regra), a nova segue a regra antiga:
       `anchor_date` = a data da regra na posição *k* (é o que mantém o dia da
       semana no semanal) e `anchor_day` = o dia da regra antiga. Se é outra
       data, a pessoa mudou o dia de propósito: `anchor_date` = a data enviada e
       `anchor_day` = o dia dela. Ex.: mensal do dia 10 com março movido para
       20/03 por "só este"; mudar só o valor de março com "este e os próximos"
       deixa março em 20/03 e segue em 10/04, 10/05...
     - **O fim:** o mesmo da antiga, mas nunca antes da 1ª da nova; a data
       levada para depois do fim estica o fim até ela (`ends_on` = o maior entre
       o fim antigo, a data enviada e a `anchor_date` nova), e a nova não gera
       mais nada. Sem fim na antiga, a nova também não tem.
     - **A ordem das travas:** a série primeiro, depois as ocorrências, como na
       exclusão; a baixa (`changeStatus`) trava a linha do lançamento e responde
       404 se ele já foi para a lixeira.
     - As próximas **pendentes** da antiga vão para a lixeira e são geradas de
       novo na nova, com os dados novos.
     - As próximas já **pagas ou recebidas**, e as que já estavam na lixeira,
       passam para a nova na mesma posição contada da editada (a *k + 3* da
       antiga vira a 4ª da nova), sem mudar valor, data nem status. Assim a nova
       não cria um segundo aluguel num mês já pago, nem traz de volta uma
       ocorrência que a pessoa tinha excluído.
     - As anteriores ficam na série antiga, como estão.
   - **Excluir** com "este e os próximos": a série termina na ocorrência anterior
     (mesma regra do `ends_on`), e esta e as próximas pendentes vão para a
     lixeira. As pagas/recebidas ficam. O comando não gera mais nada nela, porque
     o encerramento recalcula o `next_occurrence_on`, que fica nulo (a próxima
     posição passaria do `ends_on`).
   - "Só este" muda ou exclui só aquela ocorrência e não mexe na série.
   - A repetição não muda na edição: não dá para transformar um avulso em série,
     nem mudar o número de parcelas ou a frequência.
5. **Paciente e atendimento por contrato, só com ids.** O lançamento de entrada
   guarda só `patient_id` e `appointment_id` (sem FK entre módulos). Posse, nome e
   busca vêm dos contratos públicos de `Patient` (`PatientServiceInterface`,
   `PatientDirectoryReadServiceInterface`) e de `ClinicScheduling`
   (`AppointmentReadServiceInterface`), sem importar Model de outro módulo.
   Paciente ou atendimento de outra clínica, ou atendimento de outro paciente,
   responde 422.
6. **Comprovante no bucket público, com a API sem URL pública e o CDN bloqueando a pasta.**
   Decisão do usuário na revisão adversária de 2026-11-01: o comprovante fica no
   **mesmo bucket R2 que o CDN serve** (o dos vídeos e do prontuário); não há
   bucket privado. O que protege, em camadas:
   - **Caminho não adivinhável.** `FileServiceInterface::uploadFileAs` grava em
     `clinics/{clínica}/finances/transactions/{lançamento}/{uuid}.{ext}`. A
     extensão sai do tipo validado pelo **conteúdo** do arquivo (jpg, png, webp,
     heic, heif ou pdf), nunca do nome que o navegador mandou, e o `ContentType`
     vai explícito no `put` (sem ele o Flysystem deduz pela extensão). Um `x.html`
     que começa com `%PDF` é gravado como `.pdf`, `application/pdf`.
   - **A API não devolve URL pública, e o caminho só aparece dentro do link
     assinado.** A tabela `clinic_financial_attachments` não guarda `cdn_url`, e o
     `path` fica escondido no JSON: nenhuma resposta o traz como campo. O único
     lugar em que ele aparece é a URL do link assinado de 5 minutos (é assim que o
     S3 do R2 assina). O caminho completo não vai para o log: gravar
     (`uploadFileAs`), assinar o link e remover (`deletePrivateFile`, inclusive a
     limpeza de um upload que não foi gravado) registram só a pasta, e a exceção
     do `deletePrivateFile` não leva a mensagem do Flysystem, que traz o caminho.
     O `deleteFile` comum continua registrando o caminho e não é usado no
     comprovante.
   - **Abrir é só por link assinado de 5 minutos** (`createPresignedDownloadUrl`),
     direto no endpoint S3 do R2 (não no CDN), gerado por uma rota autenticada de
     Finanças depois de conferir a clínica e que o lançamento não está na lixeira.
     O link força `ResponseContentType` = o `mime_type` gravado, e o
     `Content-Disposition` é `inline` só para imagem comum ou PDF (o resto baixa).
     O nome do download troca a extensão que o navegador mandou pela do tipo
     gravado (`EXTENSION_BY_MIME`): um `x.html` com conteúdo de PDF baixa como
     `x.pdf`, e um `recibo` sem extensão, como `recibo.pdf`.
   - **O CDN bloqueia a pasta de Finanças por uma regra de WAF no Cloudflare.**
     O link assinado mostra o caminho; sem a regra, quem viu o link abriria o
     arquivo pelo CDN para sempre.

     > **PRÉ-REQUISITO DE DEPLOY, PENDENTE.** Em 2026-11-01 a regra ainda **não
     > foi criada** no Cloudflare, e nenhuma das conferências com `curl` abaixo
     > foi feita. Até ela existir e as conferências darem 403, o comprovante
     > **não pode ir para produção**: quem viu um link assinado abriria o arquivo
     > pelo CDN, sem login. Criar a regra e rodar a lista faz parte do deploy (e da
     > descrição da PR), e quem fizer atualiza esta nota com a data.

     A regra (Security → WAF → Custom rules, ação **Block**) olha o path
     **decodificado** e não depende da barra. A normalização de URL do Cloudflare
     não decodifica caracteres reservados (`%2F` continua `%2F`), e a normalização
     padrão (RFC-3986) não junta `//`; uma regra que procura `"/finances/"` no path
     cru deixa passar `finances%2F...` ou `clinics%2F1/...`, e o R2 pode decodificar
     o `%2F` na chave. Por isso a regra decodifica de forma recursiva (`"r"`: pega
     também `%252F`) e procura só as palavras, sem barra:

     ```
     (http.host in {"<host do CLOUDFLARE_CDN_URL>"}
       and lower(url_decode(http.request.uri.path, "r")) contains "clinics"
       and lower(url_decode(http.request.uri.path, "r")) contains "finances")
     ```

     As duas palavras juntas não aparecem em nenhuma outra pasta do bucket
     (`patients/`, `clinic-users/`, `images/`, `videos/`, `thumbnails/`) nem nos
     nomes gerados (uuid), então a regra não bloqueia vídeo, foto nem prontuário.
     Todo domínio próprio ligado ao bucket entra no `http.host in {...}`. O
     domínio `r2.dev` do bucket (Public Development URL) **precisa estar
     desligado**: ele não passa pelo WAF da zona, e a regra não o cobre. Em Rules →
     Settings → URL Normalization: tipo de normalização **Cloudflare** (não o
     RFC-3986 padrão, para juntar `//` e trocar `\` por `/`) e **Normalize incoming
     URLs** ligado. A regra é configuração do Cloudflare, não código: o teste do
     PHP não a enxerga.

     Conferência depois de criar (e a cada mudança de domínio do CDN ou da regra),
     com `--path-as-is` para o `curl` não arrumar o caminho antes de mandar. Todas
     esperam **403** (o WAF responde antes do bucket, então o arquivo nem precisa
     existir; 404 quer dizer que a regra não pegou):

     ```bash
     CDN="$CLOUDFLARE_CDN_URL"
     for p in \
       "/clinics/1/finances/transactions/1/x.pdf" \
       "/clinics/1/finances%2Ftransactions/1/x.pdf" \
       "/clinics%2F1/finances/transactions/1/x.pdf" \
       "/clinics%252F1%252Ffinances/transactions/1/x.pdf" \
       "//clinics/1/finances/transactions/1/x.pdf" \
       "/clinics/1/%66inances/transactions/1/x.pdf" \
       "/CLINICS/1/FINANCES/transactions/1/x.pdf"; do
       printf '%s %s\n' "$(curl --path-as-is -s -o /dev/null -w '%{http_code}' "$CDN$p")" "$p"   # 403 em todas
     done
     # r2.dev desligado: não pode responder 200 (sem resposta ou 401/404).
     curl --path-as-is -s -o /dev/null -w '%{http_code}\n' "https://pub-<id>.r2.dev/clinics/1/finances/transactions/1/x.pdf"
     # E a regra não pega o resto do bucket: um vídeo ou foto conhecido continua 200.
     ```

   Até 5 por lançamento, JPG, PNG, WEBP, HEIC ou PDF, até 10 MB. O upload ao R2
   acontece antes de abrir a transação do banco (a rede não segura o
   `lockForUpdate` do lançamento); posse e limite são conferidos antes de subir e
   de novo dentro da transação, e o que subiu sai do R2 se a gravação falhar
   (inclusive quando o lançamento foi para a lixeira durante o upload: 404).
7. **Os paths REST continuam os mesmos (ADR 006); a semântica dos valores muda.**
   `/api/clinic/finances/*` mantém as rotas, e as novas entram ao lado
   (`calendar`, `transactions/{id}/status`, `attachments`, `patients/...`). Quem
   lê `summary` ou `reports/*` passa a receber valores líquidos.

## Consequências

- Benefícios:
  - O disponível bate com o dinheiro que entrou no banco.
  - Um mês sem saldo digitado parte do fim do anterior, sem a clínica digitar todo mês.
  - Aluguel e parcelado se lançam uma vez, e o "a pagar" e a previsão enxergam o futuro.
  - Mudar o valor do aluguel dali para frente não estraga o histórico nem os meses já pagos.
- Custos:
  - O disponível dos meses já lançados cai o valor das taxas; o saldo de todo mês sem valor digitado muda (antes, R$ 0). A clínica vai notar.
  - Cada "este e os próximos" numa recorrência cria uma série nova e põe as pendentes antigas na lixeira; restaurar uma delas cria um lançamento a mais naquele mês.
  - O comando diário precisa do scheduler rodando.
  - O sigilo do comprovante depende de configuração fora do código: a regra de WAF no domínio do CDN (com o path decodificado), a normalização de URL tipo Cloudflare ligada e o `r2.dev` do bucket desligado. **A regra é pré-requisito de deploy e, em 2026-11-01, ainda não foi criada nem conferida** (decisão 6). Se a regra não existir, sumir, se o CDN trocar de domínio sem a regra acompanhar, ou se alguém ligar o `r2.dev`, quem viu um link assinado abre o arquivo pelo CDN sem login, e nenhum teste do PHP avisa. A conferência com `curl` (decisão 6) é manual. Bucket privado separado continua sendo a solução definitiva, se um dia quiserem.
  - O arquivo de um comprovante excluído pode ficar no cache do CDN, mas o WAF bloqueia o caminho antes do cache.
- Regras que agentes devem preservar:
  - Todo total soma `net_amount`; nunca `gross_amount`.
  - Nunca mudar ocorrência paga ou recebida em "este e os próximos", nem trazer de volta uma da lixeira na geração.
  - Toda leitura e escrita de série, lançamento, comprovante e saldo filtra por `clinic_id`; série ou lançamento de outra clínica responde 404. A geração grava com o `clinic_id` e o autor da série.
  - Dado de outro módulo só por contrato público, guardando só o id.
  - A API nunca devolve URL pública nem o `path` do comprovante como campo; o caminho só aparece dentro do link assinado de 5 minutos. O caminho completo não vai para o log: o comprovante sai do R2 pelo `deletePrivateFile`, nunca pelo `deleteFile`, que registra o caminho.
  - O comprovante grava pelo `uploadFileAs`, com nome uuid, extensão derivada do tipo validado pelo conteúdo e `ContentType` explícito; nunca pela extensão do nome que o navegador mandou. O link assinado manda o `mime_type` gravado, só abre `inline` imagem comum ou PDF, e o nome do download leva a extensão do tipo gravado.
  - Todo comprovante fica sob `clinics/{clínica}/finances/`: são as palavras que a regra de WAF procura no path decodificado. Mudar a pasta exige mudar a regra junto, e nenhuma outra pasta do bucket pode ter `clinics` e `finances` no caminho.
  - Não ir para produção com comprovante sem a regra de WAF criada e a lista de `curl` da decisão 6 dando 403 em todas as linhas.
  - Upload ao R2 fora da transação do banco, com posse, lançamento fora da lixeira e limite conferidos de novo dentro dela.
  - Testes de feature: `FinanceSummaryNetAmountTest`, `FinanceReportsNetAmountTest`, `FinanceOpeningBalanceChainTest`, `FinanceInstallmentsTest`, `FinanceRecurrenceTest`, `FinanceRecurrenceFollowingTest`, `FinanceTransactionPatientTest`, `FinanceAttachmentTest` e `FinanceClinicIsolationTest`.

## Alternativas descartadas

- **Somar o bruto e mostrar a taxa à parte:** o disponível continuaria maior que o dinheiro real.
- **Saldo de cada mês só digitado:** obriga a clínica a digitar todo mês, e o mês esquecido mostra R$ 0.
- **"Este e os próximos" na recorrência mudando as pendentes no lugar, sem dividir a série (como nas parcelas):** a regra da série continuaria com os dados velhos, e o comando geraria os meses novos com o valor antigo.
- **Gerar recorrência sem limite ou só no dia:** sem limite enche a tabela; só no dia esconde o "a pagar" e a previsão.
- **Comprovante com `cdn_url`, como o prontuário:** qualquer pessoa com o link abriria o comprovante, sem login e mesmo depois de excluído.
- **Só o link assinado, sem a regra de WAF:** o link assinado mostra o caminho, e caminho + domínio do CDN abriria o arquivo para sempre, sem assinatura.
- **Bucket R2 privado separado para comprovante (sem domínio público), agora:** é a proteção que não depende de configuração do Cloudflare, mas pede bucket, credencial e disco novos em todos os ambientes. O usuário preferiu, por ora, o mesmo bucket com a regra de WAF; fica como a solução definitiva.

## Relacionados

- [ADR 006](006-clinic-finance-extraction.md): `ClinicFinance` é o dono, e os paths REST não mudam.
- Feature `.ai-workbench/013-clinic-financas-ds/` (decisões e plano).
