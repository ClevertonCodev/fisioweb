# Feature Specification: Clinic Finances

**Feature Branch**: `004-clinic-finances`

**Created**: 2026-06-20

**Status**: Draft

**Input**: User description: Página de gestão financeira da clínica, com listagem de transações (entradas e saídas), filtros, busca, ocultação de valores, exportação, configurações financeiras e painel de relatórios com cards de resumo e gráficos (linha, pizza, barras). Inspirada em ferramentas SaaS modernas como a do screenshot fornecido, mas usando componentes e cores do design system do fisioweb.

## Clarifications

### Session 2026-06-20

- Q: Escopo das categorias financeiras (seed global, per-clinic, híbrido, adiar)? → A: Híbrido — seed global padrão + cada clínica pode criar/desativar suas próprias categorias.
- Q: Conjunto de métodos de pagamento suportados? → A: Padrão BR fechado — Dinheiro, Pix, Cartão de débito, Cartão de crédito, Transferência, Boleto, Outro.
- Q: Como tratar a taxa de cartão (automática por % configurado vs. manual)? → A: A taxa é um **input opcional preenchido manualmente** pela pessoa que registra a transação, em qualquer método de pagamento (não há cálculo automático nesta versão).
- Q: Exclusão de transação — hard delete, soft com retenção, soft permanente ou cancelamento? → A: **Soft delete permanente — nunca purga**; mantém lixeira indefinida com tela de gestão (mais auditável, ciente de que cresce sem limite). Registros excluídos podem ser restaurados a qualquer momento; não aparecem em listas, cards, relatórios nem exportações.
- Q: Semântica do "Saldo disponível" editável (override visual, saldo inicial, ajuste como transação, remover)? → A: **Saldo inicial do período** — valor editado é o ponto de partida do mês; cards passam a mostrar `inicial + entradas_recebidas − saídas_pagas`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar e acompanhar transações do mês (Priority: P1)

A usuária da clínica abre a página **Finanças**, vê o mês corrente selecionado (ex.: "Junho de 2026") com o resumo de Entradas (recebido / pendente), Saídas (pago / pendente) e Saldo geral (disponível / previsto). Ela registra uma nova transação — entrada ou saída — informando data, descrição, categoria, valor e status, e a transação passa a constar imediatamente no resumo e na lista do período.

**Why this priority**: Sem o cadastro e a visualização de transações, nenhum outro recurso da página tem sentido. É o coração da funcionalidade e por si só já entrega valor (substituir planilha externa).

**Independent Test**: É possível validar a história sozinha entrando na página Finanças, criando uma transação de entrada e uma de saída no mês corrente, verificando que ambas aparecem na lista, que os totais "Entradas", "Saídas" e "Saldo geral" são atualizados corretamente, e que ao navegar para o mês anterior a lista volta a ficar vazia.

**Acceptance Scenarios**:

1. **Given** o usuário está autenticado em uma clínica sem transações no mês, **When** abre a página Finanças, **Then** vê o seletor do mês corrente, o estado vazio com ilustração e a mensagem "Nenhuma transação nesse período", e os totais aparecem zerados (R$ 0,00).
2. **Given** o usuário está na página Finanças do mês corrente, **When** clica em "Adicionar" e registra uma entrada de R$ 150,00 com categoria "Atendimento" e status "Recebido", **Then** a transação aparece na lista, "Entradas / Recebido" sobe para R$ 150,00 e "Saldo geral / Disponível" passa a R$ 150,00.
3. **Given** existem transações do mês anterior, **When** o usuário clica na seta de navegação para o mês anterior, **Then** o seletor atualiza para o mês anterior, a lista e os totais refletem somente as transações daquele período.
4. **Given** uma entrada foi cadastrada como "Pendente", **When** o usuário edita a transação e marca como "Recebido", **Then** o valor migra de "Pendente" para "Recebido" nos cards de resumo sem alterar o total geral.
5. **Given** uma transação existente, **When** o usuário escolhe excluí-la e confirma, **Then** ela é removida da lista e dos totais.

