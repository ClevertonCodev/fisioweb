# Catálogo de componentes — fisioweb

Base: `resources/js/components/`

Legenda: **shadcn** = Radix + Tailwind do projeto | **custom** = específico fisioweb

---

## `components/ui/` — primitivos e shadcn

### Formulário e entrada

| Arquivo | Tipo | Para que serve |
|---------|------|----------------|
| `button.tsx` | shadcn | Ações; variants `default`, `outline`, `ghost`, `destructive` |
| `input.tsx` | shadcn | Texto, email, número |
| `textarea.tsx` | shadcn | Texto multilinha |
| `label.tsx` | shadcn | Rótulo de campo |
| `form.tsx` | shadcn | Integração React Hook Form (`FormField`, `FormItem`, `FormMessage`) |
| `checkbox.tsx` | shadcn | Booleano múltiplo |
| `radio-group.tsx` | shadcn | Escolha única entre opções |
| `switch.tsx` | shadcn | Toggle on/off |
| `select.tsx` | shadcn | Dropdown de opções (combobox Radix) |
| `select-options.tsx` | custom | Helpers/opções reutilizáveis para Select |
| `slider.tsx` | shadcn | Valor numérico em faixa |
| `toggle.tsx` / `toggle-group.tsx` | shadcn | Botões de alternância |
| `input-otp.tsx` | shadcn | Código OTP |
| `calendar.tsx` | shadcn | Calendário (usar com Popover) |
| `cpf-cnpj-input.tsx` | **custom** | Máscara CPF/CNPJ; dígitos puros no form |
| `money-input.tsx` | **custom** | Moeda BRL formatada |
| `phone-input.tsx` | **custom** | Telefone BR formatado |
| `slug-input.tsx` | **custom** | URL da clínica; modo read-only com prop `readOnly` |
| `input-error.tsx` | custom | Mensagem de erro abaixo de campo |

### Dados e listagem

| Arquivo | Tipo | Para que serve |
|---------|------|----------------|
| `data-table.tsx` | **custom** | Tabela paginada padrão do projeto (listagens) |
| `table.tsx` | shadcn | Tabela HTML base (preferir `data-table`) |
| `table-pagination.tsx` | **custom** | Controles de página usados pelo DataTable |
| `pagination.tsx` | shadcn | Paginação genérica shadcn |
| `card-list.tsx` | custom | Lista em cards (alternativa à tabela) |
| `status-badge.tsx` | **custom** | Badge de status de entidade |

### Layout e estrutura

| Arquivo | Tipo | Para que serve |
|---------|------|----------------|
| `card.tsx` | shadcn | Agrupar seções (filtros, forms) |
| `separator.tsx` | shadcn | Linha divisória |
| `scroll-area.tsx` | shadcn | Área com scroll estilizado |
| `resizable.tsx` | shadcn | Painéis redimensionáveis |
| `aspect-ratio.tsx` | shadcn | Proporção fixa (mídia) |
| `sidebar.tsx` | shadcn | Primitivo sidebar shadcn (layouts usam componentes admin/clinic) |
| `breadcrumb.tsx` | shadcn | Navegação hierárquica |
| `back-button.tsx` | **custom** | Voltar do header — `Button outline` + `ArrowLeft` + “Voltar” (borda); props `to` / `onClick` / `label` |
| `tabs.tsx` | shadcn | Abas de conteúdo |
| `accordion.tsx` | shadcn | Seções expansíveis |
| `collapsible.tsx` | shadcn | Mostrar/ocultar bloco |

### Overlay e menus

