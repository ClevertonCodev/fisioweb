# Components — shadcn + custom (fisioweb)

Componentes do projeto que merecem atenção. Forms RHF+Zod completos estão em [`frontend-ddd/references/forms.md`](../../frontend-ddd/references/forms.md).

## Form (shadcn + RHF)

Importa de `@/components/ui/form`. Wrappers oficiais:

```tsx
<Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                        <Input type="email" {...field} />
                    </FormControl>
                    <FormDescription>Usado para login.</FormDescription>
                    <FormMessage />   {/* mostra erro Zod automaticamente */}
                </FormItem>
            )}
        />
    </form>
</Form>
```

**Regras:**
- `<FormField>` exige `control={form.control}` e `name` (typed pelo schema).
- `<FormControl>` é o wrapper accessibility — sempre envolva o input nele.
- `<FormMessage />` exibe erro do Zod ou erro injetado via `form.setError`.

## Dialog (modal genérico)

```tsx
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
        <Button>Abrir</Button>
    </DialogTrigger>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Editar exercício</DialogTitle>
            <DialogDescription>Atualize os dados abaixo.</DialogDescription>
        </DialogHeader>
        {/* conteúdo */}
        <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

**Cuidado:**
- `DialogTrigger asChild` para não renderizar `<button>` duplicado.
- Modal grande pode quebrar mobile — use `className="max-w-3xl"` no `DialogContent`.

## AlertDialog (confirmar delete)

```tsx
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

<AlertDialog>
    <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive">
            <Trash2 className="h-4 w-4" />
        </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Excluir paciente?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. O paciente e suas sessões serão removidos.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(patient.id)}>
                Excluir
            </AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
```

**Quando usar AlertDialog vs Dialog:**
- `AlertDialog` para ação destrutiva irreversível (delete, descartar mudanças).
- `Dialog` para form ou conteúdo arbitrário.

## Select (Portal)

```tsx
<Select value={status} onValueChange={setStatus}>
    <SelectTrigger>
        <SelectValue placeholder="Selecione" />
    </SelectTrigger>
    <SelectContent>
        <SelectItem value="active">Ativo</SelectItem>
        <SelectItem value="inactive">Inativo</SelectItem>
    </SelectContent>
</Select>
```

**Pegadinhas:**
- Renderiza opções em Portal (`<body>`) — em testes, buscar via `getByRole('combobox')` e `getByRole('option')`.
- **Não use `<SelectItem value="">`** — vazio quebra o Radix. Use `"all"` ou outro placeholder.
- Para placeholder, use `<SelectValue placeholder="..." />`, não `<SelectItem value="" />`.

Dentro de RHF:

```tsx
<FormField
    control={form.control}
    name="status"
    render={({ field }) => (
        <FormItem>
            <FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
            </Select>
            <FormMessage />
        </FormItem>
    )}
/>
```

`<FormControl>` envolve `<SelectTrigger>` (não o `<Select>` todo).

## MoneyInput (custom)

`@/components/ui/money-input`. Trabalha com valor numérico, exibe formatado em BRL.

```tsx
<MoneyInput
    value={form.valueIsolated}
    onChange={(v) => setForm({ ...form, valueIsolated: v })}
    name="valueIsolated"
    placeholder="0,00"
/>
```

Em RHF:

```tsx
<FormField
    control={form.control}
    name="monthlyValue"
    render={({ field }) => (
        <FormItem>
            <FormLabel>Mensalidade</FormLabel>
            <FormControl>
                <MoneyInput value={field.value} onChange={field.onChange} name={field.name} />
            </FormControl>
            <FormMessage />
        </FormItem>
    )}
/>
```

**Zod schema** para campo de moeda:

```ts
monthlyValue: z.number().min(0, 'Valor não pode ser negativo'),
```

## CpfCnpjInput (custom)

`@/components/ui/cpf-cnpj-input`. Aplica máscara automática baseado em PF/PJ.

```tsx
<CpfCnpjInput
    typePerson={form.typePerson}        // 'PF' | 'PJ'
    value={form.document}
    onChange={(v) => setForm({ ...form, document: v })}
/>
```

Geralmente combinado com um Select `typePerson` (ver `ClinicNewPage`).

Validação no Zod:

```ts
document: z.string()
    .min(11, 'CPF/CNPJ inválido')
    .max(18, 'CPF/CNPJ inválido')
    .refine((v) => /^\d{11}$|^\d{14}$/.test(v.replace(/\D/g, '')), 'CPF/CNPJ inválido'),
```

## Calendar / Date Picker

shadcn `<Calendar>` + `<Popover>`:

```tsx
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

<Popover>
    <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP", { locale: ptBR }) : 'Selecione'}
        </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={date} onSelect={setDate} locale={ptBR} />
    </PopoverContent>
</Popover>
```

## Tooltip

```tsx
<Tooltip>
    <TooltipTrigger asChild>
        <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
        </Button>
    </TooltipTrigger>
    <TooltipContent>Editar</TooltipContent>
