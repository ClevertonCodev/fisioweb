# Feature Specification: Ajuste de Seeds — Funcionalidades, Planos, Clínicas e Mídias

**Feature Branch**: `main` (trabalho direto na main, sem branch nova, por decisão do usuário)

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "Ajustar seeds de funcionalidades, planos, clínicas e mídias. Funcionalidades com valores isolados: agenda=10, programas e exercícios=15, finanças=5, app=20. Planos (todos cobrança por usuário): Start mensal 20 / anual 15, sem funcionalidades; Performance mensal 30 / anual 25 com agenda, programas e exercícios, finanças; Premium mensal 40 / anual 35 com agenda, programas e exercícios, finanças, app. Uma clínica por plano: a clínica Cleverton existente vira Clínica Premium; criar Clínica Start e Clínica Performance. Fotos, thumbnails e vídeos dos seeds trocados por URLs específicas do bucket R2. Trabalhar direto na branch main."

## Clarifications

### Session 2026-07-11

- Q: Como tratar as chaves de funcionalidade (`ALLOWED_KEYS`) com placeholders `teste1..10` e `video_call`? → A: Substituir tudo pelas 4 chaves reais (agenda, programas e exercícios, finanças, app); `video_call` e os placeholders são removidos.
- Q: Quanto de dado de demonstração cada clínica nova recebe? → A: Réplica proporcional ao plano — Performance recebe dados de demonstração dos módulos do seu plano (agenda, programas e exercícios, finanças); Start recebe só o mínimo (clínica + usuário admin + paciente básico); massa completa continua na Premium.
- Q: Quais e-mails/logins para as clínicas novas? → A: Clínica Cleverton (Premium) mantém o e-mail atual; Clínica Start usa `start@fisioweb.local` e Clínica Performance usa `performance@fisioweb.local` (clínica e admin), com a senha padrão de desenvolvimento.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Catálogo de funcionalidades e planos semeado corretamente (Priority: P1)

Ao rodar o seed do banco, o administrador do sistema encontra as quatro funcionalidades comerciais (Agenda, Programas e Exercícios, Finanças, App) com seus valores isolados, e os três planos comerciais (Start, Performance, Premium) com cobrança por usuário, valores mensais/anuais corretos e as funcionalidades corretas vinculadas a cada plano.

**Why this priority**: É a base comercial do sistema; planos e funcionalidades alimentam todos os fluxos de contratação e demonstração. Sem isso, as clínicas de demonstração não têm o que assinar.

**Independent Test**: Rodar o seed em um banco limpo e conferir, na área admin (ou diretamente nos dados), as 4 funcionalidades com valores 10/15/5/20 e os 3 planos com valores e vínculos corretos.

**Acceptance Scenarios**:

1. **Given** um banco recém-migrado, **When** o seed é executado, **Then** existem as funcionalidades Agenda (valor isolado 10), Programas e Exercícios (15), Finanças (5) e App (20).
2. **Given** um banco recém-migrado, **When** o seed é executado, **Then** existe o plano Start com cobrança por usuário, valor mensal 20, valor anual 15 e nenhuma funcionalidade vinculada.
3. **Given** um banco recém-migrado, **When** o seed é executado, **Then** existe o plano Performance com cobrança por usuário, valor mensal 30, valor anual 25 e as funcionalidades Agenda, Programas e Exercícios e Finanças vinculadas.
4. **Given** um banco recém-migrado, **When** o seed é executado, **Then** existe o plano Premium com cobrança por usuário, valor mensal 40, valor anual 35 e as funcionalidades Agenda, Programas e Exercícios, Finanças e App vinculadas.

---

### User Story 2 - Uma clínica de demonstração por plano (Priority: P1)

Ao rodar o seed, existem três clínicas de demonstração, cada uma associada a um plano: a clínica Cleverton já existente é renomeada/ajustada para representar o plano Premium (documento 856.283.250-23); são criadas a Clínica Start (documento 726.868.590-40) e a Clínica Performance (documento 74.760.866/0001-37), com volume de dados de demonstração proporcional ao plano de cada uma.

