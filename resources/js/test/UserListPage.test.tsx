import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import {
    MemoryRouter,
    Route,
    Routes,
    useLocation,
    useNavigate,
} from 'react-router-dom';
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';
import { UserListPage } from '@/pages/clinic/user/UserListPage';
import { routerFutureFlags } from '@/test/browser-router';

const listUsers = vi.fn();
const updateUser = vi.fn();
const destroyUser = vi.fn();
const listPatients = vi.fn();
const listPrograms = vi.fn();
const listAppointments = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('@/infrastructure/repositories/api-clinic-users', () => ({
    apiClinicUsersRepository: {
        list: (...args: unknown[]) => listUsers(...args),
        update: (...args: unknown[]) => updateUser(...args),
        destroy: (...args: unknown[]) => destroyUser(...args),
    },
}));

vi.mock('@/infrastructure/repositories/api-clinic-patients', () => ({
    apiClinicPatientsRepository: {
        list: (...args: unknown[]) => listPatients(...args),
    },
}));

vi.mock('@/infrastructure/repositories', () => ({
    apiClinicProgramsRepository: {
        list: (...args: unknown[]) => listPrograms(...args),
    },
    apiClinicAppointmentsRepository: {
        list: (...args: unknown[]) => listAppointments(...args),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        success: (...args: unknown[]) => toastSuccess(...args),
        error: (...args: unknown[]) => toastError(...args),
    },
}));

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

function makeUser(
    id: string,
    overrides: Partial<ClinicUserSummary> = {},
): ClinicUserSummary {
    return {
        id,
        name: `Pessoa ${id}`,
        email: `pessoa${id}@example.com`,
        role: 'physiotherapist',
        mestre: 0,
        status: 1,
        googleConnected: false,
        twoFactorEnabled: false,
        ...overrides,
    };
}

const MASTER = makeUser('1', { name: 'Mestre Ana', role: 'admin', mestre: 1 });

function LocationProbe() {
    const location = useLocation();
    const navigate = useNavigate();
    return (
        <>
            <output aria-label="url atual">{location.search}</output>
            <output aria-label="rota atual">{location.pathname}</output>
            <button type="button" onClick={() => navigate(-1)}>
                voltar do navegador
            </button>
        </>
    );
}

function renderPage(url: string | string[] = '/clinica/usuarios') {
    const entries = Array.isArray(url) ? url : [url];
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={entries}
                initialIndex={entries.length - 1}
                future={routerFutureFlags}
            >
                <Routes>
                    <Route
                        path="/clinica/usuarios"
                        element={
                            <>
                                <UserListPage />
                                <LocationProbe />
                            </>
                        }
                    />
                    <Route
                        path="*"
                        element={
                            <>
                                <p>Outra tela</p>
                                <LocationProbe />
                            </>
                        }
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

// Sondas do teste. Por seletor: com a gaveta ou o modal aberto, o resto da
// tela fica aria-hidden e o nome acessível delas some.
function probe(label: string) {
    const el = document.querySelector(`output[aria-label="${label}"]`);
    if (!el) throw new Error(`sonda "${label}" não encontrada`);
    return el.textContent;
}

function currentSearch() {
    return probe('url atual');
}

function currentPath() {
    return probe('rota atual');
}

function usersList() {
    return screen.getByRole('list', { name: 'Usuários' });
}

async function cardOf(name: string) {
    const list = await screen.findByRole('list', { name: 'Usuários' });
    return within(list).getByText(name).closest('li') as HTMLElement;
}

beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        })),
    });
});

