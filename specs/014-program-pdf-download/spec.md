# Feature Specification: Download PDF do Programa de Tratamento

**Feature Branch**: `014-program-pdf-download`

**Created**: 2026-07-16

**Status**: Draft

**Input**: User description: "Habilitar o botão Baixar PDF do programa. O PDF deve ter cabeçalho com foto do responsável, QR Code que leva à área do paciente, e todo o conteúdo do programa (capa com resumo, exercícios agrupados — nome do grupo ou 'Novo Grupo' se vazio — e páginas de anotações mensais para marcar dias e escrever observações). Referência visual: PDF tipo Vedius (capa + exercícios com fotos/parâmetros + Anotações por mês)."

## Clarifications

### Session 2026-07-16

- Q: Destino do QR Code “Acesse online”? → A: Deep link do programa na área do paciente.
- Q: Em quais status do programa o Baixar PDF fica disponível? → A: Qualquer programa que o usuário já possa visualizar (todos os status acessíveis).
- Q: Quantas imagens por exercício no PDF? → A: Até 2 imagens de referência (quando existirem). Inclui no escopo o cadastro dessas imagens no admin de vídeos (novo/editar).
- Q: Enviar o PDF por WhatsApp ou e-mail nesta feature? → A: Só download (Baixar PDF); sem envio WhatsApp/e-mail.
- Q: Se o período do programa for muito longo, quantas páginas de anotações gerar? → A: Um mês por página, com teto de 3 meses (se o período passar de 3 meses, só os 3 primeiros).
- Q: Precisa de migration nova para imagens de referência? → A: Não — reutilizar `admin_exercise_media` (app em desenvolvimento inicial; refresh de banco OK).
- Q: De onde vêm as imagens de referência nos seeds? → A: Mesmos links R2 já usados nos thumbnails dos vídeos seedados.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Profissional baixa o PDF do programa (Priority: P1)

Uma fisioterapeuta na área da clínica abre o detalhe de um programa de tratamento e usa a ação **Baixar PDF** (hoje desabilitada). O sistema gera e entrega um arquivo PDF imprimível com o conteúdo completo do programa, pronto para entregar ao paciente ou arquivar.

**Why this priority**: É o valor central da feature — sem o download funcional, o restante do layout não entrega benefício ao usuário.

**Independent Test**: Com um programa existente (paciente, grupos e exercícios), acionar Baixar PDF e abrir o arquivo: deve conter capa, exercícios e anotações; o botão não deve permanecer desabilitado.

**Acceptance Scenarios**:

1. **Given** um profissional autenticado na tela de detalhe de um programa que ele pode visualizar (qualquer status acessível), **When** ele aciona **Baixar PDF**, **Then** o sistema inicia o download de um PDF do programa e a ação não está desabilitada.
2. **Given** um programa com título, paciente, período e exercícios, **When** o PDF é aberto, **Then** o documento contém pelo menos a capa de resumo e as páginas de exercícios correspondentes ao conteúdo do programa.
3. **Given** a ação **Baixar PDF** também disponível no histórico/listagens onde já aparece o item de menu, **When** o profissional a aciona sobre um programa válido, **Then** o mesmo tipo de PDF é baixado.

---

### User Story 2 - Capa com responsável, QR e resumo do programa (Priority: P1)

Ao abrir a primeira página do PDF, o paciente (ou o profissional) vê o cabeçalho do responsável pelo programa (foto, nome, credencial profissional e contatos quando existirem), um QR Code com legenda “Acesse online” que direciona à área do paciente, o título do programa, o nome do paciente (“Para: …”), tempo estimado, período de execução e espaço/seção de observações do programa.

**Why this priority**: Identifica o profissional e dá ao paciente acesso digital — requisito explícito do pedido e da referência visual.

**Independent Test**: Gerar PDF de um programa com profissional (com foto e contatos), paciente e período; validar capa e que o QR, ao ser lido, abre a área do paciente associada.

**Acceptance Scenarios**:

1. **Given** um programa com profissional responsável que possui foto de perfil, **When** o PDF é gerado, **Then** a capa exibe a foto do responsável, o nome e a identificação profissional (ex.: título/registro), e telefone/e-mail quando cadastrados.
2. **Given** um programa vinculado a um paciente com acesso à área do paciente, **When** o PDF é gerado, **Then** a capa inclui um QR Code com legenda “Acesse online” cujo destino é o **deep link do próprio programa** na área do paciente (não apenas a home/login genérica).
3. **Given** um programa com título, paciente, tempo estimado e período de execução, **When** a capa é visualizada, **Then** aparecem o título, a linha “Para: {nome do paciente}”, o tempo estimado e o período de execução (com duração em dias quando aplicável).
4. **Given** um programa com texto de observações, **When** a capa é visualizada, **Then** a seção **Observações** exibe esse texto; se não houver observações, a seção permanece presente (vazia ou só com o título), sem quebrar o layout.

