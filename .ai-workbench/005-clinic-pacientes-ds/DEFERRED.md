# Trabalho adiado · 005-clinic-pacientes-ds

Rascunho local, fora do git. Formato: data, origem, uma frase.

- 2026-10-17 · refinamento · Inativação em massa (seleção de vários cartões + "Inativar N pacientes"): a v1 tinha, a C2 não tem; precisa de desenho próprio.
- 2026-10-17 · refinamento · Reativação em massa: não pedida; o endpoint novo é singular.
- 2026-10-17 · refinamento · Busca de pacientes usa `like` no `PatientRepository::paginateByClinic`; no Postgres diferencia maiúsculas ("maria" não acha "Maria"). Mesmo comportamento da v1; avaliar `ilike`/`lower()`.
- 2026-10-17 · escrever-plano · `is_active` não bloqueia o login do paciente no app; decidir se paciente inativo perde acesso (regra de produto).
- 2026-10-17 · escrever-plano · `PatientController::update` não chama `authorize('update')`; hoje a Policy libera todos os papéis, então não há brecha, mas o padrão está inconsistente com `destroy`/`deletePhoto`.
- Limite de 50 por página no backend: continua no `DEFERRED.md` da raiz (agenda pede `per_page=200`).