---

### User Story 2 - Filtrar, buscar e ocultar valores na lista de transações (Priority: P2)

A usuária precisa encontrar rapidamente uma transação específica ou um subconjunto (ex.: todas as saídas pendentes da categoria "Aluguel"), combinar filtros de tipo/status/categoria com uma busca textual, e — quando estiver atendendo em ambiente público — ocultar todos os valores monetários com um clique.

**Why this priority**: Em poucos meses a lista cresce a ponto de exigir filtros e busca; ocultar valores é um requisito de privacidade comum em consultórios. Não é bloqueante para o MVP, mas se torna crítico rapidamente.

**Independent Test**: Pode ser testada criando um conjunto variado de transações no mês, aplicando combinações de filtros (Entradas/Saídas, status, categoria) e busca textual, e ativando o toggle "Ocultar valores" — verificando em cada passo que a lista, os totais e os cards refletem o filtro e que os valores são substituídos por um marcador visual quando ocultados.

**Acceptance Scenarios**:

1. **Given** há transações de entrada e saída no mês, **When** o usuário aplica o filtro "Saídas › Saídas pendentes", **Then** a lista mostra apenas saídas com status "Pendente" e os cards mostram apenas os totais correspondentes ao filtro aplicado.
2. **Given** o filtro está em "Todas as transações", **When** o usuário digita "João" no campo de busca, **Then** a lista filtra em tempo real para transações cuja descrição, categoria ou tipo contenha "João".
3. **Given** vários filtros aplicados, **When** o usuário clica em "Limpar filtros", **Then** todos os filtros e a busca são resetados e a lista volta ao conteúdo completo do período.
4. **Given** valores visíveis na tela, **When** o usuário clica no ícone de olho ("Ocultar valores"), **Then** todos os valores monetários (cards, lista, totais) são substituídos por um marcador (ex.: "•••") e o ícone alterna para o estado "mostrar"; clicar novamente restaura os valores.
5. **Given** a página Finanças foi aberta uma segunda vez, **When** o usuário havia deixado os valores ocultos na sessão anterior, **Then** a página respeita a preferência anterior do usuário.

---

### User Story 3 - Analisar resultados financeiros no painel Relatório (Priority: P2)

A usuária alterna para a aba **Relatório** e vê, para o período selecionado: cards de Total de Entradas, Total de Saídas, Saldo e Variação (% em relação ao período anterior), um gráfico de linha de Entradas x Saídas ao longo do período, um gráfico de pizza com a distribuição por categoria (top 5) e um gráfico de barras comparando os últimos 12 meses. Pode comparar períodos e exportar relatórios em PNG ou PDF.

**Why this priority**: Entrega visão estratégica sobre o negócio. Depende de existirem transações cadastradas (US1), mas é independente de US2 — pode ser construída em paralelo após o cadastro básico estar pronto.

**Independent Test**: É testável de forma isolada criando um conjunto de transações nos últimos 12 meses, abrindo a aba "Relatório" e verificando que cada card e cada gráfico reflete corretamente os números agregados; ao alternar o período, todos os elementos se atualizam coerentemente.

**Acceptance Scenarios**:

1. **Given** transações cadastradas no mês corrente e no mês anterior, **When** o usuário abre a aba "Relatório", **Then** os cards mostram Total de Entradas (verde), Total de Saídas (vermelho), Saldo e Variação percentual em relação ao período anterior, com indicador visual de aumento ou queda.
2. **Given** o painel Relatório está aberto, **When** o usuário passa o mouse sobre o gráfico de linha Entradas x Saídas, **Then** uma tooltip mostra a data e os valores exatos do ponto.
3. **Given** o gráfico de pizza está exibido, **When** o usuário clica em uma categoria da legenda, **Then** as transações relacionadas àquela categoria são filtradas (ao voltar para a aba Finanças ou em uma visualização agregada).
4. **Given** o gráfico de barras dos últimos 12 meses está visível, **When** o usuário escolhe "Exportar › PNG", **Then** uma imagem do gráfico é baixada; ao escolher PDF, é baixado um relatório com cards e gráficos.
5. **Given** o seletor de período no topo da página, **When** o usuário escolhe "Comparar com mês anterior", **Then** os cards e gráficos passam a exibir as duas séries comparadas.

