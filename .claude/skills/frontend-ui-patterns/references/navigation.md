# Navegação — sidebar, popover, layouts

## Layouts

| Componente | Caminho | Uso |
|------------|---------|-----|
| `AdminLayout` | `components/admin/AdminLayout.tsx` | Envolve **toda** página `/admin/*` |
| `ClinicLayout` | `components/clinic/ClinicLayout.tsx` | Envolve **toda** página `/clinica/*` |
| `AdminSidebar` | `components/admin/AdminSidebar.tsx` | Nav admin + submenus Popover |
| `ClinicSidebar` | `components/clinic/ClinicSidebar.tsx` | Nav clinic + `ClinicUserDropdown` no rodapé |

Estrutura: `sidebar fixa` + `main` com scroll. **Não** criar topbar full-width no contexto clinic/admin sem alinhar com o time.

## Item simples na sidebar

Referência: `ClinicSidebar` → `NavItem`

```tsx
<NavLink
  to={path}
  className={cn(
    'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
    'hover:bg-sidebar-accent',
    active
      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
      : 'text-sidebar-foreground/80 hover:text-sidebar-foreground',
  )}
>
  <Icon className="h-5 w-5 flex-shrink-0" />
  <span className="text-sm font-medium">{label}</span>
</NavLink>
```

## Submenu com filhos (admin)

Referência: `AdminSidebar` → `NavItemWithChildren`

- Trigger: botão na sidebar (mesmas classes do item simples).
- Painel: `Popover` + `PopoverContent` com `side="right"`, `className="w-64 space-y-1 p-2"`.
- Filhos: `<button>` com ícone + título + descrição, `hover:bg-accent`.

```tsx
<Popover open={isOpen} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <button type="button" className={/* classes sidebar */} />
  </PopoverTrigger>
  <PopoverContent side="right" align="start" sideOffset={8} className="w-64 space-y-1 p-2">
    {children.map((child) => (
      <button
        key={child.path}
        type="button"
        className={cn(
          'flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200',
          'hover:bg-accent',
          isActive(child.path) && 'bg-accent',
        )}
        onClick={() => navigate(child.path)}
      >
        <ChildIcon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
        <div className="flex flex-col">
          <span className="text-foreground text-sm font-medium">{child.label}</span>
          <span className="text-muted-foreground text-[11px] leading-tight">
            {child.description}
          </span>
        </div>
      </button>
    ))}
  </PopoverContent>
</Popover>
```

## Menu da conta (clinic)

Referência: `ClinicUserDropdown.tsx`

- **Trigger:** rodapé da sidebar; ativo quando `open` → `bg-sidebar-primary`.
- **Painel:** `Popover` para cima (`side="top"`), fundo **claro** — igual submenu admin.
- Cabeçalho opcional: nome + email com `text-foreground` / `text-muted-foreground`.

## Guards de rota (clinic)

| Componente | Uso |
|------------|-----|
| `RequireClinicAdmin` | Rotas só para `role === 'admin'` |

Ver skill [`security`](../../security/SKILL.md) para `permissions.ts`.

## Mobile

- `Sheet` lateral com mesmo `SidebarContent`.
- `useIsMobile()` em `AdminSidebar` / `ClinicSidebar`.

## Breadcrumb e header de página

Ver `forms-shadcn/references/components.md` — seções "Header de página" e "Header de form Edit".

## Spec / nomenclatura

No fisioweb, "navbar" nas specs costuma significar **área de conta na sidebar** (rodapé), não barra superior. Em dúvida, confirme com referência visual ou `ClinicUserDropdown`.

## Anti-patterns

| ❌ | ✅ |
|----|-----|
| `DropdownMenuContent className="bg-sidebar"` | `PopoverContent` padrão (branco) |
| Topbar nova no clinic sem pedido | Manter `ClinicLayout` + sidebar |
| Duplicar links no sidebar e no dropdown | Ações de conta só no dropdown (spec 001) |