---

### User Story 3 - Exercícios agrupados com imagens e parâmetros (Priority: P1)

Nas páginas seguintes, o PDF lista os exercícios do programa organizados por grupo. Cada grupo mostra o nome do grupo (ou **Novo Grupo** se o nome estiver ausente/vazio). Cada exercício mostra imagens de referência (quando existirem), nome, descrição/instruções e parâmetros de prescrição (frequência, séries ou duração, manutenção/descanso, esforço — conforme o que estiver cadastrado no exercício).

**Why this priority**: É o corpo do programa que o paciente precisa executar; sem isso o PDF não substitui a entrega impressa.

**Independent Test**: Programa com dois grupos (um sem nome) e exercícios com e sem imagens; conferir títulos de grupo, ordem e parâmetros no PDF.

**Acceptance Scenarios**:

1. **Given** um exercício pertencente a um grupo sem nome (vazio ou nulo), **When** o PDF é gerado, **Then** o cabeçalho daquele grupo exibe **Novo Grupo**.
2. **Given** um grupo com nome definido, **When** o PDF é gerado, **Then** o cabeçalho do grupo exibe exatamente esse nome.
3. **Given** um exercício com até duas imagens de referência e descrição, **When** a página do exercício é visualizada, **Then** aparecem essas imagens (até 2), o nome, a descrição e os parâmetros prescritos preenchidos no programa.
4. **Given** um exercício sem imagens de referência, **When** o PDF é gerado, **Then** o exercício ainda aparece com nome, descrição e parâmetros (e thumbnail/placeholder se aplicável), sem impedir a geração do arquivo.
5. **Given** a ordem dos grupos e exercícios no programa, **When** o PDF é gerado, **Then** a ordem no documento respeita a ordem definida no programa.

---

### User Story 3b - Cadastro de imagens de referência no admin (Priority: P1)

Um administrador do sistema, ao criar ou editar um vídeo/exercício em **Admin › Vídeos** (ex.: `/admin/videos/novo`), pode anexar até **duas imagens de referência** (posições/instruções visuais do movimento). Essas imagens passam a ficar disponíveis para o PDF do programa e demais usos do exercício.

**Why this priority**: Sem o cadastro, o PDF quase nunca terá as duas fotos da referência visual; o thumbnail sozinho não cobre o layout pedido.

**Independent Test**: Em novo/editar vídeo no admin, enviar duas imagens de referência; incluir o exercício em um programa; baixar o PDF e ver as duas imagens naquele exercício.

**Acceptance Scenarios**:

1. **Given** um admin na tela de novo ou editar vídeo, **When** ele anexa até duas imagens de referência e salva, **Then** as imagens ficam persistidas e associadas ao exercício/vídeo.
2. **Given** um exercício com duas imagens de referência, **When** o PDF do programa é gerado, **Then** aquele exercício exibe essas duas imagens.
3. **Given** o formulário de vídeo, **When** o admin envia só uma imagem de referência (ou nenhuma), **Then** o salvamento é permitido; o PDF usa as imagens existentes (0, 1 ou 2).

---

### User Story 4 - Páginas de anotações mensais (Priority: P2)

Ao final do PDF (após os exercícios), há páginas de **Anotações** por mês cobrindo o período de execução do programa (no máximo os **3 primeiros** meses). Cada página permite marcar dias e escrever observações à mão (checkbox + data + linha), com texto de orientação semelhante a: marcar os dias em que realizou os exercícios e, quando necessário, escrever observações de dores ou dificuldades.

**Why this priority**: Complementa a entrega impressa para adesão e feedback; o programa já é utilizável sem isso, mas a referência visual e o pedido incluem essas páginas.

**Independent Test**: Programa com período de 2 meses → 2 páginas; programa com período de 5 meses → apenas 3 páginas (3 primeiros meses).

**Acceptance Scenarios**:

1. **Given** um programa cujo período de execução está contido em um único mês, **When** o PDF é gerado, **Then** existe uma página “Anotações de {Mês}” com os dias desse período e espaço para notas.
2. **Given** um programa cujo período cruza dois ou três meses, **When** o PDF é gerado, **Then** existe uma página de anotações para cada mês abrangido (até 3).
3. **Given** um programa cujo período abrange mais de 3 meses, **When** o PDF é gerado, **Then** existem páginas de anotações apenas para os **3 primeiros** meses do período.
4. **Given** uma página de anotações, **When** o profissional/paciente a visualiza, **Then** cada dia listado tem checkbox, identificação do dia (número + abreviação do dia da semana em português) e linha para escrita, além do texto de orientação sobre marcar dias e registrar dores/dificuldades.