beforeEach(() => {
    listUsers.mockResolvedValue([
        MASTER,
        makeUser('2', {
            name: 'Bruno Lima',
            googleConnected: true,
            photoUrl: 'https://cdn.example.com/bruno.jpg',
        }),
        makeUser('3', { name: 'Carla Dias', role: 'secretary', status: 0 }),
    ]);
    listPatients.mockResolvedValue({
        data: [
            { id: 'p1', name: 'X', professional: 'Bruno Lima' },
            { id: 'p2', name: 'Y', professional: 'Bruno Lima' },
            { id: 'p3', name: 'Z', professional: 'Outro' },
        ],
        total: 3,
        lastPage: 1,
        perPage: 200,
        currentPage: 1,
    });
    listPrograms.mockResolvedValue({
        items: [{ id: 'g1', professionalId: '2' }],
        total: 1,
    });
    listAppointments.mockResolvedValue([
        { id: 'a1', clinicUserId: '2', status: 'scheduled' },
        { id: 'a2', clinicUserId: '2', status: 'cancelled' },
        { id: 'a3', clinicUserId: '2', status: 'confirmed' },
    ]);
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('UserListPage: cartões e resumo', () => {
    it('mostra a equipe em cartões, com função, status e Google Agenda', async () => {
        renderPage();

        const bruno = await cardOf('Bruno Lima');
        expect(
            within(bruno).getByText('pessoa2@example.com'),
        ).toBeInTheDocument();
        expect(within(bruno).getByText('Fisioterapeuta')).toBeInTheDocument();
        expect(within(bruno).getByText('Ativo')).toBeInTheDocument();
        expect(within(bruno).getByText('Google Agenda')).toBeInTheDocument();

        const carla = await cardOf('Carla Dias');
        expect(within(carla).getByText('Inativo')).toBeInTheDocument();
        expect(
            within(carla).getByText('Sem Google Agenda'),
        ).toBeInTheDocument();
        expect(carla.querySelector('[data-inactive]')).toHaveClass(
            'opacity-70',
        );
        expect(bruno.querySelector('[data-inactive]')).toBeNull();
        expect(bruno.firstElementChild).not.toHaveClass('opacity-70');
        // Sem foto, a inicial; com foto, a imagem.
        expect(within(carla).getByText('C')).toBeInTheDocument();
        expect(carla.querySelector('img')).toBeNull();
        expect(bruno.querySelector('img')).toHaveAttribute(
            'src',
            'https://cdn.example.com/bruno.jpg',
        );

        const master = await cardOf('Mestre Ana');
        expect(within(master).getByLabelText('Mestre')).toBeInTheDocument();
    });

    it('não mostra nada de verificação em duas etapas (ADR 019)', async () => {
        renderPage();
        await cardOf('Bruno Lima');
        expect(screen.queryByText(/duas etapas/i)).not.toBeInTheDocument();
    });

    it('resumo do cabeçalho conta pessoas e ativas', async () => {
        renderPage();
        expect(
            await screen.findByText('3 pessoas na equipe · 2 ativas'),
        ).toBeInTheDocument();
    });

    it('mestre vem primeiro, depois por nome', async () => {
        renderPage();
        await cardOf('Bruno Lima');
        const names = within(usersList())
            .getAllByRole('listitem')
            .map((li) => li.textContent);
        expect(names[0]).toContain('Mestre Ana');
        expect(names[1]).toContain('Bruno Lima');
        expect(names[2]).toContain('Carla Dias');
    });

    it('a sanfona mostra a contagem do recorte e abre as capacidades', async () => {
        const user = userEvent.setup();
        renderPage('/clinica/usuarios?status=ativos');
        await cardOf('Bruno Lima');

        const roles = screen.getByRole('complementary', {
            name: 'Funções do sistema',
        });
        const secretary = within(roles).getByRole('button', {
            name: /Secretário\(a\)/,
        });
        expect(secretary).toHaveTextContent('0 pessoas');
        expect(
            within(roles).getByRole('button', { name: /Fisioterapeuta/ }),
        ).toHaveTextContent('1 pessoa');

        await user.click(secretary);
        expect(secretary).toHaveAttribute('aria-expanded', 'true');
        expect(
            within(roles).getByText('Gerenciar a equipe'),
        ).toBeInTheDocument();
    });

    it('Novo usuário leva para a tela de cadastro', async () => {
        const user = userEvent.setup();
        renderPage();
        await cardOf('Bruno Lima');

        await user.click(screen.getByRole('button', { name: 'Novo usuário' }));

        expect(currentPath()).toBe('/clinica/usuarios/novo');
    });
});

describe('UserListPage: busca e filtros na URL', () => {
    it('abre com o recorte da URL nos filtros e nos chips', async () => {
        renderPage(
            '/clinica/usuarios?q=bru&funcao=physiotherapist&status=ativos',
        );

        expect(
            await screen.findByRole('searchbox', { name: /pesquisar/i }),
        ).toHaveValue('bru');
        const chips = screen.getByRole('list', { name: 'Filtros aplicados' });
        expect(chips).toHaveTextContent('Função: Fisioterapeuta');
        expect(chips).toHaveTextContent('Status: Só ativos');
        await waitFor(() =>
            expect(within(usersList()).getAllByRole('listitem')).toHaveLength(
                1,
            ),
        );
        expect(usersList()).toHaveTextContent('Bruno Lima');
    });

    it('valor inválido na URL cai no padrão e não vira chip', async () => {
        renderPage('/clinica/usuarios?funcao=foo&status=xyz');
        await cardOf('Bruno Lima');
        expect(
            screen.queryByRole('list', { name: 'Filtros aplicados' }),
        ).not.toBeInTheDocument();
        expect(screen.getByText('Nenhum filtro aplicado')).toBeInTheDocument();
        expect(within(usersList()).getAllByRole('listitem')).toHaveLength(3);
    });

    it('digitar na busca grava q na URL depois do debounce', async () => {
        const user = userEvent.setup();
        renderPage();
        await cardOf('Bruno Lima');

        await user.type(
            screen.getByRole('searchbox', { name: /pesquisar/i }),
            'carla',
        );

        await waitFor(() => expect(currentSearch()).toBe('?q=carla'));
        expect(within(usersList()).getAllByRole('listitem')).toHaveLength(1);
    });

    it('a URL mudando por fora (voltar do navegador) atualiza o campo', async () => {
        const user = userEvent.setup();
        renderPage(['/clinica/usuarios?q=ana', '/clinica/usuarios?q=bia']);
        const box = await screen.findByRole('searchbox', {
            name: /pesquisar/i,
        });
        expect(box).toHaveValue('bia');

        await user.click(
            screen.getByRole('button', { name: 'voltar do navegador' }),
        );

        await waitFor(() => expect(box).toHaveValue('ana'));
    });

    it('filtrar não cria passo no histórico: voltar sai da lista', async () => {
        const user = userEvent.setup();
        renderPage(['/clinica', '/clinica/usuarios']);
        await cardOf('Bruno Lima');

        await user.click(screen.getByRole('button', { name: 'Status' }));
        await user.click(
            await screen.findByRole('menuitemradio', { name: 'Só ativos' }),
        );
        await waitFor(() => expect(currentSearch()).toBe('?status=ativos'));

        await user.click(
            screen.getByRole('button', { name: 'voltar do navegador' }),
        );

        await waitFor(() => expect(currentPath()).toBe('/clinica'));
    });

    it('sair antes do debounce leva a busca junto: o voltar a encontra', async () => {
        const user = userEvent.setup();
        renderPage();
        await cardOf('Bruno Lima');

        await user.type(
            screen.getByRole('searchbox', { name: /pesquisar/i }),
            'car',
        );
        await user.click(screen.getByRole('button', { name: 'Novo usuário' }));
        expect(currentPath()).toBe('/clinica/usuarios/novo');

        await user.click(
            screen.getByRole('button', { name: 'voltar do navegador' }),
        );
        await waitFor(() => expect(currentSearch()).toBe('?q=car'));
    });

    it('marcar uma função no dropdown grava na URL', async () => {
        const user = userEvent.setup();
        renderPage();
        await cardOf('Bruno Lima');

        await user.click(screen.getByRole('button', { name: 'Função' }));
        await user.click(
            await screen.findByRole('menuitemcheckbox', {
                name: 'Secretário(a)',
            }),
        );

        await waitFor(() => expect(currentSearch()).toBe('?funcao=secretary'));
    });

    it('escolher o status no dropdown grava na URL', async () => {
        const user = userEvent.setup();
        renderPage();
        await cardOf('Bruno Lima');

        await user.click(screen.getByRole('button', { name: 'Status' }));
        await user.click(
            await screen.findByRole('menuitemradio', { name: 'Só inativos' }),
        );

        await waitFor(() => expect(currentSearch()).toBe('?status=inativos'));
    });

    it('remover um chip limpa só aquele filtro', async () => {
        const user = userEvent.setup();
        renderPage('/clinica/usuarios?funcao=admin,secretary&status=ativos');

        await user.click(
            await screen.findByRole('button', {
                name: /remover filtro função: administrador/i,
            }),
        );

        await waitFor(() =>
            expect(currentSearch()).toBe('?funcao=secretary&status=ativos'),
        );
    });

    it('Limpar zera função e status e mantém a busca', async () => {
        const user = userEvent.setup();
        renderPage('/clinica/usuarios?q=a&funcao=admin&status=ativos');
        await cardOf('Mestre Ana');

        await user.click(
            screen.getByRole('button', { name: 'Limpar filtros' }),
        );

        await waitFor(() => expect(currentSearch()).toBe('?q=a'));
    });

    it('no celular, a gaveta de filtros mostra a contagem e aplica', async () => {
        const user = userEvent.setup();
        renderPage('/clinica/usuarios?status=ativos');
        await cardOf('Bruno Lima');

        await user.click(screen.getByRole('button', { name: 'Filtros (1)' }));
        const drawer = await screen.findByRole('dialog', { name: 'Filtros' });
        await user.click(
            within(drawer).getByRole('checkbox', { name: 'Administrador' }),
        );

        await waitFor(() =>
            expect(currentSearch()).toBe('?funcao=admin&status=ativos'),
        );
        await user.click(
            within(drawer).getByRole('button', { name: 'Ver 1 pessoa' }),
        );
        await waitFor(() =>
            expect(
                screen.queryByRole('dialog', { name: 'Filtros' }),
            ).not.toBeInTheDocument(),
        );
    });
});

describe('UserListPage: estados', () => {
    it('mostra o esqueleto enquanto carrega', () => {
        listUsers.mockReturnValue(new Promise(() => {}));
        renderPage();
        expect(
            screen.getByLabelText('Carregando usuários'),
        ).toBeInTheDocument();
        // Sem números enquanto a equipe não chegou.
        expect(screen.queryByText(/0 pessoas/)).not.toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'Usuários', level: 2 }),
        ).toHaveTextContent(/^Usuários$/);
    });

    it('erro da API mostra o estado de erro, não "nenhum usuário"', async () => {
        listUsers.mockRejectedValue(new Error('500'));
        renderPage();
        expect(
            await screen.findByText('Erro ao carregar a equipe'),
        ).toBeInTheDocument();
        expect(
            screen.queryByText(/ninguém encontrado/i),
        ).not.toBeInTheDocument();
        expect(screen.queryByText(/0 pessoas/)).not.toBeInTheDocument();
    });

    it('ninguém no recorte: mensagem e botão que limpa busca e filtros', async () => {
        const user = userEvent.setup();
        renderPage('/clinica/usuarios?q=zzz&funcao=admin');

        expect(
            await screen.findByText('Ninguém encontrado'),
        ).toBeInTheDocument();
        await user.click(
            screen.getByRole('button', { name: 'Limpar busca e filtros' }),
        );

        await waitFor(() => expect(currentSearch()).toBe(''));
        expect(
            screen.getByRole('searchbox', { name: /pesquisar/i }),
        ).toHaveValue('');
    });

    it('Limpar busca e filtros também descarta a busca que ainda não foi para a URL', async () => {
        const user = userEvent.setup();
        renderPage('/clinica/usuarios?funcao=secretary&status=ativos');
        expect(
            await screen.findByText('Ninguém encontrado'),
        ).toBeInTheDocument();

        await user.type(
            screen.getByRole('searchbox', { name: /pesquisar/i }),
            'ab',
        );
        await user.click(
            screen.getByRole('button', { name: 'Limpar busca e filtros' }),
        );

        await waitFor(() => expect(currentSearch()).toBe(''));
        await new Promise((r) => setTimeout(r, 500));
        expect(currentSearch()).toBe('');
        expect(
            screen.getByRole('searchbox', { name: /pesquisar/i }),
        ).toHaveValue('');
    });

    it('clínica só com o admin convida a cadastrar a equipe', async () => {
        const user = userEvent.setup();
        listUsers.mockResolvedValue([MASTER]);
        renderPage();

        expect(
            await screen.findByText('Cadastre a sua equipe'),
        ).toBeInTheDocument();
        await user.click(
            screen.getByRole('button', { name: 'Cadastrar o primeiro colega' }),
        );
        expect(currentPath()).toBe('/clinica/usuarios/novo');
    });

    it('com busca, a clínica só com o admin não mostra o convite', async () => {
        listUsers.mockResolvedValue([MASTER]);
        renderPage('/clinica/usuarios?q=mestre');
        await cardOf('Mestre Ana');
        expect(
            screen.queryByText('Cadastre a sua equipe'),
        ).not.toBeInTheDocument();
    });
});

