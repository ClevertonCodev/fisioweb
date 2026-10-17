# Interação — cursor, hover, foco

## Cursor pointer (obrigatório)

`app.css` já aplica `cursor: pointer` em:

- `button`, `a`
- `[role='button']`, `[type='button']`, `[type='submit']`, `[type='reset']`
- `.cursor-pointer`

### Quando adicionar `cursor-pointer` manualmente

| Elemento | Motivo |
|----------|--------|
| `<button type="button">` custom (popover item) | Garantia explícita no padrão do projeto |
| `div` / `span` com `onClick` | Não coberto pelo CSS global |
| Itens de `Popover` montados como `<button>` | Incluir na class do item |
| Linhas clicáveis em `DataTable` | Via `onRowClick` ou célula com handler |
| `DropdownMenuItem` | Adicionar `cursor-pointer` na `className` se necessário |
| Links estilizados como texto (`onClick` + `span`) | Sempre |

```tsx
// Padrão de item clicável em popover
<button
  type="button"
  className="flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 ..."
>
```

```tsx
// Texto clicável (breadcrumb, voltar)
<span className="cursor-pointer hover:underline" onClick={...} />
```

### Quando NÃO usar pointer

- Campos `disabled` / `readOnly`
- Texto puramente informativo
- Ícones decorativos sem ação

## Hover e estados

### Sidebar (fundo escuro)

| Estado | Classes |
|--------|---------|
| Default | `text-sidebar-foreground/80` |
| Hover | `hover:bg-sidebar-accent hover:text-sidebar-foreground` |
| Ativo / aberto | `bg-sidebar-primary text-sidebar-primary-foreground` |

### Popover / conteúdo claro

| Estado | Classes |
|--------|---------|
| Default | `text-foreground` (título), `text-muted-foreground` (descrição) |
| Hover | `hover:bg-accent` |
| Ativo (rota atual) | `bg-accent` |

### Botões (shadcn Button)

| Variant | Uso |
|---------|-----|
| `default` | Ação primária (Salvar, Criar) |
| `outline` | Cancelar, secundária |
| `ghost` | Ícone, voltar, ações discretas na sidebar |
| `destructive` | Excluir (com confirmação em AlertDialog) |

Desabilitar durante mutation: `disabled={mutation.isPending}`

## Foco e acessibilidade

- Botões icon-only: `aria-label` obrigatório.
- Tooltip: `<TooltipTrigger asChild>` envolvendo o controle.
- Select/Dialog: shadcn/Radix já gerenciam foco; não remover `outline-none` dos primitives sem substituto.

## Transições

Padrão do projeto:

```tsx
'transition-all duration-200'
```

Usado em itens de sidebar e popover para hover suave.

## Checklist de interação

- [ ] Todo clique tem feedback visual (hover/active).
- [ ] `cursor-pointer` em custom buttons e elementos `onClick`.
- [ ] Botões submit desabilitados durante loading.
- [ ] Ação destrutiva com `AlertDialog`, não `window.confirm`.
