---
description: Review code instead of editing it
---

Review the relevant code with a code review mindset. Prioritize bugs, behavioral regressions, security issues, and missing tests. Findings must be the primary focus, ordered by severity. Do not make code changes unless the user explicitly asks for them.

## Regras do fisioweb a verificar

1. **Correção** — caso de borda (null, lista vazia, data/fuso, paginação), condição invertida, escrita múltipla sem `DB::transaction`, exceção engolida.
2. **Segurança / autorização** — endpoint sem Policy, falta de escopo por `clinic_id` (vazamento entre clínicas), guard JWT errado (`admin` vs `clinic`), mass assignment, FormRequest sem validação. Ver `.cursor/skills/security/SKILL.md`.
3. **Arquitetura** — controller com regra de negócio; módulo importando Model/Repository de outro módulo; loader chamando `infrastructure/`; `fetch` em vez de `apiClient`; `domain/` com snake_case/`ApiXxx`; form com 2+ campos sem RHF + Zod. Ver `CLAUDE.md`.
4. **Desempenho** — N+1, query em loop, coleção inteira sem paginação.
5. **Testes** — comportamento novo sem teste, teste que só verifica mock, caso de autorização não testado.

Não reportar formatação coberta por Pint/Prettier/ESLint nem preferência sem impacto concreto.

Cada achado precisa de um **cenário concreto** (entrada/estado → resultado errado → esperado) e de uma sugestão de teste que o prove. Sem cenário, não reporte.