describe('UserListPage: drawer', () => {
    it('clicar no cartão abre o drawer com e-mail, carga e Editar', async () => {
        const user = userEvent.setup();
        renderPage('/clinica/usuarios?q=bru');

        await user.click(
            await screen.findByRole('button', { name: 'Ver Bruno Lima' }),
        );

        const drawer = await screen.findByRole('dialog', {
            name: 'Bruno Lima',
        });
        expect(
            within(drawer).getByText('pessoa2@example.com'),
        ).toBeInTheDocument();
        // 2 pacientes pelo nome, 1 programa, 2 consultas não canceladas.
        await waitFor(() =>
            expect(
                within(drawer).getByText('Pacientes').nextSibling,
            ).toHaveTextContent('2'),
        );
        expect(
            within(drawer).getByText('Programas').nextSibling,
        ).toHaveTextContent('1');
        expect(
            within(drawer).getByText('Agenda da semana').nextSibling,
        ).toHaveTextContent('2');

        await user.click(
            within(drawer).getByRole('button', { name: 'Editar' }),
        );

        expect(currentPath()).toBe('/clinica/usuarios/2/editar');
    });

    it('a lista não espera a carga do drawer', async () => {
        listPatients.mockReturnValue(new Promise(() => {}));
        listPrograms.mockReturnValue(new Promise(() => {}));
        listAppointments.mockReturnValue(new Promise(() => {}));
        renderPage();
        expect(await cardOf('Bruno Lima')).toBeInTheDocument();
        expect(listPatients).not.toHaveBeenCalled();
    });
});