---

### User Story 4 - Exportar transações em CSV / XLSX / PDF (Priority: P3)

A usuária precisa enviar os dados para o contador ou arquivar relatórios mensais. Abre o menu de opções, escolhe "Exportar transações", seleciona o intervalo (este mês, mês anterior ou intervalo personalizado) e o formato (CSV, XLSX ou PDF) e recebe o arquivo gerado.

**Why this priority**: Importante para fluxo contábil, mas pode entrar logo após o MVP. Não bloqueia o uso do dia a dia.

**Independent Test**: Validável abrindo o modal de exportação, escolhendo cada combinação de intervalo e formato e verificando que o arquivo gerado contém todas as transações do intervalo escolhido com colunas Data, Descrição, Categoria, Tipo, Valor e Status.

**Acceptance Scenarios**:

1. **Given** a usuária está na aba Finanças, **When** abre o menu de opções e clica em "Exportar transações", **Then** um modal exibe as opções "Este mês", "Mês anterior", "Intervalo personalizado" e os formatos CSV, XLSX e PDF.
2. **Given** o modal está aberto com "Mês anterior" e "CSV" selecionados, **When** clica em "Exportar", **Then** um arquivo CSV com as transações do mês anterior é baixado contendo as colunas Data, Descrição, Categoria, Tipo, Valor, Status.
3. **Given** "Intervalo personalizado" está selecionado, **When** a data final é anterior à data inicial, **Then** o botão "Exportar" fica desabilitado e uma mensagem amigável indica a inconsistência.

---

### User Story 5 - Configurar preferências financeiras da clínica (Priority: P3)

A usuária abre as **Configurações** da página e define preferências da clínica: ativar/desativar a aplicação automática da taxa de cartão nas transações de entrada, e visualiza a seção "Configurar repasses e pagamentos" (somente para planos com equipe — exibe estado promocional com CTA "Quero expandir minha equipe").

**Why this priority**: Personalização que melhora a experiência mas não bloqueia o uso. Repasses ficam como upsell de plano superior.

**Independent Test**: Testável abrindo as configurações, alternando o toggle "Aplicar automaticamente a taxa do cartão" e verificando que novas transações de entrada com método "cartão" passam a ter a taxa aplicada automaticamente.

**Acceptance Scenarios**:

1. **Given** a usuária abre "Configurações", **When** ativa o toggle "Aplicar automaticamente a taxa do cartão", **Then** a preferência é persistida para a clínica e novas transações marcadas como cartão recebem a taxa pré-configurada deduzida do valor líquido.
2. **Given** a clínica não tem plano com equipe, **When** a usuária acessa a seção "Configurar repasses e pagamentos", **Then** vê o aviso "Funcionalidade disponível apenas para equipes" e o botão "Quero expandir minha equipe".

---

### Edge Cases

