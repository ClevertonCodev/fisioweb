# Cores e tokens — fisioweb

Fonte de verdade: `resources/css/app.css`

**Regra:** use classes Tailwind mapeadas aos tokens. Nunca cores hardcoded (`#26A69A`, `text-green-500`).

## Paleta principal (light mode)

| Token Tailwind | Uso | HSL aproximado |
|----------------|-----|----------------|
| `background` / `foreground` | Fundo e texto da área de conteúdo | 99% / slate escuro |
| `primary` / `primary-foreground` | Botões primários, CTAs | Teal 175 70% 35% / branco |
| `secondary` | Botões secundários, chips | Cinza esverdeado claro |
| `muted` / `muted-foreground` | Fundos suaves, hints, descrições | Cinza / texto secundário |
| `accent` / `accent-foreground` | **Hover em popovers/menus claros** | Verde menta claro 175 60% 92% |
| `destructive` | Erros, delete, validação | Vermelho sistema |
| `card` / `card-foreground` | Cards de formulário e filtros | Branco |
| `popover` / `popover-foreground` | Painéis flutuantes (Popover, Dropdown) | Branco |
| `border` / `input` / `ring` | Bordas, inputs, focus ring | Cinza claro / teal no focus |

## Sidebar (admin e clinic)

| Token | Uso |
|-------|-----|
| `bg-sidebar` | Fundo da barra lateral |
| `text-sidebar-foreground` | Texto padrão dos itens |
| `text-sidebar-foreground/80` | Item inativo |
| `hover:bg-sidebar-accent` | Hover de item na sidebar |
| `hover:text-sidebar-foreground` | Texto no hover |
| `bg-sidebar-primary` | **Item ativo** ou trigger aberto |
| `text-sidebar-primary-foreground` | Texto/ícone no item ativo (branco) |
| `border-sidebar-border` | Divisores da sidebar |

### Classes copiáveis — item sidebar

```tsx
// Inativo
'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200'
'hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground'

// Ativo
'bg-sidebar-primary text-sidebar-primary-foreground'
```

## Popover / menu flutuante (fundo claro)

```tsx
// Container
<PopoverContent className="w-64 space-y-1 p-2" />

// Item
'flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200'
'hover:bg-accent'
// Ativo:
'bg-accent'
```

Texto do item:
- Título: `text-foreground text-sm font-medium`
- Descrição: `text-muted-foreground text-[11px] leading-tight`
- Ícone: `text-muted-foreground mt-0.5 h-4 w-4 shrink-0`

## Semânticos

| Token | Quando usar |
|-------|-------------|
| `success` / `success-foreground` | Toasts de sucesso (sonner) |
| `warning` | Alertas de atenção |
| `info` | Informação neutra |
| `destructive` | Erros, excluir, campos inválidos |

## Área de conteúdo (páginas)

| Elemento | Classes típicas |
|----------|-----------------|
| Título de página | `text-foreground text-2xl font-semibold` |
| Subtítulo / breadcrumb | `text-muted-foreground text-sm` |
| Seção de form | `border-border border-b pb-2 text-lg font-semibold` |
| Campo obrigatório | `<span className="text-destructive">*</span>` |
| Campo read-only | `disabled` + `bg-muted/50` |
| Erro inline | `text-destructive text-[11px] font-medium` |
| Container de página | `space-y-6 p-4 md:p-6` ou `p-6` |
| Card de form | `Card` + `CardContent` + `max-w-4xl mx-auto` |

## Dark mode

Tokens têm variante `.dark` em `app.css`. O app usa principalmente light nas áreas de conteúdo; sidebar já é escura em ambos.

## Anti-patterns

```tsx
// ❌
className="text-red-500 bg-[#1abc9c]"

// ✅
className="text-destructive bg-primary"
className="hover:bg-accent"
className="bg-sidebar-primary text-sidebar-primary-foreground"
```