---

### Edge Cases

- Programa sem paciente vinculado: o PDF ainda é gerado; a linha “Para:” indica ausência de paciente (ex.: “—”); o QR Code é omitido (não há área do paciente associada).
- Profissional sem foto: o cabeçalho usa um placeholder visual (ex.: iniciais) no lugar da foto.
- Profissional sem telefone e/ou e-mail: os campos ausentes simplesmente não aparecem; nome e identificação profissional permanecem.
- Programa sem grupos ou sem exercícios: o PDF gera a capa (e anotações, se houver período); a seção de exercícios fica vazia ou com indicação de que não há exercícios, sem falhar o download.
- Programa sem período de execução definido: a capa omite ou indica período indisponível; páginas de anotações mensais são omitidas.
- Período com mais de 3 meses: gera páginas de anotações só para os 3 primeiros meses do período; os meses seguintes não entram no PDF.
- Tempo estimado ausente ou zero: a capa omite o tempo estimado ou mostra valor neutro, sem falhar.
- Exercício com parâmetros parcialmente preenchidos: só os parâmetros existentes são listados.
- Imagens de exercício inacessíveis: placeholder no lugar da imagem; o restante do exercício e o download seguem.
- Programa de outra clínica / sem permissão: o download é negado (mesmo isolamento já aplicado à visualização do programa).
- Status do programa (rascunho/ativo/concluído/etc.): se o usuário já pode ver o programa, o download permanece disponível; não há bloqueio adicional por status.
- Nome de grupo só com espaços: tratado como vazio → **Novo Grupo**.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A área da clínica MUST habilitar a ação **Baixar PDF** nas telas onde ela já aparece para o programa (detalhe e demais menus equivalentes), para **qualquer status** de programa que o usuário já possa visualizar (rascunho, ativo, concluído, arquivado/modelo conforme regras de listagem existentes), sem restringir o download a um subconjunto de status.
- **FR-002**: Ao acionar **Baixar PDF**, o sistema MUST gerar e entregar um arquivo PDF do programa selecionado, sem exigir passos adicionais além da confirmação implícita do clique/download.
- **FR-002a**: Esta feature MUST NOT incluir envio do PDF por WhatsApp, e-mail ou outro canal; o único fluxo é o download iniciado pelo usuário na área da clínica.
- **FR-003**: O PDF MUST incluir uma capa (primeira página) com: identificação do responsável pelo programa (foto quando disponível, nome, título/registro profissional, telefone e e-mail quando disponíveis), QR Code “Acesse online” (quando houver paciente com área do paciente), título do programa, paciente destinatário, tempo estimado (quando disponível), período de execução e duração em dias (quando disponíveis), e seção **Observações**.
- **FR-004**: O QR Code da capa MUST apontar para o **deep link do programa** na área do paciente (URL que abre aquele programa específico), respeitando o fluxo de autenticação/acesso já existente da área do paciente.
- **FR-005**: O PDF MUST listar todos os grupos e exercícios do programa na ordem definida no programa.
- **FR-006**: Se o nome do grupo estiver ausente, nulo ou em branco, o PDF MUST exibir **Novo Grupo** como título daquele grupo.
- **FR-007**: Cada exercício no PDF MUST apresentar nome, descrição/instruções quando existirem, **até duas imagens de referência** quando existirem, e os parâmetros de prescrição disponíveis no programa (ex.: frequência, séries, duração/manter, descanso, esforço — conforme cadastrado).
- **FR-007a**: A área admin de vídeos (criar e editar) MUST permitir anexar até **duas imagens de referência** por exercício/vídeo; as imagens são opcionais (0, 1 ou 2).
- **FR-007b**: As imagens de referência cadastradas no admin MUST ser as mesmas usadas pelo PDF do programa para aquele exercício (na ordem definida no cadastro).
- **FR-008**: O PDF MUST incluir, após os exercícios, páginas de **Anotações** mensais cobrindo o período de execução do programa, no formato checklist diário (checkbox + dia + linha para notas) com texto de orientação para marcar dias realizados e registrar dores/dificuldades.
- **FR-009**: Quando o período de execução abranger um ou mais meses, o sistema MUST gerar uma página de anotações por mês abrangido, com **teto de 3 meses** (se houver mais de 3 meses no período, gerar apenas os 3 primeiros).
- **FR-010**: O download MUST respeitar o isolamento por clínica e as mesmas regras de acesso já aplicadas à visualização do programa (usuário sem acesso não obtém o PDF).
- **FR-011**: A geração do PDF MUST tolerar dados opcionais ausentes (foto, contatos, imagens, observações, parâmetros parciais) sem impedir o download; apenas omitir ou usar placeholder conforme os edge cases.
- **FR-012**: O conteúdo do PDF MUST refletir o estado atual do programa no momento do download (não um rascunho desatualizado da interface).