- **Mês sem transações**: deve exibir o estado vazio (ilustração + mensagem) e cards zerados sem quebrar a navegação entre meses.
- **Período muito grande no relatório**: ao escolher um intervalo personalizado superior a 12 meses, o sistema agrega por mês e exibe um aviso de que séries longas podem demorar para carregar.
- **Transação criada em fuso horário diferente do navegador**: a data exibida e o agrupamento por mês devem respeitar o fuso da clínica, não o do dispositivo.
- **Valor zero ou negativo**: o sistema rejeita valor ≤ 0 com mensagem clara; saídas continuam armazenadas como valores positivos diferenciadas pelo tipo.
- **Categoria removida pelo administrador**: transações antigas mantêm a categoria registrada (snapshot) mesmo se a categoria for desativada futuramente.
- **Exportação com lista vazia**: o botão "Exportar" fica desabilitado quando não há transações no intervalo escolhido.
- **Conexão lenta / falha**: cards, lista e gráficos exibem skeleton durante o carregamento e mensagem amigável com botão "Tentar novamente" em caso de erro.
- **Ocultar valores + exportar**: a exportação sempre contém os valores reais, independentemente do estado de ocultação na tela.
- **Edição concorrente**: se duas abas editam a mesma transação, a última gravação vence e a aba defasada recebe aviso ao tentar salvar.
- **Variação percentual com período anterior zerado**: quando o período anterior é R$ 0,00, exibir "—" em vez de divisão por zero.

## Requirements *(mandatory)*

### Functional Requirements

#### Navegação e estrutura
- **FR-001**: O sistema MUST exibir a página "Finanças" como uma rota dentro do contexto da clínica autenticada, escopada por `clinic_id`.
- **FR-002**: O sistema MUST oferecer duas abas principais — "Finanças" e "Relatório" — com a aba ativa destacada visualmente e transição suave entre painéis.
- **FR-003**: O sistema MUST permitir selecionar o período (mês corrente por padrão) com navegação rápida para mês anterior e próximo mês, e seleção direta por mês/ano.

#### Transações — cadastro e listagem
- **FR-004**: Usuários MUST poder cadastrar transações com os campos: data, descrição, categoria, tipo (entrada/saída), valor monetário (BRL, > 0), status, **método de pagamento** (enum fechado: Dinheiro, Pix, Cartão de débito, Cartão de crédito, Transferência, Boleto, Outro) e **taxa aplicada** (BRL ou %, opcional — preenchida manualmente por quem registra; quando informada, o sistema calcula e exibe também o valor líquido = valor − taxa).
- **FR-005**: O sistema MUST suportar os status: "Recebido" (verde), "Pendente" (amarelo) e "Pago" (azul); entradas usam Recebido/Pendente, saídas usam Pago/Pendente.
- **FR-006**: O sistema MUST exibir entradas com destaque visual em verde e saídas em vermelho na lista e nos cards de resumo.
- **FR-007**: Usuários MUST poder editar e excluir qualquer transação da clínica a que pertencem, com confirmação antes de excluir. A exclusão é **soft delete permanente — nunca purgada automaticamente** (a lixeira é mantida indefinidamente).
- **FR-007a**: Transações soft-deleted MUST ser ocultadas de todas as listagens, cards, filtros, gráficos e exportações por padrão (queries sempre filtram por não-excluídas).
- **FR-007b**: O sistema MUST oferecer uma **tela de lixeira** acessível ao administrador da clínica, exibindo as transações excluídas com a ação "Restaurar". A lixeira mostra Data, Descrição, Categoria, Tipo, Valor, Quem excluiu e Quando, e cresce sem limite por design (decisão consciente em favor da auditabilidade).
- **FR-007c**: O sistema MUST NOT oferecer "excluir definitivamente" automatizado e MUST NOT executar rotinas de purga; qualquer expurgo futuro será operação manual fora desta versão.
- **FR-008**: O sistema MUST exibir um estado vazio (ícone de calendário + mensagem "Nenhuma transação nesse período") quando o período selecionado não tiver transações.
- **FR-009**: O sistema MUST oferecer um botão de ação principal "Adicionar transação" sempre visível no painel Finanças.

