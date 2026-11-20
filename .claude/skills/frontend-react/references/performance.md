# Performance (fisioweb)

Otimizações React aplicáveis ao SPA. **Meça antes de otimizar.** Sem causa identificada, `memo`/`useCallback`/`useMemo` viram ruído.

## Pirâmide de prioridade

1. **Estrutura** — não faça trabalho desnecessário. Cancela render inteiro com `enabled` no React Query, com `key` para reset, com lazy route.
2. **Cache** — React Query já cacheia por `queryKey`. Aumente `staleTime` em dados que mudam pouco (catálogos, opções de form).
3. **`useMemo`** — para cálculos derivados caros (filter+sort+slice sobre array grande).
4. **`React.memo` + `useCallback`** — para componentes de lista renderizados em loop com props estáveis.
5. **Suspense + `lazy()`** — para rotas pesadas.
6. **`useDeferredValue` / `useTransition`** — para reagir a input em lista grande.

## Quando `useMemo` rende ganho

Real do projeto (`FeatureListPage.tsx`):

```tsx
const filtered = useMemo(() => {
    return features.filter((f) => {
        const matchesSearch =
            !appliedSearch ||
            String(f.id).includes(appliedSearch) ||
            f.key.toLowerCase().includes(appliedSearch.toLowerCase()) ||
            f.name.toLowerCase().includes(appliedSearch.toLowerCase());
        const matchesType = appliedType === 'all' || f.type === appliedType;
        return matchesSearch && matchesType;
    });
}, [features, appliedSearch, appliedType]);

const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
}, [filtered, currentPage, pageSize]);
```

**Critério:** array > 100 itens com filter/sort/map encadeados. Para 5-20 itens, não rende ganho.

## Quando `React.memo` rende ganho

Linha de tabela renderizada N vezes com props estáveis:

```tsx
import { memo } from 'react';

interface ExerciseRowProps {
    exercise: AdminExercise;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}

export const ExerciseRow = memo(function ExerciseRow({
    exercise,
    onEdit,
    onDelete,
}: ExerciseRowProps) {
    return (
        <TableRow>
            <TableCell>{exercise.name}</TableCell>
            <TableCell>{exercise.physio_area?.name}</TableCell>
            <TableCell>
                <Button onClick={() => onEdit(exercise.id)}>Editar</Button>
                <Button onClick={() => onDelete(exercise.id)}>Excluir</Button>
            </TableCell>
        </TableRow>
    );
});
```

**Pra valer:** as props devem ser estáveis. Como `onEdit`/`onDelete` são funções, **precisam vir de `useCallback` no pai**:

```tsx
const handleEdit = useCallback((id: number) => navigate(`/admin/exercises/${id}/editar`), [navigate]);
const handleDelete = useCallback((id: number) => deleteMutation.mutate(id), [deleteMutation]);

{exercises.map((ex) => (
    <ExerciseRow key={ex.id} exercise={ex} onEdit={handleEdit} onDelete={handleDelete} />
))}
```

Sem `useCallback`, o `memo` quebra a cada render do pai.

**Comparador custom** (raro):

```tsx
export const ExerciseRow = memo(
    function ExerciseRow(props) { /* ... */ },
    (prev, next) => prev.exercise.id === next.exercise.id && prev.exercise.name === next.exercise.name,
);
```

Use só quando shallow compare não basta.

## `useDeferredValue` — input em lista grande

Cenário: usuário digita filtro em lista de 1000 exercícios e UI trava entre keystrokes.

```tsx
import { useDeferredValue, useMemo, useState } from 'react';

export default function ExerciseList({ exercises }: { exercises: AdminExercise[] }) {
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);

    const filtered = useMemo(
        () => exercises.filter((ex) =>
            ex.name.toLowerCase().includes(deferredSearch.toLowerCase())
        ),
        [exercises, deferredSearch],
    );

    const isStale = search !== deferredSearch;

    return (
        <>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className={isStale ? 'opacity-60 transition-opacity' : ''}>
                {filtered.map((ex) => <ExerciseRow key={ex.id} exercise={ex} />)}
            </div>
        </>
    );
}
```

`search` atualiza imediato (input responsivo); `deferredSearch` atualiza com prioridade baixa (filter sem travar).

