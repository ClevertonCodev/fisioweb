# Hooks Patterns (fisioweb)

Padrões de hooks customizados aplicados ao SPA. Hooks de **servidor** vivem em `application/` (React Query). Hooks de **UI puro** vivem em `hooks/`.

## Anatomia de hook customizado tipado

```ts
// hooks/use-debounced-value.ts
import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const id = window.setTimeout(() => setDebounced(value), delayMs);
        return () => window.clearTimeout(id);
    }, [value, delayMs]);

    return debounced;
}
```

**Pontos:**
- Nome `useXxx`.
- Generic onde fizer sentido (`<T>`).
- Retorno tipado pelo TS (`: T`).
- Cleanup function no `useEffect` (cancela timer).
- Deps exaustivas — `[value, delayMs]`.

## Retorno tuple vs objeto

```ts
// ✅ 2 valores estáveis com ordem clara — tuple
export function useToggle(initial = false): [boolean, () => void] {
    const [on, setOn] = useState(initial);
    const toggle = useCallback(() => setOn((v) => !v), []);
    return [on, toggle];
}

// ✅ 3+ valores — objeto nomeado (não confundir ordem)
export function useDisclosure(initial = false): {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
} {
    const [isOpen, setIsOpen] = useState(initial);
    return {
        isOpen,
        open:   useCallback(() => setIsOpen(true), []),
        close:  useCallback(() => setIsOpen(false), []),
        toggle: useCallback(() => setIsOpen((v) => !v), []),
    };
}
```

## useEffect — quando usar (raro no SPA)

### NÃO use para:
- Buscar dados — use React Query (`useQuery` em `application/`).
- Sincronizar com state derivado — use `useMemo`.
- Sincronizar prop com state local — pense de novo, geralmente não precisa.

### USE para:
- Subscribe / listener em API externa (window, document, mediaQuery).
- Timer (`setTimeout`, `setInterval`).
- Integrar com lib não-React (gráfico, mapa, calendário externo).
- Sincronizar com `localStorage` (também `useSyncExternalStore` cabe).

### Cleanup é obrigatório quando há side effect que persiste

```ts
useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
}, []);
```

Sem cleanup, vaza memory + handler duplicado em re-mount (StrictMode mostra na dev).

## useSyncExternalStore — store externo

Quando um valor vem de fora do React (ex.: `localStorage`, mediaQuery, library):

```ts
// hooks/use-media-query.ts
import { useSyncExternalStore } from 'react';

function subscribe(query: string, cb: () => void) {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', cb);
    return () => mql.removeEventListener('change', cb);
}

export function useMediaQuery(query: string): boolean {
    return useSyncExternalStore(
        (cb) => subscribe(query, cb),
        () => window.matchMedia(query).matches,
        () => false, // SSR fallback — SPA usa, mas vite-ssr pode existir
    );
}
```

Vantagem: zero re-render extra, integração nativa com Concurrent Rendering.

## Custom hook que delega para React Query

Padrão dominante em `application/`. Use quando o consumidor não precisa saber que é React Query:

```ts
// application/clinic/use-patient.ts
import { useQuery } from '@tanstack/react-query';
import { apiClinicPatientsRepository } from '@/infrastructure/repositories';
import type { Patient } from '@/domain/clinic';

export function usePatient(id: number | undefined) {
    return useQuery<Patient | null>({
        queryKey: ['clinic', 'patient', id],
        queryFn: () => (id ? apiClinicPatientsRepository.getById(id) : Promise.resolve(null)),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,  // 5 min — paciente muda raramente
    });
}
```

Consumidor:

```tsx
const { data: patient, isLoading, error } = usePatient(patientId);
```

## Hook que orquestra múltiplas queries

```ts
// application/clinic/use-program-builder-data.ts
export function useProgramBuilderData(patientId: number) {
    const patientQuery = usePatient(patientId);
    const exercisesQuery = useExercises();
    const physioAreasQuery = usePhysioAreas();

    const isLoading =
        patientQuery.isLoading || exercisesQuery.isLoading || physioAreasQuery.isLoading;
    const error =
        patientQuery.error ?? exercisesQuery.error ?? physioAreasQuery.error;

    return {
        patient: patientQuery.data,
        exercises: exercisesQuery.data ?? [],
        physioAreas: physioAreasQuery.data ?? [],
        isLoading,
        error,
    };
}
```

Não chame `useQueries` se você precisa de tipos diferentes — agrupar manualmente é mais claro.

## useReducer — quando

Use quando o componente tem **3+ pedaços de estado correlacionados** que mudam juntos. Para filtros simples, `useState` basta.

```ts
type FilterState = {
    search: string;
    type: string;
    page: number;
    pageSize: number;
};

type FilterAction =
    | { type: 'setSearch'; value: string }
    | { type: 'setType'; value: string }
    | { type: 'goToPage'; page: number }
    | { type: 'clear' };

function filterReducer(state: FilterState, action: FilterAction): FilterState {
    switch (action.type) {
        case 'setSearch': return { ...state, search: action.value, page: 1 };
        case 'setType':   return { ...state, type: action.value, page: 1 };
        case 'goToPage':  return { ...state, page: action.page };
        case 'clear':     return { search: '', type: '', page: 1, pageSize: state.pageSize };
    }
}

// na page:
const [filters, dispatch] = useReducer(filterReducer, {
    search: '', type: '', page: 1, pageSize: 10,
});
```

