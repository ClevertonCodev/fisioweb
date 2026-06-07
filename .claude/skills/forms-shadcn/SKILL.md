---
name: forms-shadcn
description: Componentes shadcn/ui + custom do fisioweb — DataTable com paginação, Form (RHF integration), MoneyInput, CpfCnpjInput, Select com Portal, Dialog. Use ao montar listagem com filtros + tabela, formulário New/Edit com validação, modal de confirmação, ou layout admin/clinic. Codifica padrões reais como o envelope `[data]` em DataTable, columns fora do JSX, paginação controlada por estado, totalCount e emptyMessage obrigatórios.
metadata:
  domain: ui
  triggers: shadcn, DataTable, Form, Dialog, Select, Input, MoneyInput, CpfCnpjInput, AdminLayout, ClinicLayout, sonner, toast, lucide
  scope: implementation
  output-format: code
  related-skills: frontend-ddd, frontend-react
---

# Forms & Shadcn UI (fisioweb)

Padrões de UI específicos do projeto. Stack: **shadcn/ui (Radix)** + **Tailwind** + **lucide-react** + **sonner** (toasts) + componentes custom do projeto.

## Quando usar

- Montando ListPage com filtros + tabela + paginação.
- Montando NewPage/EditPage com formulário.
- Adicionando Dialog de confirmação de delete.
- Usando MoneyInput, CpfCnpjInput, ou outros componentes específicos do projeto.
- Configurando AdminLayout / ClinicLayout corretamente.

## Skill Map

| Estou fazendo | Carregue |
|--------------|----------|
| Estrutura DDD (domain/application/infra/pages) | [`frontend-ddd`](../frontend-ddd/SKILL.md) |
| Hooks, memo, performance | [`frontend-react`](../frontend-react/SKILL.md) |
| Forms com RHF + Zod (skill DDD tem essa reference) | [`frontend-ddd/references/forms.md`](../frontend-ddd/references/forms.md) |

## Componentes — onde estão

```
resources/js/components/
├── ui/                        # shadcn + customs (button, input, dialog, ...)
│   ├── data-table.tsx         # custom — listagem padrão
│   ├── form.tsx               # shadcn — integração com RHF
│   ├── money-input.tsx        # custom — moeda BRL
│   ├── cpf-cnpj-input.tsx     # custom — máscara PF/PJ
│   ├── table-pagination.tsx   # custom — paginação
│   └── ...                    # demais shadcn (button, input, select, dialog, ...)
├── admin/
│   ├── AdminLayout.tsx        # envoltório de toda página admin
│   └── AdminSidebar.tsx
├── clinic/
│   ├── ClinicLayout.tsx
│   ├── ClinicSidebar.tsx
│   └── RequireClinicAdmin.tsx # guarda de rota (ver skill security)
└── ...
```

## Core mandates

### Deve fazer
- Envolver páginas em `<AdminLayout>` (admin) ou `<ClinicLayout>` (clinic).
- DataTable: **columns fora do JSX** (constante no topo), `totalCount` e `emptyMessage` sempre informados.
- Paginação local controlada por estado (`currentPage`, `pageSize`) + `useMemo` para `filtered`/`paginated`.
- Forms novos com **RHF + Zod** + shadcn `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>`.
- Botões desabilitados durante `mutation.isPending` ou `mutation.isLoading`.
- `toast.success` / `toast.error` (sonner) em mutations — já vem dos hooks de `application/`.
- Ícones via `lucide-react` (`<Plus />`, `<Pencil />`, `<Trash2 />`, `<Search />`, `<ArrowLeft />`).
- Cabeçalho de página: breadcrumb simples + botão Voltar + título + ação primária.
- Em listagem, sempre cobrir loading (Skeleton ou texto), erro (alert vermelho), vazio (DataTable já tem `emptyMessage`).

### Não deve fazer
- Form com 2+ campos validados usando `useState` puro — usar RHF + Zod. **A `FeatureNewPage.tsx` faz isso e é legado** — não copiar.
- Tabela HTML/`<Table>` puro com paginação manual — usar `<DataTable>`.
- Toast manual via lib externa — usar `toast` de `sonner` (já configurado globalmente).
- Tooltip sem `<Tooltip><TooltipTrigger asChild>...<TooltipContent /></Tooltip>` — Radix exige `asChild`.
- Style inline para cores — usar tokens Tailwind (`text-foreground`, `text-destructive`, `bg-card`).

## Reference Guide

| Tópico | Referência | Carregar quando |
|--------|-----------|-----------------|
| ListPage completa (filtros + DataTable + paginação + delete) | [`references/list-page.md`](references/list-page.md) | Montar listagem |
| Form, Dialog, componentes específicos (MoneyInput, CpfCnpjInput, Select Portal) | [`references/components.md`](references/components.md) | Montar Form ou usar componente custom |

## Output esperado

Ao montar tela nova, entregue:

1. Layout (`AdminLayout` ou `ClinicLayout`).
2. Breadcrumb + título + ação primária.
3. Filtros em `<Card>` (se for listagem).
4. `<DataTable>` com columns no topo, `useMemo` para filtered/paginated.
5. Mutations com loading state nos botões.
6. Loading/erro/vazio cobertos.
7. Toasts vêm dos hooks (não chame manual).

## Quick decision

| Cenário | Use |
|---------|-----|
| Listagem com paginação | `<DataTable>` com `pagination`, `pageSize`, `onPageSizeChange` |
| Form New/Edit com 2+ campos | shadcn `<Form>` + RHF + Zod (ver [`frontend-ddd/references/forms.md`](../frontend-ddd/references/forms.md)) |
| Form com 1 campo (busca, filtro) | `useState` direto, sem RHF |
| Modal de confirmar delete | `<AlertDialog>` shadcn |
| Modal genérico | `<Dialog>` shadcn |
| Campo de moeda BRL | `<MoneyInput>` |
| CPF/CNPJ com máscara | `<CpfCnpjInput>` |
| Date picker | shadcn `<Popover>` + `<Calendar>` |
| Select com Portal (radix) | `<Select>` shadcn — testa com `getByRole('combobox')` |
| Toast em mutation | Já vem do hook em `application/` — não chame `toast` manual |
| Toast em erro de UI puro | `toast.error('mensagem')` de `sonner` |
| Loading global | Skeleton ou texto "Carregando..." em PT |
| Erro vermelho inline | `<div className="border-destructive/50 bg-destructive/10 text-destructive ...">` |
| Tooltip em botão de ação | `<Tooltip>` com `TooltipTrigger asChild` envolvendo o `<Button>` |
| Cabeçalho de form Edit | `<Button variant="ghost" size="icon"><ArrowLeft /></Button>` + título |
