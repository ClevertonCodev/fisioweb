# ADR: Busca, filtros e paginação da lista de pacientes ficam na URL

## Contexto

Na lista de pacientes v1, a busca, os filtros e a página viviam em `useState`. Abrir um prontuário e voltar perdia tudo, o F5 também, e não dava para mandar a um colega o link de um recorte ("inativos em tratamento da Dra. X"). A lista v2 (feature `005-clinic-pacientes-ds`) tem cinco filtros, busca e itens por página, e o vaivém lista → prontuário → lista é o uso mais comum.

## Decisão

O estado da lista mora na query string. Ele é lido e escrito por funções puras da `application/clinic` (`parsePatientListFilters`, `serializePatientListFilters`, `toPatientListParams`, em `patient-list-filters.ts`), e o hook da página (`usePatientListUrlState`) só liga essas funções ao `useSearchParams`.

```
?q=maria                         busca (sem espaços nas pontas)
&situacao=ativos|inativos        ausente = ativos e inativos (padrão)
&status=alta,em_tratamento       só PatientStatus válidos, sem repetição
&prof=12,34                      ids inteiros positivos
&de=2026-01-01&ate=2026-03-31    AAAA-MM-DD que existe; "ate" só com "de" e ≥ "de"
&page=2                          inteiro ≥ 1; padrão 1
&per_page=30                     15 | 30 | 50; padrão 15
```

- Valor inválido cai no padrão e não vira chip. Valor igual ao padrão não vai para a URL.
- Mudar qualquer coisa que não seja a página volta para a página 1.
- A URL é escrita com `replace`: o "voltar" do navegador sai da lista, em vez de desfazer filtro por filtro.
- A busca vai para a URL depois de 400 ms sem digitar. O campo só é reescrito pela URL quando ela muda por fora (voltar, link) e traz um valor diferente do digitado, ignorando os espaços das pontas. Sem essa regra, o espaço digitado antes da pausa sumia, e "maria" + pausa + "silva" virava "mariasilva".
- Página além da última: o `DsPagination` pede a última sozinho, e a tela mostra o esqueleto enquanto isso, nunca "nenhum paciente cadastrado".
- Datas são convertidas entre ISO e `Date` na meia-noite local, sem passar por UTC, para não haver desvio de fuso.

## Consequências

- Benefícios:
  - Voltar do prontuário, dar F5 e abrir o link numa aba nova mostram o mesmo recorte.
  - A regra de normalização é testada sem renderizar nada.
- Custos:
  - Nomes de parâmetro em português (`situacao`, `de`, `ate`, `prof`) misturados com `page`/`per_page`. Mudar depois quebra links salvos.
  - O limite de 50 por página existe só na tela. O `GET /api/clinic/patients` ainda aceita qualquer `per_page`, porque a agenda pede 200 para o seletor de paciente. Está no `DEFERRED.md` da raiz.
- Regras que agentes devem preservar:
  - Toda leitura da URL passa pelas funções puras, e todo valor novo entra nelas com teste de valor inválido.
  - Não guardar estado da lista em `useState` paralelo à URL, a não ser o texto da busca enquanto o debounce corre.
  - Não renomear parâmetro sem aceitar o formato antigo também.

## Alternativas descartadas

- Só em memória (`useState`), como na v1 e no protótipo: perde tudo ao sair da tela.
- `localStorage`: lembra o último filtro, mas não dá para compartilhar o link, e um filtro esquecido ligado confunde quem volta dias depois.
- URL com `push`: cada filtro vira um passo no histórico, e o "voltar" passa a desfazer filtros em vez de sair da tela.
