---
name: frontend-ui-patterns
description: Catálogo de componentes UI, cores/tokens, navegação (sidebar vs popover), cursor pointer e padrões visuais do SPA fisioweb. Use ANTES de criar ou estilizar qualquer tela, menu, dropdown, layout admin/clinic ou componente clicável. Evita reinventar CSS e garante consistência com AdminSidebar, ClinicSidebar e forms-shadcn.
metadata:
  domain: ui
  triggers: componente, UI, cor, token, sidebar, popover, dropdown, cursor, layout, AdminLayout, ClinicLayout, shadcn, tailwind, hover, ativo
  scope: implementation
  output-format: code
  related-skills: forms-shadcn, frontend-ddd, frontend-react
---

# Frontend UI Patterns (fisioweb)

**Leia esta skill antes de implementar qualquer UI nova.** Ela complementa [`forms-shadcn`](../forms-shadcn/SKILL.md) (forms/listagens) com catálogo de componentes, cores, navegação e interação.

Artefato compartilhado do Spec Kit: [`specs/_shared/frontend-ui-patterns.md`](../../../specs/_shared/frontend-ui-patterns.md)

## Quando usar

- Criar menu, dropdown, popover ou item de sidebar.
- Escolher qual componente shadcn/custom usar.
- Definir cores, hover, estado ativo.
- Garantir `cursor-pointer` em elementos clicáveis.
- Espelhar tela existente (ex.: form de clínica, submenu de Planos).

## Regra de ouro — copie antes de inventar

| Preciso de… | Arquivo canônico |
|-------------|------------------|
| Item fixo da sidebar (ativo/hover) | `resources/js/components/clinic/ClinicSidebar.tsx` |
| Submenu flutuante (fundo branco) | `resources/js/components/admin/AdminSidebar.tsx` → `NavItemWithChildren` |
| Menu da conta (popover claro) | `resources/js/components/clinic/ClinicUserDropdown.tsx` |
| Form completo de clínica (admin) | `resources/js/pages/admin/clinic/ClinicEditPage.tsx` |
| Layout admin / clinic | `AdminLayout.tsx` / `ClinicLayout.tsx` |
| Listagem com tabela | `forms-shadcn` → `DataTable` |
| Cores e tokens | `resources/css/app.css` |

### Popover vs DropdownMenu vs cores da sidebar

| Contexto | Componente | Fundo | Hover do item |
|----------|------------|-------|---------------|
| Item **dentro** da sidebar | `NavLink` / `button` | `bg-sidebar` | `hover:bg-sidebar-accent` |
| Item **ativo** na sidebar | idem | `bg-sidebar-primary text-sidebar-primary-foreground` | — |
| Painel **flutuante** (submenu, conta) | `Popover` + `PopoverContent` | `bg-popover` (branco) | `hover:bg-accent` |
| Menu de contexto rápido | `DropdownMenu` | `bg-popover` | `hover:bg-accent` |

**Nunca** use fundo `bg-sidebar` dentro de um painel flutuante. Sidebar = escuro; popover = claro.

## Skill Map

| Estou fazendo | Carregue |
|--------------|----------|
| Catálogo completo de componentes | [`references/components-catalog.md`](references/components-catalog.md) |
| Cores, tokens, estados semânticos | [`references/colors-and-tokens.md`](references/colors-and-tokens.md) |
| Sidebar, popover, menus, layouts | [`references/navigation.md`](references/navigation.md) |
| Cursor, hover, foco, clicáveis | [`references/interaction.md`](references/interaction.md) |
| Forms, DataTable, RHF | [`forms-shadcn`](../forms-shadcn/SKILL.md) |
| Camadas DDD | [`frontend-ddd`](../frontend-ddd/SKILL.md) |

## Mandatos

### Deve fazer
- Usar **tokens Tailwind** (`text-foreground`, `bg-primary`, `text-destructive`) — nunca `text-red-500` ou hex solto.
- Itens clicáveis com **`cursor-pointer`** (ver [`interaction.md`](references/interaction.md)).
- Submenu com ícone + título + descrição (padrão admin popover).
- Trigger da sidebar: verde (`sidebar-primary`) **só quando aberto/ativo**; hover normal = `sidebar-accent`.
- Ícones de `lucide-react`.
- Páginas em `<AdminLayout>` ou `<ClinicLayout>`.

### Não deve fazer
- Criar topbar/navbar se o padrão do contexto é **sidebar** (clinic/admin).
- Estilizar dropdown de conta igual à sidebar escura.
- `DropdownMenu` com classes `bg-sidebar-*` no conteúdo.
- `useState` para forms com 2+ campos (ver `forms-shadcn`).
- Omitir estado de loading/erro/vazio em páginas.

## Checklist antes de entregar UI

- [ ] Identifiquei o componente canônico no repo e segui o mesmo padrão.
- [ ] Cores via tokens (`app.css`), não valores arbitrários.
- [ ] Popover flutuante = fundo claro; sidebar = fundo escuro.
- [ ] Hover/ativo documentados nesta skill aplicados.
- [ ] Todos os clicáveis com `cursor-pointer`.
- [ ] Layout correto (`AdminLayout` / `ClinicLayout`).

## Quick decision

| Cenário | Use |
|---------|-----|
| Link na sidebar | `NavLink` + classes de `ClinicSidebar` |
| Submenu ao lado (Planos, Exercícios) | `Popover` + itens `hover:bg-accent` |
| Menu da conta no rodapé | `Popover` (não sidebar escura) |
| Confirmação destrutiva | `AlertDialog` |
| Modal de formulário | `Dialog` |
| Painel lateral mobile | `Sheet` |
| Dica em ícone | `Tooltip` com `TooltipTrigger asChild` |
| Badge de status | `StatusBadge` ou `Badge` |
| Campo somente leitura | `disabled` + `bg-muted/50` |
| Toast | `sonner` (já global) |
