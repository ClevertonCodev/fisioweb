# 002 · Correções da auditoria de controle de acesso

Fecha os 12 achados e o ponto a validar da auditoria `security-audit-skill/fisioweb/run-1`: o `/log-viewer` aberto, o mestre com senha = CNPJ, a mídia de exercício aprovado, os favoritos, o e-mail com maiúsculas, o `generate-text`, o OAuth e o pull do Google, as sessões que sobrevivem à troca de senha, o questionário, o paciente desativado e os arquivos do prontuário públicos. Também traz quatro reforços. Ganham as clínicas, os pacientes e o operador, que deixam de ter contas e dados alcançáveis por quem não deveria.

- **Status:** em andamento
- **Branch:** `fix/log-viewer-basic-auth` (tarefa 001, PR própria) e `feat/isolamento-clinicas-e-papeis` (o resto, uma PR só)
- **Plano:** [`plans/correcoes-auditoria-controle-de-acesso.md`](plans/correcoes-auditoria-controle-de-acesso.md)
- **Decisões:** [`decisoes.md`](decisoes.md)
- **Fora desta feature:** as regras de papel e a refatoração estrutural do plano de 2026-10-15, em [`papeis-fora-do-escopo.md`](papeis-fora-do-escopo.md). O plano e as tarefas antigas estão em [`tasks/arquivo-2026-10-15/`](tasks/arquivo-2026-10-15/).
- **Módulos:**
  - **Backend:** núcleo (`app/Providers`, `config/log-viewer.php`, `infra/provision.sh`), `Clinic`, `Admin`, `Media`, `ClinicalRecord`, `ClinicQuestionnaire`, `GoogleCalendar`, `ClinicScheduling`, `Patient`, `Cloudflare`, `docs/adr`.
  - **SPA:**
    - `pages/admin/clinic`: acesso do mestre e `login-as`;
    - `pages/admin/exercises`: proposta de mídia;
    - `/clinica/primeiro-acesso`;
    - edição de usuário v2;
    - envio de exercício;
    - prontuário: arquivos;
    - agenda e usuário: volta do Google.

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [001 · `/log-viewer` atrás de basic auth em produção](tasks/001-log-viewer-basic-auth.md) | concluída | | |
| [002 · Trocar a senha derruba as outras sessões (clínica e admin)](tasks/002-troca-de-senha-derruba-sessoes.md) | concluída | | |
| [003 · Mestre nasce sem senha e define a senha pelo link de primeiro acesso](tasks/003-mestre-sem-senha-e-primeiro-acesso.md) | concluída | | |
| [004 · Bloco "Acesso do mestre" na tela da clínica do admin, com smoke de ponta a ponta](tasks/004-acesso-do-mestre-no-admin.md) | concluída | | |
| [005 · Só o mestre troca o próprio e-mail e a própria senha](tasks/005-so-o-mestre-troca-email-e-senha.md) | concluída | | |
| [006 · Clínica cancelada não loga, perde as sessões e não se reativa sozinha](tasks/006-clinica-cancelada-sem-acesso.md) | concluída | | |
| [007 · Limite de tentativas no login, no forgot e no reset do admin](tasks/007-throttle-no-login-do-admin.md) | concluída | | |
| [008 · Registro do "entrar como" do operador](tasks/008-registro-do-login-as.md) | concluída | | |
| [009 · E-mail do usuário da clínica único sem diferenciar maiúsculas](tasks/009-email-unico-sem-maiusculas.md) | concluída | | |
| [010 · Favoritos só com exercício visível e sem dados de origem](tasks/010-favoritos-so-exercicio-visivel.md) | concluída | | |
| [011 · `generate-text` só com modelo do sistema ou da própria clínica](tasks/011-generate-text-so-modelo-da-clinica.md) | concluída | | |
| [012 · Resposta de questionário só com pergunta do próprio template](tasks/012-questionario-so-pergunta-do-template.md) | concluída | | |
| [013 · Pull do Google só altera as consultas do próprio fisio](tasks/013-pull-do-google-so-do-proprio-fisio.md) | concluída | | |
| [014 · Conexão com o Google com nonce de uso único e ticket confirmado por quem está logado](tasks/014-oauth-google-com-nonce-e-ticket.md) | a fazer | | |
| [015 · Paciente desativado perde o token na hora](tasks/015-paciente-desativado-perde-o-token.md) | a fazer | | |
| [016 · Arquivos do prontuário com link de 5 minutos e apagados do R2](tasks/016-arquivos-do-prontuario-com-link-assinado.md) | a fazer | | |
| [017 · Seletor do operador só com vídeo do catálogo, e sincronização das imagens por evento sem regravar exercício aprovado](tasks/017-seletor-do-operador-e-sync-por-evento.md) | a fazer | | |
| [018 · Proposta de mídia de exercício aprovado no backend, com ADR](tasks/018-proposta-de-midia-no-backend.md) | a fazer | | |
| [019 · Botão "Trocar imagens" no modal da biblioteca, com o aviso "em revisão" no aprovado](tasks/019-trocar-imagens-no-modal-da-biblioteca.md) | a fazer | | |
| [020 · Operador revisa a proposta de mídia (antes e depois, aprovar e rejeitar)](tasks/020-revisao-da-proposta-pelo-operador.md) | a fazer | | |

## Pastas

- `decisoes.md`, `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