async function openRoleMenu(name: string) {
    const user = userEvent.setup();
    await user.click(
        await screen.findByRole('button', { name: `Mudar função de ${name}` }),
    );
    return user;
}

describe('UserListPage: mudar função', () => {
    it('o modal mostra origem, destino e o que muda; Cancelar não grava', async () => {
        renderPage();
        const user = await openRoleMenu('Bruno Lima');
        await user.click(
            await screen.findByRole('menuitemradio', { name: 'Secretário(a)' }),
        );

        const dialog = await screen.findByRole('dialog', {
            name: 'Mudar função',
        });
        expect(dialog).toHaveTextContent(
            /Bruno Lima\s*Fisioterapeuta\s*Secretário\(a\)/,
        );
        const records = within(dialog)
            .getByText('Prontuário e evoluções')
            .closest('li') as HTMLElement;
        expect(records).toHaveTextContent('Sim → Não');
        expect(within(records).getByLabelText('Perde')).toBeInTheDocument();
        const agenda = within(dialog)
            .getByText('Agenda')
            .closest('li') as HTMLElement;
        expect(within(agenda).getByLabelText('Ganha')).toBeInTheDocument();

        await user.click(
            within(dialog).getByRole('button', { name: 'Cancelar' }),
        );
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
        expect(updateUser).not.toHaveBeenCalled();
    });

    it('escolher a função atual não abre o modal', async () => {
        renderPage();
        const user = await openRoleMenu('Bruno Lima');
        await user.click(
            await screen.findByRole('menuitemradio', {
                name: 'Fisioterapeuta',
            }),
        );
        expect(
            screen.queryByRole('dialog', { name: 'Mudar função' }),
        ).not.toBeInTheDocument();
    });

    it('confirmar grava só a função, avisa e fecha', async () => {
        updateUser.mockResolvedValue(makeUser('2', { role: 'secretary' }));
        renderPage();
        const user = await openRoleMenu('Bruno Lima');
        await user.click(
            await screen.findByRole('menuitemradio', { name: 'Secretário(a)' }),
        );
        const dialog = await screen.findByRole('dialog', {
            name: 'Mudar função',
        });

        await user.click(
            within(dialog).getByRole('button', { name: 'Mudar função' }),
        );

        await waitFor(() =>
            expect(updateUser).toHaveBeenCalledWith('2', { role: 'secretary' }),
        );
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
        expect(toastSuccess).toHaveBeenCalledWith(
            'Bruno Lima agora é Secretário(a).',
        );
        // A lista é buscada de novo para o cartão mostrar a função nova.
        await waitFor(() =>
            expect(listUsers.mock.calls.length).toBeGreaterThan(1),
        );
    });

    it('erro da API mostra o toast de erro e mantém o modal aberto', async () => {
        updateUser.mockRejectedValue({
            response: {
                data: {
                    message:
                        'A clínica precisa de pelo menos um administrador ativo.',
                },
            },
        });
        renderPage();
        const user = await openRoleMenu('Bruno Lima');
        await user.click(
            await screen.findByRole('menuitemradio', { name: 'Administrador' }),
        );
        const dialog = await screen.findByRole('dialog', {
            name: 'Mudar função',
        });
        await user.click(
            within(dialog).getByRole('button', { name: 'Mudar função' }),
        );

        await waitFor(() =>
            expect(toastError).toHaveBeenCalledWith(
                'A clínica precisa de pelo menos um administrador ativo.',
            ),
        );
        expect(
            screen.getByRole('dialog', { name: 'Mudar função' }),
        ).toBeInTheDocument();
        expect(toastSuccess).not.toHaveBeenCalled();
        // A recusa pode vir de uma mudança feita por outra pessoa: a lista recarrega.
        await waitFor(() =>
            expect(listUsers.mock.calls.length).toBeGreaterThan(1),
        );
    });

    it('quem pode mudar tem o puxador de arraste, com instruções em português', async () => {
        renderPage();
        await cardOf('Bruno Lima');
        expect(
            screen.getByText(/Para mudar a função, aperte espaço ou Enter/),
        ).toBeInTheDocument();
        const bruno = await cardOf('Bruno Lima');
        expect(
            within(bruno).getByRole('button', {
                name: 'Arrastar Bruno Lima para outra função',
            }),
        ).toBeInTheDocument();
    });

    it('o mestre não tem Mudar função nem puxador de arraste', async () => {
        renderPage();
        const master = await cardOf('Mestre Ana');
        expect(
            within(master).queryByRole('button', { name: /Mudar função/ }),
        ).not.toBeInTheDocument();
        expect(
            within(master).queryByRole('button', { name: /Arrastar/ }),
        ).not.toBeInTheDocument();
        expect(
            within(master).getByLabelText(/dono da conta/),
        ).toBeInTheDocument();
    });

    it('o último admin ativo não oferece outra função', async () => {
        listUsers.mockResolvedValue([
            makeUser('5', { name: 'Única Admin', role: 'admin' }),
            makeUser('6', { name: 'Admin Inativa', role: 'admin', status: 0 }),
            makeUser('7', { name: 'Fisio' }),
        ]);
        renderPage();
        const last = await cardOf('Única Admin');
        expect(
            within(last).queryByRole('button', { name: /Mudar função/ }),
        ).not.toBeInTheDocument();
        expect(
            within(last).queryByRole('button', { name: /Arrastar/ }),
        ).not.toBeInTheDocument();
        expect(
            within(last).getByLabelText(/pelo menos um administrador ativo/),
        ).toBeInTheDocument();
        // A admin inativa não é a última ativa: pode mudar.
        const inactive = await cardOf('Admin Inativa');
        expect(
            within(inactive).getByRole('button', {
                name: 'Mudar função de Admin Inativa',
            }),
        ).toBeInTheDocument();
    });
});

