# Adiado · 007-clinic-user-form-ds

- ~~2026-10-20 · 002 · GET/PUT de usuário de outra clínica responde 200 (`ClinicUserController::show/update` sem `clinic_id`, `Gate::before` libera admin). Fora do escopo: é backend da `main`; corrigido em `.ai-workbench/002-isolamento-clinicas-e-papeis/tasks/001-checagem-de-clinica-e-usuarios.md`.~~ Resolvido pela PR #47 (lista de usuários v2): middleware no `ClinicUserController` dá 404 para usuário de outra clínica.
- ~~2026-10-20 · 002 · Protótipo da edição chama `GET /api/clinic/users` (`useTeam`) também para fisioterapeuta e secretário(a), que recebem 403.~~ Resolvido na 004: a edição de verdade não usa `useTeam` (os contadores saíram).
- ~~2026-10-20 · 001 · No celular a prévia fica acima do formulário, mas o subtítulo diz "À direita…".~~ Resolvido na 003: "Na prévia, como…".
- 2026-10-20 · 002 · CPFs dos usuários do seed são inválidos e travam o salvar (já em `docs/prototipos-v2.md`).
- 2026-10-20 · 003/004 · O cadastro e a edição de verdade não têm o recorte da foto (`ImageCropModal`) que a v1 tinha: a foto vai inteira, recusada antes de enviar se passar de 2 MB ou não for JPG/PNG/WebP. Trazer o recorte para o DS v2.
- 2026-10-20 · 003 · Foto que falha depois de criar mostra dois avisos (o `toast.error` do `useUploadClinicUserPhoto` e o `toast.warning` da página), como já era na v1.
