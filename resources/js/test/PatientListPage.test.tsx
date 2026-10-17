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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Patient } from '@/domain/clinic/patient';
import PatientListPage from '@/pages/clinic/patient/PatientListPage';
import { routerFutureFlags } from '@/test/browser-router';

const list = vi.fn();
const listProfessionals = vi.fn();
const bulkInactivate = vi.fn();
const reactivate = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('@/infrastructure/repositories/api-clinic-patients', () => ({
    apiClinicPatientsRepository: {
        list: (...args: unknown[]) => list(...args),
        bulkInactivate: (...args: unknown[]) => bulkInactivate(...args),
        reactivate: (...args: unknown[]) => reactivate(...args),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        success: (...args: unknown[]) => toastSuccess(...args),
        error: (...args: unknown[]) => toastError(...args),
    },
}));

vi.mock('@/infrastructure/repositories/api-clinic-users', () => ({
    apiClinicUsersRepository: {
        listProfessionals: (...args: unknown[]) => listProfessionals(...args),
    },
}));

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

let role = 'admin';
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ user: { id: 1, name: 'Usuária', role } }),
}));

function makePatient(id: string, overrides: Partial<Patient> = {}): Patient {
    return {
        id,
        name: `Paciente ${id}`,
        initial: 'P',
        professional: 'Dra. Ana Paula',
        professionalInitial: 'D',
        status: 'em_tratamento',
        diagnosis: `Diagnóstico ${id}`,
        isActive: true,
        ...overrides,
    };
}

function listResult(patients: Patient[], total = patients.length) {
    return {
        data: patients,
        total,
        lastPage: Math.max(1, Math.ceil(total / 15)),
        perPage: 15,
        currentPage: 1,
    };
}

function LocationProbe() {
    const location = useLocation();
    const navigate = useNavigate();
    return (
        <>
            <output aria-label="url atual">{location.search}</output>
            <button type="button" onClick={() => navigate(-1)}>
                voltar do navegador
            </button>
        </>
    );
}