| Arquivo | Tipo | Para que serve |
|---------|------|----------------|
| `dialog.tsx` | shadcn | Modal genérico |
| `alert-dialog.tsx` | shadcn | Confirmação (ex.: excluir) |
| `sheet.tsx` | shadcn | Painel lateral (mobile menu) |
| `drawer.tsx` | shadcn | Gaveta inferior/lateral |
| `popover.tsx` | shadcn | **Painel flutuante** — submenus sidebar, menu conta |
| `dropdown-menu.tsx` | shadcn | Menu de contexto rápido (fundo claro) |
| `context-menu.tsx` | shadcn | Clique direito |
| `menubar.tsx` | shadcn | Barra de menu horizontal |
| `navigation-menu.tsx` | shadcn | Menu de navegação complexo |
| `command.tsx` | shadcn | Paleta de comandos / busca |
| `tooltip.tsx` | shadcn | Dica ao hover (sidebar colapsada) |
| `hover-card.tsx` | shadcn | Preview ao hover |

### Feedback

| Arquivo | Tipo | Para que serve |
|---------|------|----------------|
| `alert.tsx` | shadcn | Mensagem inline (info/erro) |
| `sonner.tsx` | shadcn | Provider de toasts (usar `toast` de `sonner`) |
| `toast.tsx` / `toaster.tsx` | shadcn | Legado; preferir sonner |
| `skeleton.tsx` | shadcn | Placeholder de loading |
| `progress.tsx` | shadcn | Barra de progresso |
| `badge.tsx` | shadcn | Etiquetas e tags |

### Mídia e visualização

| Arquivo | Tipo | Para que serve |
|---------|------|----------------|
| `avatar.tsx` | shadcn | Foto ou inicial do usuário |
| `carousel.tsx` | shadcn | Carrossel de imagens |
| `chart.tsx` | shadcn | Gráficos (recharts) |

---

## `components/admin/`

| Arquivo | Para que serve |
|---------|----------------|
| `AdminLayout.tsx` | Shell de páginas admin |
| `AdminSidebar.tsx` | Sidebar + Popover submenus (referência canônica) |
| `exercises/*` | Form, tabela e filtros de exercícios admin |
| `program/*` | Wizard de programas template admin |

---

## `components/clinic/`

| Arquivo | Para que serve |
|---------|----------------|
| `ClinicLayout.tsx` | Shell de páginas clinic |
| `ClinicSidebar.tsx` | Sidebar + nav principal |
| `ClinicUserDropdown.tsx` | Menu da conta (Popover claro) |
| `RequireClinicAdmin.tsx` | Guard de rota admin clinic |
| `ClinicLoaderError.tsx` | Estados loading/erro reutilizáveis |
| `agenda/*` | Calendário e modal de agendamento |
| `patient/*` | Formulários, drawers e modais de paciente |
| `program/*` | Wizard de programas de tratamento |
| `evolution-template/*` | Builder de templates de evolução |
| `questionnaire-template/*` | Builder de questionários |
| `ExerciseFilters.tsx` | Filtros da listagem de exercícios |

---

## `components/` (raiz)

| Arquivo | Para que serve |
|---------|----------------|
| `NavLink.tsx` | Link com estado ativo (legado; preferir react-router `NavLink`) |
| `ImageCropModal.tsx` | Recorte de imagem (foto perfil) |
| `ExerciseCardSkeleton.tsx` | Skeleton de card de exercício |

---

## Escolha rápida

| Preciso de… | Componente |
|-------------|------------|
| Listagem paginada | `DataTable` |
| Form 2+ campos | `Form` + RHF + Zod |
| Confirmar delete | `AlertDialog` |
| Modal editar | `Dialog` |
| Submenu na sidebar | `Popover` |
| Menu conta | `Popover` (ver `ClinicUserDropdown`) |
| CPF/CNPJ | `CpfCnpjInput` |
| Telefone | `PhoneInput` |
| Moeda | `MoneyInput` |
| URL clínica | `SlugInput` |
| Data | `Popover` + `Calendar` |
| Mobile nav | `Sheet` |
| Ícone com dica | `Tooltip` |
| Status na tabela | `StatusBadge` |

Detalhes de forms/listagens: [`forms-shadcn`](../../forms-shadcn/SKILL.md).