async function openDrawer(name: string) {
    const user = userEvent.setup();
    await user.click(
        await screen.findByRole('button', { name: `Ver ${name}` }),
    );
    const drawer = await screen.findByRole('dialog', { name });
    return { user, drawer };
}

describe('UserListPage: desativar e reativar', () => {
    it('Desativar abre o modal com o nome; Cancelar não grava', async () => {
        renderPage();
        const { user, drawer } = await openDrawer('Bruno Lima');

        await user.click(
            within(drawer).getByRole('button', { name: 'Desativar' }),
        );
        const dialog = await screen.findByRole('dialog', {
            name: 'Desativar Bruno Lima?',
        });
        expect(dialog).toHaveTextContent(/perde o acesso na hora/);
        expect(dialog).toHaveTextContent(/sessão aberta é encerrada/);
        expect(dialog).toHaveTextContent(/Google Agenda dela é desconectado/);

        await user.click(
            within(dialog).getByRole('button', { name: 'Cancelar' }),
        );
        await waitFor(() =>
            expect(
                screen.queryByRole('dialog', { name: 'Desativar Bruno Lima?' }),
            ).not.toBeInTheDocument(),
        );
        expect(updateUser).not.toHaveBeenCalled();
    });

    it('confirmar desativa, avisa e fecha o modal', async () => {
        updateUser.mockResolvedValue(makeUser('2', { status: 0 }));
        renderPage();
        const { user, drawer } = await openDrawer('Bruno Lima');
        await user.click(
            within(drawer).getByRole('button', { name: 'Desativar' }),
        );
        const dialog = await screen.findByRole('dialog', {
            name: 'Desativar Bruno Lima?',
        });

        await user.click(
            within(dialog).getByRole('button', { name: 'Desativar' }),
        );

        await waitFor(() =>
            expect(updateUser).toHaveBeenCalledWith('2', { status: 0 }),
        );
        await waitFor(() =>
            expect(
                screen.queryByRole('dialog', { name: 'Desativar Bruno Lima?' }),
            ).not.toBeInTheDocument(),
        );
        expect(toastSuccess).toHaveBeenCalledWith(
            'Bruno Lima foi desativado(a).',
        );
        await waitFor(() =>
            expect(listUsers.mock.calls.length).toBeGreaterThan(1),
        );
    });

    it('pessoa inativa mostra Reativar, que grava status ativo', async () => {
        updateUser.mockResolvedValue(makeUser('3', { status: 1 }));
        renderPage();
        const { user, drawer } = await openDrawer('Carla Dias');
        expect(
            within(drawer).queryByRole('button', { name: 'Desativar' }),
        ).not.toBeInTheDocument();

        await user.click(
            within(drawer).getByRole('button', { name: 'Reativar' }),
        );
        const dialog = await screen.findByRole('dialog', {
            name: 'Reativar Carla Dias?',
        });
        await user.click(
            within(dialog).getByRole('button', { name: 'Reativar' }),
        );

        await waitFor(() =>
            expect(updateUser).toHaveBeenCalledWith('3', { status: 1 }),
        );
        expect(toastSuccess).toHaveBeenCalledWith(
            'Carla Dias foi reativado(a).',
        );
    });

    it('erro da API mostra o toast de erro e mantém o modal aberto', async () => {
        updateUser.mockRejectedValue({
            response: { data: { message: 'Recusado pela API.' } },
        });
        renderPage();
        const { user, drawer } = await openDrawer('Bruno Lima');
        await user.click(
            within(drawer).getByRole('button', { name: 'Desativar' }),
        );
        const dialog = await screen.findByRole('dialog', {
            name: 'Desativar Bruno Lima?',
        });
        await user.click(
            within(dialog).getByRole('button', { name: 'Desativar' }),
        );

        await waitFor(() =>
            expect(toastError).toHaveBeenCalledWith('Recusado pela API.'),
        );
        expect(
            screen.getByRole('dialog', { name: 'Desativar Bruno Lima?' }),
        ).toBeInTheDocument();
        expect(toastSuccess).not.toHaveBeenCalled();
    });
});