#### Tabela de transações
- **FR-010**: A tabela MUST exibir as colunas: Data, Descrição, Categoria, Tipo, Valor e Status.
- **FR-011**: A tabela MUST permitir ordenação por qualquer coluna.
- **FR-012**: A tabela MUST oferecer paginação com tamanhos de página 10, 25 e 50 registros.
- **FR-013**: A tabela MUST permitir expandir uma linha para visualizar observações, histórico e informações complementares da transação.
- **FR-014**: A tabela MUST oferecer ações por registro (editar, excluir) acessíveis por teclado e leitor de tela.

#### Filtros e busca
- **FR-015**: O sistema MUST oferecer filtros por tipo/status: Todas, Entradas, Entradas recebidas, Entradas não recebidas, Saídas, Saídas concluídas, Saídas pendentes.
- **FR-016**: O sistema MUST oferecer filtros por categoria de entrada e por categoria de saída. A lista combina um **catálogo seed global** (padrão do sistema, listado na descrição inicial) com **categorias customizadas por clínica** (criadas/desativadas pelo administrador da clínica). Categorias do seed global não podem ser excluídas pela clínica, mas podem ser desativadas localmente para sumirem dos seletores.
- **FR-016a**: O administrador da clínica MUST poder criar uma nova categoria (nome + tipo entrada/saída) e desativar/reativar qualquer categoria (seed ou custom) no escopo da própria clínica, sem afetar outras clínicas.
- **FR-017**: O sistema MUST oferecer ações "Limpar filtros" e "Aplicar filtros" no painel de filtros.
- **FR-018**: O sistema MUST oferecer busca textual em tempo real por descrição, categoria e tipo, com debounce apropriado para não sobrecarregar a navegação.
- **FR-019**: O sistema MUST atualizar os cards de resumo de acordo com os filtros aplicados (totais respeitam o recorte exibido).

#### Resumo financeiro (cards do mês)
- **FR-020**: O sistema MUST exibir, no painel Finanças, blocos com: Entradas (Recebido + Pendente), Saídas (Pago + Pendente), Saldo geral (Disponível + Previsto).
- **FR-021**: O usuário MUST poder ajustar manualmente o "Saldo disponível" do período via ícone de edição ao lado do valor. O valor informado representa o **saldo inicial do período** (reconciliação manual); a partir dele, o card recalcula `Disponível = saldo_inicial + Σ entradas_recebidas − Σ saídas_pagas` e `Previsto = Disponível + Σ entradas_pendentes − Σ saídas_pendentes`. O saldo inicial é armazenado por clínica + ano/mês e é independente entre períodos.

#### Ocultar valores
- **FR-022**: O sistema MUST permitir alternar a ocultação de todos os valores monetários da página com um único controle (ícone de olho), substituindo cada valor por um marcador (ex.: "•••").
- **FR-023**: O sistema MUST persistir a preferência de ocultação entre sessões do mesmo usuário.

#### Exportação
- **FR-024**: O sistema MUST oferecer exportação de transações em CSV, XLSX e PDF, para os intervalos: este mês, mês anterior, intervalo personalizado.
- **FR-025**: A exportação MUST sempre conter os valores reais, ignorando o estado de ocultação visual.
- **FR-026**: O botão "Exportar" no modal MUST ficar desabilitado quando o intervalo escolhido não contiver transações ou quando a data final for anterior à data inicial.

#### Configurações financeiras
- **FR-027**: O sistema MUST oferecer um painel de configurações financeiras com a seção "Configurar repasses e pagamentos" e a gestão de categorias custom da clínica (FR-016a). A taxa de cartão **não é configurada globalmente** — é informada por transação (FR-004).
- **FR-028**: A seção de repasses MUST exibir o aviso "Funcionalidade disponível apenas para equipes" e CTA "Quero expandir minha equipe" para clínicas sem plano com equipe (recurso plenamente funcional fica fora do escopo desta versão).