## `useTransition` — navegação / mudança pesada

```tsx
import { useTransition } from 'react';

const [isPending, startTransition] = useTransition();

const handleTabChange = (newTab: string) => {
    startTransition(() => {
        setActiveTab(newTab);  // re-render pesado vai pra fila de baixa prioridade
    });
};

return (
    <Tabs onChange={handleTabChange}>
        {isPending && <Spinner />}
        {/* ... */}
    </Tabs>
);
```

Útil para troca de aba pesada (mudança de modo de visualização, abrir dashboard com gráficos).

## Code splitting com `React.lazy` + `Suspense`

Rotas grandes que poucos usuários abrem (relatórios, configurações avançadas):

```tsx
// routes/clinic/report-routes.tsx
import { lazy, Suspense, type RouteObject } from 'react';

const ReportDashboard = lazy(() => import('@/pages/clinic/report/ReportDashboardPage'));

export const reportRoutes: RouteObject[] = [
    {
        path: 'relatorios',
        element: (
            <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando...</div>}>
                <ReportDashboard />
            </Suspense>
        ),
    },
];
```

**Não** faça lazy para rotas que carregam logo após o login. O delay extra de fetch incomoda mais que o bundle inicial.

## Error Boundary — proteger rota/seção

React 19 não tem hook nativo; use classe:

```tsx
// components/error-boundary.tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback: (error: Error, reset: () => void) => ReactNode;
}

interface State {
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('UI error', error, info);
    }

    private reset = () => this.setState({ error: null });

    render() {
        if (this.state.error) {
            return this.props.fallback(this.state.error, this.reset);
        }
        return this.props.children;
    }
}
```

Uso por rota (no `routes/<contexto>-routes.tsx`):

```tsx
{
    path: 'programas',
    element: (
        <ErrorBoundary
            fallback={(err, reset) => (
                <div className="space-y-4 p-8">
                    <h2 className="text-lg font-semibold text-destructive">Algo deu errado</h2>
                    <p className="text-muted-foreground text-sm">{err.message}</p>
                    <Button onClick={reset}>Tentar novamente</Button>
                </div>
            )}
        >
            <ProgramsPage />
        </ErrorBoundary>
    ),
},
```

React Router v6 também tem `errorElement` no `RouteObject` — use para erros vindos do `loader`.

## Caminho de `import()` que o Vite analisa

O Vite (Rollup no build) decide os chunks olhando os `import()`. Caminho vindo de variável ele não analisa: inclui arquivos demais ou o import funciona no `npm run dev` e quebra no build. Deixe o conjunto explícito, com um mapa de `import()` literal ou `import.meta.glob` com padrão fixo.

```tsx
// ❌ o caminho só existe em tempo de execução
const SECTIONS = { agenda: './sections/agenda-section', financeiro: './sections/finance-section' };
const load = (key: keyof typeof SECTIONS) => import(SECTIONS[key]);

// ✅ cada entrada vira um chunk que o Vite conhece (envolva com <Suspense>)
const SECTIONS = {
    agenda: lazy(() => import('./sections/agenda-section')),
    financeiro: lazy(() => import('./sections/finance-section')),
};
```

Muitos arquivos com o mesmo padrão: `import.meta.glob('./icons/*.svg', { eager: true, import: 'default' })`. Sem `eager`, cada entrada vira um `() => import()` sob demanda.

## Dicas de recurso do `react-dom`

`preconnect`, `prefetchDNS` e `preload` do `react-dom`, chamados durante o render, viram `<link>` no `<head>` e adiantam conexão ou download. O React deduplica, então chamar de novo é seguro.

- **`preconnect`** para o domínio de mídia (o CDN das imagens e vídeos de exercício) numa tela que vai mostrar mídia logo em seguida, como a biblioteca de exercícios ou o programa do paciente.
- **`preload(url, { as: 'image', fetchPriority: 'high' })`** para a imagem principal da tela, assim que a URL chega da API.

```tsx
import { preconnect, preload } from 'react-dom';

function ExerciseHero({ exercise }: { exercise: Exercise }) {
    preconnect(new URL(exercise.coverUrl).origin);
    preload(exercise.coverUrl, { as: 'image', fetchPriority: 'high' });
    return <img src={exercise.coverUrl} alt={exercise.name} fetchPriority="high" />;
}
```