describe('UserListPage: excluir', () => {
    it('Excluir abre o modal com o nome; Cancelar não exclui', async () => {
        renderPage();
        const { user, drawer } = await openDrawer('Bruno Lima');

        await user.click(
            within(drawer).getByRole('button', { name: 'Excluir usuário' }),
        );
        const dialog = await screen.findByRole('dialog', {
            name: 'Excluir Bruno Lima?',
        });
        expect(dialog).toHaveTextContent(
            /agenda, os pacientes e o histórico dela continuam guardados/,
        );
        await user.click(
            within(dialog).getByRole('button', { name: 'Cancelar' }),
        );

        await waitFor(() =>
            expect(
                screen.queryByRole('dialog', { name: 'Excluir Bruno Lima?' }),
            ).not.toBeInTheDocument(),
        );
        expect(destroyUser).not.toHaveBeenCalled();
    });

    it('confirmar exclui o usuário certo, avisa e fecha o drawer', async () => {
        destroyUser.mockResolvedValue(undefined);
        renderPage();
        const { user, drawer } = await openDrawer('Bruno Lima');
        await user.click(
            within(drawer).getByRole('button', { name: 'Excluir usuário' }),
        );
        const dialog = await screen.findByRole('dialog', {
            name: 'Excluir Bruno Lima?',
        });

        await user.click(
            within(dialog).getByRole('button', { name: 'Excluir' }),
        );

        await waitFor(() => expect(destroyUser).toHaveBeenCalledWith('2'));
        expect(toastSuccess).toHaveBeenCalledWith(
            'Usuário removido com sucesso.',
        );
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
    });

    it('erro da API mostra o toast de erro e mantém o modal aberto', async () => {
        destroyUser.mockRejectedValue({
            response: { data: { message: 'Não é possível remover.' } },
        });
        renderPage();
        const { user, drawer } = await openDrawer('Bruno Lima');
        await user.click(
            within(drawer).getByRole('button', { name: 'Excluir usuário' }),
        );
        const dialog = await screen.findByRole('dialog', {
            name: 'Excluir Bruno Lima?',
        });
        await user.click(
            within(dialog).getByRole('button', { name: 'Excluir' }),
        );

        await waitFor(() =>
            expect(toastError).toHaveBeenCalledWith('Não é possível remover.'),
        );
        expect(
            screen.getByRole('dialog', { name: 'Excluir Bruno Lima?' }),
        ).toBeInTheDocument();
    });
});