#### Painel Relatório
- **FR-029**: O painel "Relatório" MUST exibir cards de Total de Entradas, Total de Saídas, Saldo e Variação percentual em relação ao período anterior, com indicador visual de aumento/queda.
- **FR-030**: O painel "Relatório" MUST exibir um gráfico de linha com Entradas x Saídas ao longo do período, com tooltip ao passar o mouse e respeitando o período selecionado.
- **FR-031**: O painel "Relatório" MUST exibir um gráfico de pizza com a distribuição das top 5 categorias por valor, com legenda interativa.
- **FR-032**: O painel "Relatório" MUST exibir um gráfico de barras comparando entradas e saídas dos últimos 12 meses, com tooltip detalhado.
- **FR-033**: O painel "Relatório" MUST exibir uma tabela resumo com colunas Categoria, Quantidade, Valor e Percentual, ordenável e filtrável por tipo.
- **FR-034**: O sistema MUST permitir comparação entre períodos: mês x mês, ano x ano, intervalos personalizados.
- **FR-035**: O sistema MUST permitir exportar o relatório em PNG e PDF.

#### Autorização e multi-tenant
- **FR-036**: O sistema MUST garantir que cada usuário só acesse, edite ou exporte transações da clínica à qual está autenticado.
- **FR-037**: O sistema MUST restringir o acesso (leitura e escrita) à página Finanças e às Configurações financeiras exclusivamente ao **administrador da clínica**, reaproveitando o guard `RequireClinicAdmin` no frontend e Policy equivalente no backend; demais usuários da clínica (recepcionista, profissional) não veem a entrada de menu nem podem chamar os endpoints.

#### Integração com agenda
- **FR-038**: Nesta versão, o lançamento financeiro é **totalmente manual** — o sistema NÃO cria transações automaticamente a partir de atendimentos do Scheduling. A integração automática fica documentada como evolução futura, fora do escopo desta entrega.

#### Validações e feedback
- **FR-039**: O sistema MUST validar campos obrigatórios, data válida (não posterior ao limite configurado) e valor > 0; campos inválidos devem ter destaque visual e mensagem clara.
- **FR-040**: O sistema MUST exibir confirmação visual (toast) após criar, editar, excluir ou exportar.
- **FR-041**: O sistema MUST exibir skeleton durante carregamento e mensagem amigável com botão "Tentar novamente" em caso de erro de carregamento.

#### Acessibilidade e responsividade
- **FR-042**: A página MUST ser navegável por teclado, ter contraste adequado, rótulos claros e compatibilidade com leitores de tela.
- **FR-043**: A página MUST ser responsiva: desktop com filtros laterais visíveis, tablet com filtros recolhíveis, mobile com menu hambúrguer, filtros em painel deslizante, tabela com rolagem horizontal e gráficos adaptados.

### Key Entities *(include if feature involves data)*

