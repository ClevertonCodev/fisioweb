# Frontend UI Patterns — artefato compartilhado (Spec Kit)

**Versão:** 1.0 | **Skill canônica:** `.claude/skills/frontend-ui-patterns/`

Toda feature com interface no SPA **deve** consultar este documento (ou a skill) antes da implementação de UI.

## Quando referenciar no spec/plan/tasks

- Nova navegação, menu, dropdown ou layout.
- Nova página admin ou clinic.
- Qualquer decisão de cor, hover ou componente visual.
- Espelhar tela existente (ex.: "igual `ClinicEditPage`").

Adicione no `plan.md` da feature:

```markdown
## UI Reference
- Skill: `frontend-ui-patterns`
- Componentes canônicos: [listar arquivos]
- Tokens: `resources/css/app.css`
```

## Regras obrigatórias

1. **Copiar padrão existente** — listar arquivo de referência no plan antes de codar.
2. **Cores via tokens** — `primary`, `accent`, `sidebar-*`, `destructive`; sem hex arbitrário.
3. **Sidebar escura vs popover claro** — nunca misturar `bg-sidebar` em painel flutuante.
4. **Cursor pointer** — todo elemento clicável (`button`, `onClick`, itens de menu).
5. **Layouts** — `AdminLayout` ou `ClinicLayout` em toda página.
6. **Forms 2+ campos** — RHF + Zod (`forms-shadcn`).

## Mapa de referências canônicas

| Padrão | Arquivo |
|--------|---------|
| Item sidebar ativo/hover | `resources/js/components/clinic/ClinicSidebar.tsx` |
| Submenu Popover (Planos) | `resources/js/components/admin/AdminSidebar.tsx` |
| Menu da conta | `resources/js/components/clinic/ClinicUserDropdown.tsx` |
| Form clínica completo | `resources/js/pages/admin/clinic/ClinicEditPage.tsx` |
| Listagem + tabela | `forms-shadcn` → `DataTable` |
| Tokens de cor | `resources/css/app.css` |

## Popover vs sidebar — decisão

| Onde | Fundo | Hover item |
|------|-------|------------|
| Dentro da sidebar | `bg-sidebar` | `hover:bg-sidebar-accent` |
| Item ativo sidebar | `bg-sidebar-primary` | texto branco |
| Painel flutuante | `bg-popover` (branco) | `hover:bg-accent` |

## Catálogo de componentes

Ver skill → `references/components-catalog.md` (lista completa `components/ui`, admin, clinic).

## Cores

Ver skill → `references/colors-and-tokens.md`.

## Interação (cursor, hover)

Ver skill → `references/interaction.md`.

`app.css` aplica `cursor: pointer` globalmente em `button`, `a`, `[role='button']`. Itens custom de popover devem incluir `cursor-pointer` explicitamente.

## Checklist de aceite UI (features)

- [ ] Arquivo canônico identificado e seguido.
- [ ] Tokens Tailwind; sem cores soltas.
- [ ] Popover claro / sidebar escura corretos.
- [ ] Hover e ativo consistentes.
- [ ] Clicáveis com pointer.
- [ ] Layout admin/clinic correto.
- [ ] Loading, erro e vazio cobertos.

## Relacionado

- [`forms-shadcn`](../../.claude/skills/forms-shadcn/SKILL.md) — forms e DataTable
- [`frontend-ddd`](../../.claude/skills/frontend-ddd/SKILL.md) — camadas
- [`security`](../../.claude/skills/security/SKILL.md) — guards e permissions