/**
 * Botão travado (ADR 017): nem clique nem Enter abrem o modal. Cada um é
 * conferido logo depois, sem mexer no foco no meio, porque tirar o foco de
 * um modal aberto o fecha e esconderia a falha.
 */
async function expectNoDeactivateModal(
    user: ReturnType<typeof userEvent.setup>,
    button: HTMLElement,
) {
    await user.click(button);
    await expect(
        screen.findByRole('dialog', { name: /Desativar/ }, { timeout: 300 }),
    ).rejects.toThrow();

    button.focus();
    await user.keyboard('{Enter}');
    await expect(
        screen.findByRole('dialog', { name: /Desativar/ }, { timeout: 300 }),
    ).rejects.toThrow();
    expect(updateUser).not.toHaveBeenCalled();
}

describe('UserListPage: travas no drawer', () => {
    it('mestre: sem Excluir e Desativar desabilitado com o motivo', async () => {
        renderPage();
        const { user, drawer } = await openDrawer('Mestre Ana');

        expect(
            within(drawer).queryByRole('button', { name: 'Excluir usuário' }),
        ).not.toBeInTheDocument();
        const deactivate = within(drawer).getByRole('button', {
            name: 'Desativar',
        });
        expect(deactivate).toHaveAttribute('aria-disabled', 'true');
        deactivate.focus();
        expect(await screen.findByRole('tooltip')).toHaveTextContent(
            /dono da conta/,
        );
        await expectNoDeactivateModal(user, deactivate);
    });

    it('último admin ativo: sem Excluir e Desativar desabilitado', async () => {
        listUsers.mockResolvedValue([
            makeUser('5', { name: 'Única Admin', role: 'admin' }),
            makeUser('7', { name: 'Fisio' }),
        ]);
        renderPage();
        const { user, drawer } = await openDrawer('Única Admin');

        expect(
            within(drawer).queryByRole('button', { name: 'Excluir usuário' }),
        ).not.toBeInTheDocument();
        const deactivate = within(drawer).getByRole('button', {
            name: 'Desativar',
        });
        expect(deactivate).toHaveAttribute('aria-disabled', 'true');
        await expectNoDeactivateModal(user, deactivate);
    });

    it('as travas contam a equipe inteira, não o recorte filtrado', async () => {
        listUsers.mockResolvedValue([
            makeUser('5', { name: 'Admin Um', role: 'admin' }),
            makeUser('6', { name: 'Admin Dois', role: 'admin' }),
        ]);
        // A busca esconde a outra admin ativa: Admin Um continua podendo mudar.
        renderPage('/clinica/usuarios?q=um');
        const card = await cardOf('Admin Um');
        expect(
            within(card).getByRole('button', {
                name: 'Mudar função de Admin Um',
            }),
        ).toBeInTheDocument();
        const { drawer } = await openDrawer('Admin Um');
        expect(
            within(drawer).getByRole('button', { name: 'Excluir usuário' }),
        ).toBeInTheDocument();
        expect(
            within(drawer).getByRole('button', { name: 'Desativar' }),
        ).not.toHaveAttribute('aria-disabled');
    });
});

describe('UserListPage: rebaixar mostra o que a pessoa perde', () => {
    it('administrador para fisioterapeuta marca agenda e excluir como perda', async () => {
        listUsers.mockResolvedValue([
            MASTER,
            makeUser('5', { name: 'Outra Admin', role: 'admin' }),
        ]);
        renderPage();
        const user = await openRoleMenu('Outra Admin');
        await user.click(
            await screen.findByRole('menuitemradio', {
                name: 'Fisioterapeuta',
            }),
        );
        const dialog = await screen.findByRole('dialog', {
            name: 'Mudar função',
        });
        const agenda = within(dialog)
            .getByText('Agenda')
            .closest('li') as HTMLElement;
        expect(agenda).toHaveTextContent('De todos → Só a própria');
        expect(within(agenda).getByLabelText('Perde')).toBeInTheDocument();
        const remove = within(dialog)
            .getByText('Excluir registros')
            .closest('li') as HTMLElement;
        expect(within(remove).getByLabelText('Perde')).toBeInTheDocument();
    });
});