- **FinancialTransaction**: representa uma movimentação financeira da clínica. Atributos-chave: id, clinic_id, data, descrição, categoria (referência), tipo (entrada/saída), valor bruto (BRL), status (recebido/pendente/pago), método de pagamento (enum fechado: dinheiro, pix, cartao_debito, cartao_credito, transferencia, boleto, outro), taxa aplicada (opcional, em BRL — pode ser armazenada como valor absoluto), valor líquido derivado (valor − taxa), observações, criado_em, atualizado_em, criado_por, **deleted_at (soft delete permanente), deleted_by**.
- **FinancialCategory**: categoria de entrada ou saída (ex.: "Atendimento", "Aluguel"). Atributos: id, clinic_id (nullable — `null` significa categoria do **seed global** disponível para todas as clínicas; valor preenchido significa categoria **custom** daquela clínica), nome, tipo (entrada/saída), origem (`system` | `custom`), ativa, ordem. Visibilidade efetiva por clínica = união entre o seed global ativo + as custom da própria clínica, descontando as desativações locais registradas em `ClinicCategoryOverride`.
- **ClinicCategoryOverride**: registra desativação local de uma categoria do seed global por uma clínica específica (clinic_id + financial_category_id + ativa=false). Permite que a clínica esconda categorias-padrão sem perdê-las globalmente.
- **FinancialSettings**: preferências da clínica. Atributos: clinic_id, demais flags futuras. (Configurações de taxa de cartão deixam de existir — taxa é informada por transação. O saldo inicial passa a viver em `PeriodOpeningBalance`.)
- **PeriodOpeningBalance**: saldo inicial reconciliado de um período mensal. Atributos: id, clinic_id, ano, mês, valor (BRL), atualizado_em, atualizado_por. Único por (clinic_id, ano, mês).
- **MonthlyBalanceSnapshot** *(derivado/cacheável)*: agregados por mês usados pelos cards e relatório — entradas recebidas/pendentes, saídas pagas/pendentes, saldo disponível, saldo previsto, por clinic_id + ano/mês.
- **UserUiPreference** *(reuso do existente, se houver)*: persistência da preferência "ocultar valores" por usuário.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das clínicas ativas conseguem registrar a primeira transação em até 90 segundos a partir da abertura da página Finanças (sem precisar consultar documentação).
- **SC-002**: A lista de transações e os cards do mês carregam em menos de 1 segundo para clínicas com até 5.000 transações no mês.
- **SC-003**: Após 1 mês de uso, pelo menos 70% das clínicas que abriram a página Finanças têm 10 ou mais transações registradas (indicador de adoção real, não exploratória).
- **SC-004**: Pelo menos 40% das clínicas ativas no módulo executam uma exportação (CSV/XLSX/PDF) por mês após o terceiro mês de uso.
- **SC-005**: A aba Relatório carrega todos os gráficos do mês corrente em menos de 2 segundos para clínicas com até 10.000 transações em 12 meses.
- **SC-006**: Os filtros e a busca refletem o resultado em menos de 300 ms após cada interação (percepção de "tempo real").
- **SC-007**: Em pesquisa pós-lançamento, pelo menos 80% das usuárias avaliam a clareza dos cards de resumo e gráficos como "claro" ou "muito claro".
- **SC-008**: Redução de pelo menos 50% nos tickets de suporte categorizados como "como controlo minhas finanças?" nos 3 meses seguintes ao lançamento.

## Assumptions

- O escopo desta feature é exclusivamente o contexto **clinic** (guard JWT `clinic`); não há página equivalente no contexto admin nesta versão.
- A moeda é fixa em **BRL** (R$), formato pt-BR; não há suporte multi-moeda.
- A página reaproveita o design system do fisioweb (shadcn/ui + Tailwind + paleta atual), conforme orientações da skill `frontend-ui-patterns`, em vez de replicar literalmente o visual do screenshot de referência.
- Cards, gráficos e tabela são consumidos via API REST do módulo Clinic, seguindo o padrão Service → Repository → Controller já adotado (skill `backend-module`).
- O frontend segue o padrão DDD do projeto (`domain/`, `application/`, `infrastructure/`, `pages/clinic/finances/`) e os hooks de dados usam TanStack Query.
- Repasses para equipe e split de recebíveis ficam **fora do escopo desta versão** — apenas o estado promocional é exibido nas configurações.
- Suporte a **transações recorrentes / parceladas** não está no escopo desta versão (pode entrar em uma feature futura); cada lançamento é manual ou avulso.
- **Dark mode** é opcional e segue automaticamente o tema global do app — nenhum toggle exclusivo da página será criado.
- Categorias seguem modelo **híbrido**: seed global padrão (cobrindo as categorias listadas na descrição inicial) + categorias custom criadas/desativadas por cada clínica nesta versão. A tela de gestão de categorias é parte do escopo desta feature.
- Os gráficos são renderizados com a biblioteca de gráficos já presente/adequada ao projeto (preferência por Chart.js conforme descrição, a confirmar no `/speckit-plan`).
- A política de ocultação de valores é por usuário (não por clínica) e persistida na preferência de UI do usuário.
- A página assume conexão online; uso offline está fora de escopo.
