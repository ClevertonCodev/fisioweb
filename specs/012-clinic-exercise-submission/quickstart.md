# Quickstart / Validation Guide: Clinic Exercise Submission & Admin Approval

Guia de validação ponta-a-ponta. Detalhes de implementação vivem em `data-model.md`, `contracts/` e `tasks.md`.

## Pré-requisitos

- Ambiente local configurado (`composer install && npm install`, `.env`, `jwt:secret`).
- Como a migration existente será alterada e o app só existe localmente:

```bash
php artisan migrate:fresh --seed   # recria schema com colunas novas + seeders
npm run build                      # ou: composer run dev (Laravel + Vite)
```

## Verificações automatizadas

```bash
composer run test    # PHPUnit — submissão, escopo de visibilidade, aprovação/rejeição, autorização
npm run test         # Vitest — página de envio (RHF+Zod), badge no card, contador no dashboard
npm run types && npm run lint
./vendor/bin/pint
```

## Cenário 1 — Clínica envia exercício (US1 / P1)

1. Logar na área da clínica como **admin da clínica** → aba Exercícios → "Enviar exercício".
2. Confirmar que a tela exibe o **aviso**: se aprovado pelo sistema, outras clínicas poderão ver (FR-005).
3. Preencher nome, categoria, dificuldade, (descrição opcional), selecionar vídeo (thumb/duração opcionais) e enviar.
4. **Esperado**: exercício aparece na biblioteca da própria clínica com badge "disponível apenas para a clínica que enviou"; `review_status = pending` (SC-001, FR-003, FR-010a).
5. Logar em **outra clínica** → o exercício **não** aparece (SC-002, FR-004).
6. Logar como usuário **não-admin** da clínica → ação de envio indisponível/`403` (FR-012a).

## Cenário 2 — Admin revisa e aprova (US2 / P2)

1. Logar no dashboard admin → confirmar card/badge "N exercícios a revisar" (FR-007, SC-004).
2. Abrir a lista de pendentes → assistir ao vídeo e ver metadados (FR-008).
3. **Aprovar** → `review_status = approved` (FR-009).
4. **Esperado**: em qualquer clínica, o exercício agora aparece na biblioteca sem a badge (SC-003, SC-005).
5. Repetir com **Rejeitar** em outro pendente → permanece só na clínica de origem, com badge; não entra no catálogo global (FR-010).

## Mapa requisito → verificação

| Requisito | Onde validar |
|-----------|--------------|
| FR-001/001a | Cenário 1 passos 1–3 (form + campos) |
| FR-002/003 | Cenário 1 passo 4 (clinic_id + pending) |
| FR-004 | Cenário 1 passos 4–5 / Cenário 2 passo 4 |
| FR-005 | Cenário 1 passo 2 (aviso) |
| FR-006 | Upload via Media (formatos/limites) |
| FR-007/SC-004 | Cenário 2 passo 1 |
| FR-008 | Cenário 2 passo 2 |
| FR-009/SC-003 | Cenário 2 passos 3–4 |
| FR-010/010a | Cenário 2 passo 5 + badge |
| FR-011/SC-005 | Badge/status na biblioteca da clínica |
| FR-012 | Aprovar/rejeitar só com guard admin |
| FR-012a | Cenário 1 passo 6 |
| FR-013 | `reviewed_by`/`reviewed_at` gravados na aprovação/rejeição |
| SC-002 | Cenário 1 passo 5 |