**Why this priority**: Permite demonstrar e testar o comportamento do sistema em cada nível de plano com dados realistas.

**Independent Test**: Rodar o seed e verificar as três clínicas com documentos e planos corretos, cada uma com login funcional.

**Acceptance Scenarios**:

1. **Given** o seed executado, **When** consulto as clínicas, **Then** a clínica Cleverton existente está associada ao plano Premium com documento 856.283.250-23.
2. **Given** o seed executado, **When** consulto as clínicas, **Then** existe uma Clínica Start associada ao plano Start com documento 726.868.590-40 e uma Clínica Performance associada ao plano Performance com documento 74.760.866/0001-37.
3. **Given** o seed executado mais de uma vez, **When** consulto as clínicas, **Then** não há clínicas duplicadas (seed idempotente, como já é hoje).

---

### User Story 3 - Mídias dos seeds apontando para os novos arquivos do bucket (Priority: P2)

Ao rodar o seed, as fotos de pacientes e usuários de clínica, os thumbnails de vídeo e os arquivos de vídeo apontam para as URLs específicas fornecidas do bucket R2, garantindo que as mídias de demonstração carreguem corretamente.

**Why this priority**: Melhora a demonstração visual, mas não bloqueia o funcionamento comercial dos planos/clínicas.

**Independent Test**: Rodar o seed e conferir que fotos, thumbnails e vídeos usam exatamente as URLs indicadas e carregam no navegador.

**Acceptance Scenarios**:

1. **Given** o seed executado, **When** consulto pacientes e usuários de clínica semeados, **Then** todos usam a foto `patients/photos/2cc94b05-8e9c-465a-b42a-6c40b473bf59_1783781535.png` do CDN R2.
2. **Given** o seed executado, **When** consulto os vídeos semeados, **Then** os thumbnails usam os arquivos `thumbnails/videos/31fa195c-d9f5-49e6-bb57-78da4d32b932_1783558953.png` e `thumbnails/videos/139645c7-fa38-4679-a24c-2c3113a8fecc_1783782292.jpeg` do CDN R2.
3. **Given** o seed executado, **When** consulto os vídeos semeados, **Then** os arquivos de vídeo usam `videos/bf6fd593-97ff-4bc2-be31-469a5e0a6c00_1783782291.mp4` e `videos/7cb1e772-ea99-4564-9478-82198e60d9eb_1783558952.mp4` do CDN R2.

---

### Edge Cases