Não precisa para a própria API (mesmo domínio, conexão aberta) nem para fontes empacotadas pelo Vite (nome com hash muda a cada build).

## Lista virtualizada

Para tabelas com 1000+ rows visíveis (raro no projeto, mas relevante em listas de pacientes/sessões), use [`@tanstack/react-virtual`](https://tanstack.com/virtual). Não está instalado hoje — discutir antes de adicionar.

## React DevTools Profiler — antes de qualquer otimização

1. Abra React DevTools → tab "Profiler".
2. Clique no record, faça a ação lenta, pare.
3. Olhe **"Why did this render"** — geralmente é prop nova (função inline) ou context atualizando.
4. Aplique `memo`/`useCallback` **só** nos componentes que aparecem caros no flame graph.

**Sem profile, qualquer otimização é palpite.**

## Anti-padrões

### 1. `useCallback` em tudo

```tsx
// ❌ filho não é memo, sem ganho
const handleClick = useCallback(() => alert('hi'), []);
<button onClick={handleClick}>Click</button>
```

### 2. `useMemo` em valor trivial

```tsx
// ❌ useMemo é mais caro que `count * 2`
const doubled = useMemo(() => count * 2, [count]);
```

### 3. `memo` em componente que sempre re-renderiza

```tsx
// ❌ pai passa objeto novo a cada render → memo nunca economiza
<Child config={{ x: 1 }} />
```

Corrigir extraindo o objeto pra fora ou usando `useMemo`.

### 4. Lazy load sem Suspense fallback

```tsx
// ❌ tela em branco enquanto baixa o chunk
const Page = lazy(() => import('./Page'));
return <Page />;
```

### 5. `React.memo` no componente raiz

```tsx
// ❌ raiz sempre re-renderiza por mudança do roteador/contexto
export default memo(AdminLayout);
```

### 6. Componente declarado dentro de componente

```tsx
// ❌ PatientCard cria um tipo novo de Avatar a cada render: o React remonta do zero
function PatientCard({ patient }: { patient: Patient }) {
    const Avatar = () => <img src={patient.photoUrl} alt={patient.name} />;
    return <Avatar />;
}

// ✅ componente no nível do módulo, recebendo props
function PatientAvatar({ src, name }: { src: string; name: string }) {
    return <img src={src} alt={name} />;
}
```

Sintomas: campo perde o foco a cada tecla (comum com React Hook Form num componente interno), animação recomeça, efeito faz limpeza e setup a cada render do pai, rolagem volta ao topo. Função que só devolve JSX e é **chamada** (`{renderDetails()}`) não tem o problema; se crescer, vira componente.

### 7. Um hook fazendo tarefas independentes

```tsx
// ❌ trocar a ordenação refaz o filtro
const sorted = useMemo(
    () => sessions.filter((s) => s.status === status).toSorted(byDate(order)),
    [sessions, status, order],
);

// ✅ cada passo só roda quando as dependências dele mudam
const filtered = useMemo(() => sessions.filter((s) => s.status === status), [sessions, status]);
const sorted = useMemo(() => filtered.toSorted(byDate(order)), [filtered, order]);
```

O mesmo vale para `useEffect` que junta dois efeitos sem relação: um efeito por tarefa. Só vale a separação quando uma das partes é cara.

## Checklist — antes de otimizar

- [ ] Tenho prova (DevTools Profiler) de que o componente está lento?
- [ ] A lentidão é renderização ou fetch? (fetch resolve com React Query)
- [ ] Posso reduzir trabalho cancelando render inteiro (lazy, key, enabled)?
- [ ] O `memo` que vou colocar tem props estáveis (deps controladas, funções memoizadas)?
- [ ] O `useMemo` cobre cálculo > 0.1ms sobre array > 100 itens?
- [ ] Posso usar `useDeferredValue` para "UI responsiva sem travar render pesado"?
- [ ] Se rota raramente acessada, faz sentido `lazy()`?
- [ ] Algum componente está declarado dentro de outro (remonta a cada render)?
- [ ] O `import()` tem caminho literal (ou `import.meta.glob`), não vindo de variável?
