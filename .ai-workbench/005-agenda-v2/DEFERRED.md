# Adiado · 005 Agenda v2

Decidido no refinamento de 2026-10-17.

- **Coluna própria para o local** (clínica ou domicílio + sala). Hoje o local vai como texto no `location`, então um relatório por tipo de local teria que ler o texto.
- **Carregar consultas por período visível** (`from`/`to`). A agenda continua carregando todas as consultas da clínica, como a v1.
- **"Falta" e as cores DS no resto da v1** (dashboard, `STATUS_COLORS`). Por enquanto valem só na agenda v2.
- **Salvar o alfinete da coluna e as agendas visíveis** como preferência (`agenda.rail_pinned`, `agenda.hidden_users`).
- **Tipos de serviço com mais atributos** (cor, preço, vínculo com o financeiro).
- **Testes automatizados de front** da agenda e do modal v2. Por decisão do usuário, os testes cobrem as regras novas do backend, e o front fica no smoke test.
- **Regra de acesso do histórico x tarefa 013 da feature 002.** Quando "fisio vê só os pacientes dele" sair, rever se "paciente que atende" (consulta não cancelada) vira "paciente acessível" (responsável ou vínculo). Anotar também no `DEFERRED.md` da 002.
- **Eventos depois das 22:00 nas grades Dia/Semana.** A grade vai de 06:00 a 22:00 (a v1 ia de 07:00 a 21:00). Um evento que começa depois das 22:00 só aparece em "Atendimentos" ou "Mês". Visto no smoke da revisão rodada 3.
- **Mudar o dia do término no modal.** O modal preserva o término em outro dia (eventos do Google e consultas antigas), mas não oferece campo para escolher outro dia de término ao criar. Os atalhos de duração e de tipo recalculam o término a partir do início (passando para o dia seguinte quando a soma passa da meia-noite).
- **Para a PR (revisão adversária, Minor):** logout não limpa o cache do React Query (anterior ao diff); autorização do histórico e das preferências fora de método de Policy (decidido no plano); fisio ganha acesso ao histórico agendando com qualquer paciente (ver item da 002); `LockTimeoutException` vira 500 em disputa longa dos tipos de serviço; `AGENDA_VIEWS` no `domain/` (opcional).
- **Passar da meia-noite com mais de 90 min numa consulta nova.** Os atalhos são 30/45/60/90 min e o término digitado antes do início é erro de digitação (decisão do usuário). Uma consulta das 22:00 à 01:00 só sai com um tipo de serviço de 180 min, ou mudando o início, usando o atalho e voltando o início. Se for comum, um campo de data do término resolve.
- **Consulta curta que já termina no dia seguinte, com término digitado depois do início, fica no mesmo dia** (ex.: seg 09:00 → ter 05:00, digitar 15:00 = seg 15:00). É a leitura da regra da rodada 6 para o caso que ela não cobre. Rever se aparecer caso real.
- **Branch atrás da `main`.** Antes da PR, mesclar a `main` (9 commits à frente, com reativação de pacientes e lista de pacientes no DS) e rodar `bash bin/verificar.sh`. O merge simulado nos 3 arquivos que os dois lados mexem não deu conflito.
- **Horário de término em outro dia no modal (pendência aceita pelo usuário em 2026-10-17).** A correção da rodada 7 (duração de referência + teste de propriedade) não foi revisada. Opções: travar o horário desses eventos no modal, ou campo de data no término. Histórico em `review/001-a-007/decisoes.md`.
- **Utilitários de protótipo na pasta da agenda.** `PrototypeSwitcher`, `shared.tsx` (status DS, `statusLabel`) e `agenda-prototype.css` continuam em `pages/clinic/agenda-prototype/` porque os protótipos de outras telas (prontuário, programas, finanças, usuários...) importam de lá. A agenda v2 não usa mais. Mover para um lugar comum quando esses protótipos virarem produção.