function renderPage(url: string | string[] = '/clinica/pacientes') {
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
                        path="/clinica/pacientes"
                        element={
                            <>
                                <PatientListPage />
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

function currentSearch() {
    // hidden: com modal ou gaveta aberta, o resto da tela fica aria-hidden.
    return screen.getByRole('status', { name: 'url atual', hidden: true })
        .textContent;
}

beforeEach(() => {
    role = 'admin';
    list.mockResolvedValue(listResult([makePatient('1'), makePatient('2')]));
    listProfessionals.mockResolvedValue([]);
    bulkInactivate.mockResolvedValue(1);
    reactivate.mockImplementation((id: string) =>
        Promise.resolve(makePatient(id)),
    );
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('PatientListPage: lista e URL', () => {
    it('abre com a busca, a página e os itens por página da URL', async () => {
        list.mockResolvedValue(listResult([makePatient('1')], 40));

        renderPage('/clinica/pacientes?q=maria&page=2&per_page=30');

        expect(await screen.findByText('Paciente 1')).toBeInTheDocument();
        expect(list).toHaveBeenCalledWith(
            expect.objectContaining({ search: 'maria', page: 2, perPage: 30 }),
        );
        expect(
            screen.getByRole('searchbox', { name: /pesquisar/i }),
        ).toHaveValue('maria');
    });

    it('digitar na busca grava q na URL depois do debounce e volta para a página 1', async () => {
        const user = userEvent.setup();
        list.mockResolvedValue(listResult([makePatient('1')], 100));
        renderPage('/clinica/pacientes?page=3');
        await screen.findByText('Paciente 1');

        await user.type(
            screen.getByRole('searchbox', { name: /pesquisar/i }),
            'ana',
        );

        await waitFor(() => expect(currentSearch()).toBe('?q=ana'));
        expect(list).toHaveBeenLastCalledWith(
            expect.objectContaining({ search: 'ana', page: 1 }),
        );
    });
});

describe('PatientListPage: busca com pausa', () => {
    it('o espaço final continua no campo depois do debounce e a busca composta chega inteira', async () => {
        const user = userEvent.setup();
        renderPage();
        const box = await screen.findByRole('searchbox', {
            name: /pesquisar/i,
        });

        await user.type(box, 'maria ');
        await waitFor(() => expect(currentSearch()).toBe('?q=maria'));
        expect(box).toHaveValue('maria ');

        await user.type(box, 'silva');
        await waitFor(() =>
            expect(list).toHaveBeenLastCalledWith(
                expect.objectContaining({ search: 'maria silva' }),
            ),
        );
        expect(box).toHaveValue('maria silva');
    });

    it('a URL mudando por fora (voltar do navegador) atualiza o campo', async () => {
        const user = userEvent.setup();
        renderPage(['/clinica/pacientes?q=ana', '/clinica/pacientes?q=bia']);
        const box = await screen.findByRole('searchbox', {
            name: /pesquisar/i,
        });
        expect(box).toHaveValue('bia');

        await user.click(
            screen.getByRole('button', { name: 'voltar do navegador' }),
        );

        await waitFor(() => expect(currentSearch()).toBe('?q=ana'));
        expect(box).toHaveValue('ana');
    });
});

describe('PatientListPage: cartões', () => {
    it('cartão leva ao prontuário e os atalhos aos destinos da v1', async () => {
        list.mockResolvedValue(
            listResult([makePatient('7', { name: 'Ana Souza' })]),
        );
        renderPage();

        const card = (
            await screen.findByRole('link', { name: 'Ana Souza' })
        ).closest('li') as HTMLElement;

        expect(
            within(card).getByRole('link', { name: 'Ana Souza' }),
        ).toHaveAttribute('href', '/clinica/pacientes/7');
        expect(
            within(card).getByRole('link', { name: 'Programas' }),
        ).toHaveAttribute(
            'href',
            '/clinica/programas/historico?patientId=7&search=Ana%20Souza',
        );
        expect(
            within(card).getByRole('link', { name: 'Agendamentos' }),
        ).toHaveAttribute('href', '/clinica/agenda?patientId=7');
        expect(
            within(card).getByRole('link', { name: 'Editar perfil' }),
        ).toHaveAttribute('href', '/clinica/pacientes/7/editar');
    });

    it('clicar num atalho abre só o destino dele', async () => {
        const user = userEvent.setup();
        renderPage();

        const card = (
            await screen.findByRole('link', { name: 'Paciente 1' })
        ).closest('li') as HTMLElement;
        await user.click(
            within(card).getByRole('link', { name: 'Agendamentos' }),
        );

        expect(await screen.findByText('Outra tela')).toBeInTheDocument();
        expect(currentSearch()).toBe('?patientId=1');
    });

    it('paciente inativo mostra o selo Inativo; o ativo, não', async () => {
        list.mockResolvedValue(
            listResult([
                makePatient('1', { name: 'Ativo' }),
                makePatient('2', { name: 'Desligado', isActive: false }),
            ]),
        );
        renderPage();

        const inactive = (
            await screen.findByRole('link', { name: 'Desligado' })
        ).closest('li') as HTMLElement;
        const active = screen
            .getByRole('link', { name: 'Ativo' })
            .closest('li') as HTMLElement;

        expect(within(inactive).getByText('Inativo')).toBeInTheDocument();
        expect(within(active).queryByText('Inativo')).not.toBeInTheDocument();
    });
});

describe('PatientListPage: total e estados', () => {
    it.each([
        ['', 1, '1 paciente cadastrado'],
        ['', 12, '12 pacientes cadastrados'],
        ['?q=ana', 1, '1 paciente encontrado'],
        ['?q=ana', 3, '3 pacientes encontrados'],
    ])('URL "%s" com total %i mostra "%s"', async (query, total, label) => {
        list.mockResolvedValue(listResult([makePatient('1')], total));
        renderPage(`/clinica/pacientes${query}`);

        expect(await screen.findByText(label)).toBeInTheDocument();
    });

    it('mostra o esqueleto enquanto carrega', () => {
        list.mockReturnValue(new Promise(() => {}));
        renderPage();

        expect(
            screen.getByLabelText('Carregando pacientes'),
        ).toBeInTheDocument();
    });

    it('erro da API mostra o estado de erro, não "nenhum paciente"', async () => {
        list.mockRejectedValue(new Error('500'));
        renderPage();

        expect(
            await screen.findByText('Erro ao carregar pacientes'),
        ).toBeInTheDocument();
        expect(
            screen.queryByText('Nenhum paciente cadastrado'),
        ).not.toBeInTheDocument();
    });

    it('clínica sem pacientes convida a cadastrar o primeiro', async () => {
        const user = userEvent.setup();
        list.mockResolvedValue(listResult([]));
        renderPage();

        expect(
            await screen.findByText('Nenhum paciente cadastrado'),
        ).toBeInTheDocument();
        const buttons = screen.getAllByRole('button', {
            name: 'Novo paciente',
        });
        await user.click(buttons[buttons.length - 1] as HTMLElement);
        expect(await screen.findByText('Outra tela')).toBeInTheDocument();
    });

    it('busca sem resultado mostra "Nenhum paciente encontrado"', async () => {
        list.mockResolvedValue(listResult([]));
        renderPage('/clinica/pacientes?q=zzz');

        expect(
            await screen.findByText('Nenhum paciente encontrado'),
        ).toBeInTheDocument();
        expect(
            screen.queryByText('Nenhum paciente cadastrado'),
        ).not.toBeInTheDocument();
    });

    it('página além da última vai para a última', async () => {
        list.mockImplementation(({ page }: { page: number }) =>
            Promise.resolve({
                ...listResult(page > 2 ? [] : [makePatient('1')], 30),
                lastPage: 2,
            }),
        );
        renderPage('/clinica/pacientes?page=9');

        await waitFor(() => expect(currentSearch()).toBe('?page=2'));
        expect(
            screen.queryByText('Nenhum paciente cadastrado'),
        ).not.toBeInTheDocument();
    });

    it('remover o chip de itens por página volta para 15 e para a página 1', async () => {
        const user = userEvent.setup();
        list.mockResolvedValue(listResult([makePatient('1')], 200));
        renderPage('/clinica/pacientes?per_page=50&page=2');

        await user.click(
            await screen.findByRole('button', {
                name: /remover filtro itens por página/i,
            }),
        );

        await waitFor(() => expect(currentSearch()).toBe(''));
    });
});

describe('PatientListPage: filtros', () => {
    const PROFESSIONALS = [
        { id: '3', name: 'Dra. Ana Paula' },
        { id: '9', name: 'Bruno Lima' },
    ];

    it('abre com os filtros da URL, manda para a API e mostra os chips', async () => {
        listProfessionals.mockResolvedValue(PROFESSIONALS);
        renderPage(
            '/clinica/pacientes?situacao=inativos&status=alta&prof=3,9&de=2026-01-05&ate=2026-03-31',
        );

        await screen.findByText('Paciente 1');
        expect(list).toHaveBeenCalledWith(
            expect.objectContaining({
                isActive: false,
                statuses: ['alta'],
                professionalIds: ['3', '9'],
                dateFrom: '2026-01-05',
                dateTo: '2026-03-31',
            }),
        );
        const chips = screen.getByRole('list', { name: 'Filtros aplicados' });
        expect(chips).toHaveTextContent('Situação: Só inativos');
        expect(chips).toHaveTextContent('Status: Alta');
        expect(
            await within(chips).findByText(/Profissionais: Ana, Bruno/),
        ).toBeInTheDocument();
        expect(chips).toHaveTextContent('Cadastro: 05/01/2026 – 31/03/2026');
        expect(screen.getByText(/pacientes? encontrados?/)).toBeInTheDocument();
    });

    it('marcar um status no dropdown grava na URL e volta para a página 1', async () => {
        const user = userEvent.setup();
        list.mockResolvedValue(listResult([makePatient('1')], 100));
        renderPage('/clinica/pacientes?page=4');
        await screen.findByText('Paciente 1');

        await user.click(screen.getByRole('button', { name: 'Status' }));
        await user.click(
            await screen.findByRole('menuitemcheckbox', { name: 'Alta' }),
        );

        await waitFor(() => expect(currentSearch()).toBe('?status=alta'));
    });

    it('escolher a situação no dropdown grava na URL', async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText('Paciente 1');

        await user.click(screen.getByRole('button', { name: 'Situação' }));
        await user.click(
            await screen.findByRole('menuitemradio', { name: 'Só ativos' }),
        );

        await waitFor(() => expect(currentSearch()).toBe('?situacao=ativos'));
    });

    it('remover o chip de um status tira só aquele status', async () => {
        const user = userEvent.setup();
        renderPage('/clinica/pacientes?status=alta,obito');

        await user.click(
            await screen.findByRole('button', {
                name: /remover filtro status: alta/i,
            }),
        );

        await waitFor(() => expect(currentSearch()).toBe('?status=obito'));
    });

    it('Limpar filtros zera os filtros e mantém a busca', async () => {
        const user = userEvent.setup();
        renderPage(
            '/clinica/pacientes?q=ana&status=alta&situacao=ativos&per_page=50',
        );
        await screen.findByText('Paciente 1');

        await user.click(
            screen.getByRole('button', { name: 'Limpar filtros' }),
        );

        await waitFor(() => expect(currentSearch()).toBe('?q=ana'));
    });

    it('sem resultado com filtro, o vazio oferece Limpar filtros', async () => {
        const user = userEvent.setup();
        list.mockResolvedValue(listResult([]));
        renderPage('/clinica/pacientes?status=obito');

        expect(
            await screen.findByText('Nenhum paciente encontrado'),
        ).toBeInTheDocument();
        // Um na linha de chips e outro no próprio estado vazio.
        const buttons = screen.getAllByRole('button', {
            name: 'Limpar filtros',
        });
        expect(buttons).toHaveLength(2);
        await user.click(buttons[1] as HTMLElement);

        await waitFor(() => expect(currentSearch()).toBe(''));
    });

    it('o filtro de profissional só aparece quando a clínica tem profissionais', async () => {
        renderPage();
        await screen.findByText('Paciente 1');
        expect(
            screen.queryByRole('button', { name: 'Profissional' }),
        ).not.toBeInTheDocument();
    });

    it('no celular, a gaveta de filtros mostra a contagem e aplica', async () => {
        const user = userEvent.setup();
        list.mockResolvedValue(listResult([makePatient('1')], 7));
        renderPage('/clinica/pacientes?status=alta');
        await screen.findByText('Paciente 1');

        await user.click(screen.getByRole('button', { name: 'Filtros (1)' }));
        const drawer = await screen.findByRole('dialog', { name: 'Filtros' });
        await user.click(
            within(drawer).getByRole('checkbox', { name: 'Óbito' }),
        );

        await waitFor(() =>
            expect(currentSearch()).toBe('?status=alta%2Cobito'),
        );
        await user.click(
            within(drawer).getByRole('button', { name: 'Ver 7 pacientes' }),
        );
        await waitFor(() =>
            expect(
                screen.queryByRole('dialog', { name: 'Filtros' }),
            ).not.toBeInTheDocument(),
        );
    });
});

async function cardOf(name: string) {
    return (await screen.findByRole('link', { name })).closest(
        'li',
    ) as HTMLElement;
}

describe('PatientListPage: inativar', () => {
    it('abre o modal com o nome e só inativa ao confirmar', async () => {
        const user = userEvent.setup();
        renderPage();
        const card = await cardOf('Paciente 2');

        await user.click(
            within(card).getByRole('button', { name: 'Inativar paciente' }),
        );

        const dialog = await screen.findByRole('dialog', {
            name: 'Inativar Paciente 2?',
        });
        expect(bulkInactivate).not.toHaveBeenCalled();
        expect(screen.queryByText('Outra tela')).not.toBeInTheDocument();

        await user.click(
            within(dialog).getByRole('button', { name: 'Inativar' }),
        );

        await waitFor(() => expect(bulkInactivate).toHaveBeenCalledWith(['2']));
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
        expect(toastSuccess).toHaveBeenCalledWith('Paciente 2 foi inativado.');
        // A lista é buscada de novo para o cartão aparecer como inativo.
        await waitFor(() => expect(list.mock.calls.length).toBeGreaterThan(1));
    });

    it('Cancelar fecha sem inativar', async () => {
        const user = userEvent.setup();
        renderPage();
        const card = await cardOf('Paciente 1');

        await user.click(
            within(card).getByRole('button', { name: 'Inativar paciente' }),
        );
        const dialog = await screen.findByRole('dialog');
        await user.click(
            within(dialog).getByRole('button', { name: 'Cancelar' }),
        );

        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
        expect(bulkInactivate).not.toHaveBeenCalled();
    });

    it('erro da API mostra o toast de erro e mantém o modal aberto', async () => {
        const user = userEvent.setup();
        bulkInactivate.mockRejectedValue(new Error('403'));
        renderPage();
        const card = await cardOf('Paciente 1');

        await user.click(
            within(card).getByRole('button', { name: 'Inativar paciente' }),
        );
        const dialog = await screen.findByRole('dialog');
        await user.click(
            within(dialog).getByRole('button', { name: 'Inativar' }),
        );

        await waitFor(() => expect(toastError).toHaveBeenCalled());
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(toastSuccess).not.toHaveBeenCalled();
    });

    it.each(['admin', 'secretary'])(
        '%s vê o botão de inativar habilitado',
        async (r) => {
            role = r;
            renderPage();
            const card = await cardOf('Paciente 1');

            const button = within(card).getByRole('button', {
                name: 'Inativar paciente',
            });
            expect(button).toBeEnabled();
            expect(button).not.toHaveAttribute('aria-disabled');
        },
    );

    it('fisioterapeuta vê o botão desabilitado, com o motivo no tooltip', async () => {
        const user = userEvent.setup();
        role = 'physiotherapist';
        renderPage();
        const card = await cardOf('Paciente 1');
        const button = within(card).getByRole('button', {
            name: 'Inativar paciente',
        });

        expect(button).toHaveAttribute('aria-disabled', 'true');
        // O motivo chega pelo teclado: o botão continua focável.
        button.focus();
        expect(await screen.findByRole('tooltip')).toHaveTextContent(
            'Apenas admin ou secretária podem inativar pacientes',
        );
        await user.click(button);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.queryByText('Outra tela')).not.toBeInTheDocument();
    });
});

describe('PatientListPage: reativar', () => {
    beforeEach(() => {
        list.mockResolvedValue(
            listResult([
                makePatient('1'),
                makePatient('2', { name: 'Desligado', isActive: false }),
            ]),
        );
    });

    it('o cartão inativo troca Inativar por Reativar', async () => {
        renderPage();
        const inactive = await cardOf('Desligado');
        const active = await cardOf('Paciente 1');

        expect(
            within(inactive).getByRole('button', { name: 'Reativar paciente' }),
        ).not.toHaveAttribute('aria-disabled');
        expect(
            within(inactive).queryByRole('button', {
                name: 'Inativar paciente',
            }),
        ).not.toBeInTheDocument();
        expect(
            within(active).queryByRole('button', { name: 'Reativar paciente' }),
        ).not.toBeInTheDocument();
    });

    it('confirmar no modal reativa e mostra o toast', async () => {
        const user = userEvent.setup();
        renderPage();
        const card = await cardOf('Desligado');

        await user.click(
            within(card).getByRole('button', { name: 'Reativar paciente' }),
        );
        const dialog = await screen.findByRole('dialog', {
            name: 'Reativar Desligado?',
        });
        await user.click(
            within(dialog).getByRole('button', { name: 'Reativar' }),
        );

        await waitFor(() => expect(reactivate).toHaveBeenCalledWith('2'));
        expect(bulkInactivate).not.toHaveBeenCalled();
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
        expect(toastSuccess).toHaveBeenCalledWith('Desligado foi reativado.');
    });

    it('Cancelar fecha sem reativar', async () => {
        const user = userEvent.setup();
        renderPage();
        const card = await cardOf('Desligado');

        await user.click(
            within(card).getByRole('button', { name: 'Reativar paciente' }),
        );
        const dialog = await screen.findByRole('dialog');
        await user.click(
            within(dialog).getByRole('button', { name: 'Cancelar' }),
        );

        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
        expect(reactivate).not.toHaveBeenCalled();
    });

    it('erro da API mostra o toast de erro e mantém o modal aberto', async () => {
        const user = userEvent.setup();
        reactivate.mockRejectedValue(new Error('404'));
        renderPage();
        const card = await cardOf('Desligado');

        await user.click(
            within(card).getByRole('button', { name: 'Reativar paciente' }),
        );
        const dialog = await screen.findByRole('dialog');
        await user.click(
            within(dialog).getByRole('button', { name: 'Reativar' }),
        );

        await waitFor(() =>
            expect(toastError).toHaveBeenCalledWith(
                'Não foi possível reativar o paciente.',
            ),
        );
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('fisioterapeuta vê Reativar desabilitado, com o motivo no tooltip', async () => {
        const user = userEvent.setup();
        role = 'physiotherapist';
        renderPage();
        const card = await cardOf('Desligado');
        const button = within(card).getByRole('button', {
            name: 'Reativar paciente',
        });

        expect(button).toHaveAttribute('aria-disabled', 'true');
        await user.hover(button);
        expect(await screen.findByRole('tooltip')).toHaveTextContent(
            'Apenas admin ou secretária podem reativar pacientes',
        );
        await user.click(button);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});

describe('PatientListPage: casos de borda de inativar e da gaveta', () => {
    it('inativar que não alcançou ninguém (count 0) mostra erro, não sucesso', async () => {
        const user = userEvent.setup();
        bulkInactivate.mockResolvedValue(0);
        renderPage();
        const card = await cardOf('Paciente 1');

        await user.click(
            within(card).getByRole('button', { name: 'Inativar paciente' }),
        );
        const dialog = await screen.findByRole('dialog');
        await user.click(
            within(dialog).getByRole('button', { name: 'Inativar' }),
        );

        await waitFor(() =>
            expect(toastError).toHaveBeenCalledWith(
                'Paciente não encontrado. A lista foi atualizada.',
            ),
        );
        expect(toastSuccess).not.toHaveBeenCalled();
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
    });

    it('na gaveta, Limpar fica habilitado quando só os itens por página mudaram', async () => {
        const user = userEvent.setup();
        renderPage('/clinica/pacientes?per_page=30');
        await screen.findByText('Paciente 1');

        await user.click(screen.getByRole('button', { name: 'Filtros' }));
        const drawer = await screen.findByRole('dialog', { name: 'Filtros' });
        const clear = within(drawer).getByRole('button', { name: 'Limpar' });

        expect(clear).toBeEnabled();
        await user.click(clear);
        await waitFor(() => expect(currentSearch()).toBe(''));
    });
});
