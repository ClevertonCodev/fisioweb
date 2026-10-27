# Decisões · Formulários do prontuário no DS v2

## Sessão 2026-10-23

- **O que entra** → as quatro ações do prontuário, cada uma no desenho v2 já escolhido, gravando pela API que já existe: nova evolução (Folha B), nova avaliação (Prévia B) + responder/ficha e laudo (C), enviar questionário (Escolher e prever A), enviar arquivo (Foto do documento B). Criar questionário (banco de perguntas) fica para depois. Substitui a 004 da 009, que ligou essas ações nos overlays da v1 e deixou os desenhos v2 como protótipo.
- **Quem usa** → os mesmos papéis da 009 / ADR 017: ver o prontuário qualquer papel da clínica; nova evolução e nova avaliação só admin e fisioterapeuta (secretária vê desabilitado); enviar arquivo e enviar questionário os três papéis.
- **Onde vive** → sem módulo novo. `ClinicalRecord` (evolução, avaliação, arquivo), `ClinicQuestionnaire` (envio). SPA em `pages/clinic/patient/` (pastas de tela real, não `*-prototype`).
- **Dados** → sem migration. Tipo do arquivo continua no nome (`Laudo: …`), porque a API só guarda o nome. Texto da evolução: prévia ao vivo no front no mesmo formato de `EvolutionService::generateText`; o POST grava `generated_text` + itens marcados.
- **Fila** → sem job, sem Twilio, sem e-mail pelo servidor. WhatsApp e e-mail do questionário continuam `wa.me` / `mailto` com o `share_url` da 002.
- **Fora desta feature** → criar questionário; tela do paciente responder o questionário; PDF da avaliação (backend não tem); avaliação respondida pelo paciente via link (backend não tem); modelos de evolução v2 (`/clinica/templates/evolucoes`).

### Fora do escopo

- Criar questionário (`/clinica/questionarios/novo`, banco de perguntas).
- Página pública do paciente responder o questionário.
- PDF da avaliação.
- Avaliação enviada por link para o paciente responder.

- **Enviar link na nova avaliação** → some. Só fica "Responder agora", que cria a avaliação e abre a ficha. Não promete avaliação remota, que o backend não tem.
- **Modalidade do questionário** → só pelo celular (`remoto`). Some "Aqui na clínica". Depois do envio: Copiar, WhatsApp e E-mail com o `share_url`. (Alinha com a 009: quem responde é o paciente no link.)
- **Criar novo no envio** → o atalho para `/clinica/questionarios/novo?returnTo=` permanece; a tela de criar continua protótipo, fora desta feature.
- **PDF da avaliação** → o botão "Baixar PDF" some. O backend não gera PDF de avaliação.
- **Branch** → `feat/clinic-prontuario-formularios-ds` a partir da branch atual (`feat/clinic-paciente-novo-ds`), porque a 009 ainda não entrou na `main`.

### Em aberto

- (nada)