Para filtros simples, prefira `useState` direto (como `FeatureListPage.tsx` faz). Não force `useReducer`.

## useCallback — quando rende ganho

```tsx
// ❌ Sem useCallback, cria função nova a cada render
<ExpensiveChild onClick={() => doSomething(id)} />

// ✅ Se ExpensiveChild é memo-izado e a função entra como dep
const handleClick = useCallback(() => doSomething(id), [id]);
<ExpensiveChild onClick={handleClick} />
```

**Não use `useCallback` "por garantia"**. Se o filho não é `memo`, criar função nova a cada render é mais barato que rodar `useCallback`.

## useMemo — quando rende ganho

```tsx
// ✅ Cálculo derivado caro sobre array grande
const filtered = useMemo(
    () => features.filter((f) =>
        f.name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name)),
    [features, search],
);

// ❌ Trivial — `useMemo` é mais caro que a operação
const doubled = useMemo(() => count * 2, [count]); // só use count * 2 direto
```

Regra: se a operação roda em < 0.1ms, não vale `useMemo`.

## useImperativeHandle — ref custom para componente

Útil em form complexo: o pai precisa chamar `child.focus()` ou `child.reset()`.

```tsx
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

export interface ExerciseFormHandle {
    reset: () => void;
    submit: () => void;
}

interface ExerciseFormProps {
    onSubmit: (data: ExerciseFormValues) => void;
}

export const ExerciseForm = forwardRef<ExerciseFormHandle, ExerciseFormProps>(
    function ExerciseForm({ onSubmit }, ref) {
        const formRef = useRef<HTMLFormElement>(null);
        const [values, setValues] = useState<ExerciseFormValues>(emptyValues);

        useImperativeHandle(ref, () => ({
            reset:  () => setValues(emptyValues),
            submit: () => formRef.current?.requestSubmit(),
        }), []);

        return (
            <form ref={formRef} onSubmit={() => onSubmit(values)}>
                {/* fields */}
            </form>
        );
    },
);
```

Cuidado: vaza implementação. Use só quando event-callback não resolve.

## Anti-padrões comuns

### 1. Effect para sincronizar prop com state

```tsx
// ❌ leva a bugs de stale state
function ExerciseRow({ exercise }: { exercise: Exercise }) {
    const [name, setName] = useState(exercise.name);
    useEffect(() => setName(exercise.name), [exercise.name]);
    // ...
}

// ✅ derive direto da prop ou use key para remontar
function ExerciseRow({ exercise }: { exercise: Exercise }) {
    // se precisa editar local, separe em sub-componente com key={exercise.id}
}
```

### 2. State derivado em useState

```tsx
// ❌ duplica fonte da verdade
const [filtered, setFiltered] = useState<Feature[]>([]);
useEffect(() => setFiltered(features.filter(...)), [features, search]);

// ✅ derive com useMemo
const filtered = useMemo(() => features.filter(...), [features, search]);
```

### 3. Effect para data fetching

```tsx
// ❌ refaz fetch a cada mount, sem cache
useEffect(() => {
    fetch('/api/clinic/exercises').then((r) => r.json()).then(setExercises);
}, []);

// ✅ hook React Query em application/
const { data: exercises } = useExercises();
```

### 4. setState dentro de render

```tsx
// ❌ infinite loop garantido
function Comp({ value }: { value: number }) {
    const [doubled, setDoubled] = useState(0);
    setDoubled(value * 2); // ❌
    return <div>{doubled}</div>;
}

// ✅ derive
function Comp({ value }: { value: number }) {
    const doubled = value * 2;
    return <div>{doubled}</div>;
}
```

### 5. Closure stale em event handler

```tsx
// ❌ `count` capturado no primeiro render
useEffect(() => {
    const id = setInterval(() => console.log(count), 1000);
    return () => clearInterval(id);
}, []); // dep faltando

// ✅ deps exaustivas OU useRef
useEffect(() => {
    const id = setInterval(() => console.log(count), 1000);
    return () => clearInterval(id);
}, [count]);
```

## Checklist — hook customizado

- [ ] Nome `useXxx`.
- [ ] Generic onde aplicar (`<T>`).
- [ ] Retorno tipado explicitamente.
- [ ] Tuple `[a, b]` se 2 valores ordenados; objeto se 3+.
- [ ] Deps de useEffect/useMemo/useCallback exaustivas (eslint cobre).
- [ ] Cleanup em useEffect quando há subscribe/listener/timer.
- [ ] Sem `useEffect` para "buscar dados de servidor" — use React Query.
- [ ] Hook em `application/` se delega a Repository; em `hooks/` se é puro UI.
- [ ] Não vaza implementação interna no retorno (evite expor refs internas).