</Tooltip>
```

**Sempre `asChild`** no trigger — se omitir, Radix renderiza um `<button>` extra dentro do seu botão.

`<TooltipProvider>` já está no `App.tsx` raiz, não precisa envolver em cada uso.

## Toast (sonner)

Importa de `sonner`. Tipos: `toast.success`, `toast.error`, `toast.info`, `toast.warning`.

```tsx
import { toast } from 'sonner';

toast.success('Paciente criado com sucesso.');
toast.error('Erro ao salvar.');

// com descrição
toast.success('Salvo!', { description: 'Suas alterações foram persistidas.' });

// com ação
toast('Item arquivado', {
    action: { label: 'Desfazer', onClick: () => undoArchive() },
});
```

**Não chame `toast` manual em mutation** — os hooks de `application/use-<entities>.ts` já têm `toast.success` no `onSuccess` e `toast.error` no `onError`. Chamar manual duplica.

Use manual em ações **não cobertas** por hook (validação UI antes de chamar mutation, retry de impersonation, etc.).

## Loading patterns

### Skeleton (lista carregando)

```tsx
import { Skeleton } from '@/components/ui/skeleton';

{isLoading ? (
    <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
    </div>
) : (
    <DataTable ... />
)}
```

### Spinner inline (mutação)

```tsx
import { Loader2 } from 'lucide-react';

<Button disabled={mutation.isPending}>
    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    Salvar
</Button>
```

### Texto simples

```tsx
{isLoading ? (
    <p className="text-muted-foreground">Carregando...</p>
) : (
    <div>{/* conteúdo */}</div>
)}
```

Preferir Skeleton em listas e Loader2 em botões.

## Tokens Tailwind do projeto

Cores semânticas (mapeadas a CSS vars):

```
foreground          # texto principal
muted-foreground    # texto secundário
destructive         # vermelho (erro, delete)
primary             # azul (ações primárias)
secondary           # cinza
border              # borda neutra
card                # background de card
background          # background da página
accent              # hover background
```

**Use sempre tokens, nunca `text-red-500` direto.** Tema dark mode é controlado por essas vars.

Exemplos:
- Texto principal: `text-foreground`
- Texto secundário: `text-muted-foreground`
- Erro: `text-destructive`
- Borda destacada: `border-primary/40`
- Background de alerta: `bg-destructive/10`
- Ícone + hover: `text-muted-foreground hover:text-foreground`

## Spacing — padrões do projeto

- Page container: `<div className="space-y-6 p-4 md:p-6">`
- Section gap: `space-y-4`
- Form fields gap: `grid grid-cols-1 gap-4 md:grid-cols-2`
- Inline gap: `flex gap-2` (botões adjacentes), `flex gap-3` (mais aerado)
- Botão com ícone: `<Plus className="mr-2 h-4 w-4" />`
- Botão ícone-só: `<Button size="icon"><Pencil className="h-4 w-4" /></Button>`

## Header de página (padrão)

```tsx
<div className="flex items-center justify-between">
    <h1 className="text-foreground text-2xl font-semibold">Pacientes</h1>
    <Button onClick={() => navigate('/clinic/pacientes/novo')}>
        <Plus className="mr-2 h-4 w-4" />
        Novo Paciente
    </Button>
</div>
```

## Header de form Edit/New (com voltar)

```tsx
<div className="text-muted-foreground text-sm">
    <span className="cursor-pointer hover:underline" onClick={() => navigate('/clinic/pacientes')}>
        Pacientes
    </span>
    {' > '}
    <span className="text-foreground">Novo Paciente</span>
</div>

<div className="flex items-center gap-3">
    <Button variant="ghost" size="icon" onClick={() => navigate('/clinic/pacientes')}>
        <ArrowLeft className="h-5 w-5" />
    </Button>
    <h1 className="text-foreground text-2xl font-semibold">Novo Paciente</h1>
</div>
```

## Footer de form (cancelar + salvar)

```tsx
<hr className="border-border" />

<div className="flex justify-end gap-3">
    <Button
        type="button"
        variant="outline"
        onClick={() => navigate(-1)}
        disabled={mutation.isPending}
    >
        Cancelar
    </Button>
    <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Salvando...' : 'Salvar'}
    </Button>
</div>
```

## Checklist — UI

- [ ] Página envolvida em `<AdminLayout>` ou `<ClinicLayout>`.
- [ ] Header com título + ação primária (`<Plus />`).
- [ ] Filtros em `<Card>` com `<Label>` em cada campo.
- [ ] DataTable com columns no topo, `totalCount`, `emptyMessage`.
- [ ] Loading via Skeleton (lista) ou Loader2 (botão), nunca lib externa.
- [ ] Toasts via `sonner` (`toast.success`/`toast.error`) — **só** em ações sem hook.
- [ ] Tooltip em ícone-só com `TooltipTrigger asChild`.
- [ ] Cores via tokens Tailwind, nunca `text-red-500`.
- [ ] Spacing: `space-y-6 p-4 md:p-6` no container, `gap-4` em grids.
- [ ] Ícones de `lucide-react` (`Plus`, `Pencil`, `Trash2`, `ArrowLeft`, `Search`).