- Reexecução do seed em banco já semeado: registros existentes (funcionalidades, planos, clínicas, mídias) devem ser atualizados para os novos valores, não duplicados.
- Clínica Cleverton existente com documento antigo (`00000000000`): o seed deve atualizá-la (mesma chave de identificação por e-mail) em vez de criar uma quarta clínica.
- Pacientes/usuários já semeados com fotos antigas: as fotos devem ser trocadas para a nova URL na reexecução.
- As chaves de funcionalidade permitidas passam a ser exatamente as 4 novas (agenda, programas e exercícios, finanças, app); registros antigos com chaves removidas (`video_call`, `teste1..10`) não devem sobrar após o seed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O seed MUST criar/atualizar as funcionalidades: Agenda (valor isolado 10,00), Programas e Exercícios (15,00), Finanças (5,00) e App (20,00), cada uma com chave estável reconhecida pelo sistema.
- **FR-001a**: O conjunto de chaves de funcionalidade permitidas MUST conter exatamente as 4 chaves novas; as chaves antigas `video_call` e `teste1..10` MUST ser removidas, sem deixar registros órfãos dessas chaves após o seed.
- **FR-002**: O seed MUST criar/atualizar o plano Start: cobrança por usuário, valor mensal 20,00, valor anual 15,00, sem funcionalidades vinculadas.
- **FR-003**: O seed MUST criar/atualizar o plano Performance: cobrança por usuário, valor mensal 30,00, valor anual 25,00, com Agenda, Programas e Exercícios e Finanças vinculadas.
- **FR-004**: O seed MUST criar/atualizar o plano Premium: cobrança por usuário, valor mensal 40,00, valor anual 35,00, com Agenda, Programas e Exercícios, Finanças e App vinculadas.
- **FR-005**: O seed MUST ajustar a clínica Cleverton existente para o plano Premium com documento 856.283.250-23, preservando seu e-mail/login atuais.
- **FR-006**: O seed MUST criar a Clínica Start (documento 726.868.590-40, plano Start) e a Clínica Performance (documento 74.760.866/0001-37, plano Performance), cada uma com usuário administrador ativo.
- **FR-006a**: O volume de dados de demonstração MUST ser proporcional ao plano: Start recebe apenas o mínimo (clínica, usuário admin e 1 paciente básico); Performance recebe dados de demonstração dos módulos do seu plano (agenda, programas e exercícios, finanças); Premium mantém a massa de demonstração completa.
- **FR-007**: Fotos de pacientes e de usuários de clínica semeados MUST usar a URL `https://pub-c505783a14d2470eb49d00e4e17df019.r2.dev/patients/photos/2cc94b05-8e9c-465a-b42a-6c40b473bf59_1783781535.png`.
- **FR-008**: Thumbnails dos vídeos semeados MUST usar as URLs `.../thumbnails/videos/31fa195c-d9f5-49e6-bb57-78da4d32b932_1783558953.png` e `.../thumbnails/videos/139645c7-fa38-4679-a24c-2c3113a8fecc_1783782292.jpeg` do mesmo CDN.
- **FR-009**: Vídeos semeados MUST usar as URLs `.../videos/bf6fd593-97ff-4bc2-be31-469a5e0a6c00_1783782291.mp4` e `.../videos/7cb1e772-ea99-4564-9478-82198e60d9eb_1783558952.mp4` do mesmo CDN.
- **FR-010**: Todos os seeds afetados MUST ser idempotentes: reexecução atualiza os registros para os valores acima sem duplicar dados.
- **FR-011**: O trabalho MUST ser feito diretamente na branch `main`, sem criação de branch nova.

### Key Entities

- **Funcionalidade (Feature)**: item comercial vendável isoladamente; atributos: chave, nome, valor isolado.
- **Plano (Plan)**: pacote comercial; atributos: nome, tipo de cobrança (por usuário), valor mensal, valor anual; relaciona-se com funcionalidades via vínculo plano-funcionalidade.
- **Clínica (Clinic)**: cliente do SaaS; atributos: nome, documento (CPF/CNPJ), e-mail; associa-se a um plano; possui usuários e pacientes.
- **Vídeo (Media)**: mídia de exercício; atributos: URL do arquivo, URL/caminho do thumbnail.
- **Paciente / Usuário de clínica**: pessoas semeadas com foto de perfil (URL no CDN).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Após um seed em banco limpo, 100% das 4 funcionalidades e dos 3 planos existem com exatamente os valores especificados.
- **SC-002**: Após o seed, existem exatamente 3 clínicas de demonstração, cada uma vinculada ao plano correto e com o documento correto.
- **SC-003**: Executar o seed duas vezes seguidas não altera a contagem de funcionalidades, planos, clínicas, vídeos, pacientes ou usuários semeados.
- **SC-004**: 100% das URLs de foto, thumbnail e vídeo dos registros semeados respondem com o arquivo esperado ao serem abertas.

## Assumptions

- A associação clínica→plano usa o mecanismo já existente no sistema (campo/vínculo de plano na clínica); se ainda não existir vínculo direto, o seed usa o mecanismo de assinatura/contratação vigente.
- As clínicas novas usam `start@fisioweb.local` e `performance@fisioweb.local` como e-mail da clínica e do usuário admin, com a senha padrão de desenvolvimento (`12345678`); a Clínica Cleverton mantém o e-mail atual.
- Como só há uma URL de foto fornecida, todos os pacientes e usuários semeados compartilham a mesma foto.
- Os dois vídeos existentes no seed são atualizados para as duas novas URLs (vídeo 1 → primeiro par vídeo/thumbnail, vídeo 2 → segundo par).
- Seeds são conteúdo de desenvolvimento/demonstração; nenhum dado de produção é afetado.