### Key Entities *(include if feature involves data)*

- **Programa de tratamento**: plano prescrito com título, paciente (opcional), responsável profissional, observações, tempo estimado, período de execução, grupos e exercícios.
- **Responsável pelo programa**: profissional vinculado ao programa; fornece foto, nome, credencial e contatos para o cabeçalho.
- **Grupo de exercícios**: agrupador com nome opcional; nome vazio → rótulo **Novo Grupo** no PDF.
- **Exercício prescrito**: item com nome, descrição, até duas imagens de referência e parâmetros de execução.
- **Imagens de referência do exercício**: até duas imagens estáticas (ex.: início/fim do movimento) cadastradas no admin de vídeos; distintas do thumbnail do vídeo; usadas no PDF.
- **Área do paciente**: portal do paciente; o QR Code usa o deep link do programa específico nesse portal.
- **Página de anotações**: folha mensal de acompanhamento impresso (dias do período + espaço para notas manuais); não exige persistência digital das marcações neste escopo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos programas que o profissional pode visualizar, a ação **Baixar PDF** está habilitada e conclui o download sem erro em condições normais (programa válido, dados mínimos presentes).
- **SC-002**: Um profissional consegue obter o PDF completo (capa + exercícios + anotações quando houver período) em menos de 30 segundos após acionar Baixar PDF, para um programa típico (até ~20 exercícios).
- **SC-003**: Em revisão manual do PDF gerado a partir de um programa de referência, 100% dos exercícios e grupos do programa aparecem no documento, na ordem correta, e grupos sem nome aparecem como **Novo Grupo**.
- **SC-003a**: Um admin consegue cadastrar duas imagens de referência em um vídeo e vê-las refletidas no PDF do programa que usa esse exercício, na primeira geração após o cadastro.
- **SC-004**: A leitura do QR Code da capa (quando presente) leva o paciente ao **programa correspondente** na área do paciente em 100% dos casos de teste com paciente vinculado e acesso configurado.
- **SC-005**: Profissionais conseguem usar o PDF impresso com o paciente sem precisar copiar manualmente exercícios ou criar folha de anotações à parte (capa, exercícios e anotações mensais presentes quando o programa tem período).

## Out of Scope

- Envio do PDF por WhatsApp, e-mail ou qualquer canal além do download na área da clínica.
- Persistência digital das marcações das páginas de anotações (são só para preenchimento impresso).
- Portal do paciente novo ou fluxo de autenticação novo além do deep link já existente.

## Assumptions

- O “responsável” do cabeçalho é o profissional vinculado ao programa (o mesmo já exibido como criador/responsável na tela do programa).
- A área do paciente já existe; o QR usa o deep link do programa nesse portal (não cria portal novo nem link mágico separado, salvo se o deep link já depender do acesso existente).
- Páginas de anotações são **apenas impressas** (checkbox e linhas para preenchimento à mão); não há sync digital das marcações neste escopo.
- Textos da UI e do PDF permanecem em português (Brasil), incluindo abreviações de dias da semana nas anotações.
- O layout de referência é o PDF tipo Vedius anexado na conversa (capa com foto + QR; exercícios com fotos empilhadas e parâmetros; anotações mensais), adaptado à identidade visual do fisioweb quando necessário, sem exigir paridade pixel-a-pixel.
- Imagens de referência persistem em `admin_exercise_media` (schema já existente); **sem migration nova** neste ambiente de desenvolvimento.
- Cadastro admin de até 2 imagens de referência (novo/editar vídeo) permanece no escopo; seeds populam as 2 URLs R2 já conhecidas em todos os exercícios seedados.
- Thumbnail do vídeo ≠ imagens de referência: o PDF prioriza as imagens de referência; se não houver nenhuma, pode usar thumbnail/placeholder conforme edge cases.
- Tempo estimado e período de execução usam os dados já existentes no programa, quando disponíveis.
- Modelos de programa sem paciente seguem os edge cases (PDF gerável; sem QR).
- Disponibilidade do download espelha a permissão de visualização do programa; não há regra extra por status.
- Envio do PDF por canais externos fica fora do escopo desta feature (ver Out of Scope).
- Páginas de anotações: 1 por mês do período, limitadas aos 3 primeiros meses quando o período for mais longo.
- A feature aprimora/substitui o PDF atual do plano de tratamento na experiência do usuário; o planejamento técnico decidirá reaproveitamento vs. novo layout, desde que o resultado atenda estes requisitos.
