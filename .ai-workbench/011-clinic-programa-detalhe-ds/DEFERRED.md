# Adiado · 011 Detalhe do programa no DS v2

- **2026-10-26 · Teste quebrado que já existia:** `ExerciseLibraryPage.test.tsx` › "mostra a grade D com as abas de Programas" falha com "Found multiple elements with the role button and name Criar programa". Falha igual sem as mudanças da 011 (conferido com `git stash`); vem do commit `7e1b9b0` da branch (botão "Criar programa" escondível). Fora do escopo da 011.
- **2026-10-26 · Prettier que já existia:** `resources/js/test/patient-record-data.test.ts` fora do formato; mudou nos commits `fe0e155`/`0092324`, não na 011.
- **2026-10-26 · Branch atrás da `main`:** a `feat/clinic-historico-exercicios-programas` não tem três commits da `main` (`0092324`, `3268369`, `4e72ff6`). Rebase ou merge antes da PR.
- **2026-10-26 · 404 duplicado:** o programa de outra clínica pede `GET` duas vezes (loader + refetch ao montar, porque o cache fica `null` com `staleTime` 0). Inofensivo; dá para evitar com `staleTime` no `useClinicProgram`, se incomodar.
- **2026-10-26 · 404 depois de excluir no painel:** ao excluir o rascunho, a invalidação de `['clinic-programs']` refaz o `GET` do programa já excluído antes de a tela sair (1 requisição 404, sem efeito na tela). Dá para evitar com `removeQueries` da chave do programa no `onDeleted`.
- **2026-10-26 · Smoke por papel:** `tools/screenshot/credentials.json` só tem o admin da clínica; Excluir desabilitado para fisioterapeuta e secretária ficou só no teste Vitest.
- **2026-10-26 · Dados locais:** não há paciente sem telefone com programa, nem rascunho com paciente, no banco local; esses estados do WhatsApp ficaram só no teste Vitest.
