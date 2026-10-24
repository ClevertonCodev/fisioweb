import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, type ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ds/photo/DsPhotoCropModal', () => ({
    DsPhotoCropModal: function AutoCrop({
        file,
        onConfirm,
    }: {
        file: File | null;
        onConfirm: (cropped: File, params: unknown) => void;
    }) {
        useEffect(() => {
            if (file) {
                onConfirm(file, { zoom: 1, x: 0, y: 0, rotation: 0 });
            }
            // Só o arquivo: onConfirm muda a cada render.
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [file]);
        return null;
    },
}));

import type { Patient, PatientDetail } from '@/domain/clinic/patient';
import { PatientEditPage } from '@/pages/clinic/patient/PatientEditPage';
import { PatientNewPage } from '@/pages/clinic/patient/PatientNewPage';
import { routerFutureFlags } from '@/test/browser-router';

const create = vi.fn();
const update = vi.fn();
const getDetailById = vi.fn();
const uploadPhoto = vi.fn();
const deletePhoto = vi.fn();
const toastSuccess = vi.fn();
const toastWarning = vi.fn();
const toastError = vi.fn();

vi.mock('@/infrastructure/repositories/api-clinic-patients', () => ({
    apiClinicPatientsRepository: {
        list: () => Promise.resolve({ data: [], meta: {} }),
        getById: () => Promise.resolve(null),
        getDetailById: (...args: unknown[]) => getDetailById(...args),
        create: (...args: unknown[]) => create(...args),
        update: (...args: unknown[]) => update(...args),
        uploadPhoto: (...args: unknown[]) => uploadPhoto(...args),
        deletePhoto: (...args: unknown[]) => deletePhoto(...args),
        bulkInactivate: vi.fn(),
        reactivate: vi.fn(),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        success: (...args: unknown[]) => toastSuccess(...args),
        warning: (...args: unknown[]) => toastWarning(...args),
        error: (...args: unknown[]) => toastError(...args),
        info: vi.fn(),
    },
}));

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

function patient(overrides: Partial<Patient> = {}): Patient {
    return {
        id: '42',
        name: 'Ana Lima',
        initial: 'AL',
        professional: '',
        professionalInitial: '',
        status: 'em_tratamento',
        diagnosis: '',
        isActive: true,
        ...overrides,
    };
}

function renderNew() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={['/clinica/pacientes/novo']}
                future={routerFutureFlags}
            >
                <Routes>
                    <Route
                        path="/clinica/pacientes/novo"
                        element={<PatientNewPage />}
                    />
                    <Route
                        path="/clinica/pacientes"
                        element={<p>Lista de pacientes</p>}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
    await user.type(
        screen.getByRole('textbox', { name: /nome completo/i }),
        'Ana Lima',
    );
    await user.type(screen.getByLabelText(/^CPF/), '52998224725');
    await user.type(
        screen.getByRole('textbox', { name: /data de nascimento/i }),
        '01011990',
    );
    await user.click(screen.getByRole('tab', { name: 'Contato' }));
    await user.type(screen.getByLabelText(/celular/i), '84999999999');
    await user.type(
        screen.getByRole('textbox', { name: /^e-mail/i }),
        'ana@clinica.test',
    );
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('cadastro de paciente (tela de verdade)', () => {
    it('criar válido grava pela API, envia a foto e volta para a lista', async () => {
        const user = userEvent.setup();
        create.mockResolvedValue(patient());
        uploadPhoto.mockResolvedValue(patient());
        const { container } = renderNew();

        await fillRequired(user);
        const photo = new File(['x'], 'ana.png', { type: 'image/png' });
        await user.upload(
            container.querySelector<HTMLInputElement>('input[type="file"]')!,
            photo,
        );
        await user.click(
            screen.getByRole('button', { name: 'Concluir cadastro' }),
        );

        expect(
            await screen.findByText('Lista de pacientes'),
        ).toBeInTheDocument();
        expect(create).toHaveBeenCalledTimes(1);
        const dto = create.mock.calls[0]?.[0] as {
            name: string;
            email: string;
            birthDate: string;
            password: string;
            status: string;
        };
        expect(dto.name).toBe('Ana Lima');
        expect(dto.email).toBe('ana@clinica.test');
        expect(dto.birthDate).toBe('1990-01-01');
        expect(dto.password).toBe('52998224725');
        expect(dto.status).toBe('em_tratamento');
        expect(uploadPhoto).toHaveBeenCalledWith('42', expect.any(File));
        expect(toastSuccess).toHaveBeenCalledWith(
            'Paciente cadastrado com sucesso',
        );
        expect(
            screen.queryByRole('group', {
                name: 'Trocar variante do protótipo',
            }),
        ).toBeNull();
    });

    it('foto que falha depois de criar avisa e volta para a lista', async () => {
        const user = userEvent.setup();
        create.mockResolvedValue(patient());
        uploadPhoto.mockRejectedValue(new Error('falhou'));
        const { container } = renderNew();

        await fillRequired(user);
        await user.upload(
            container.querySelector<HTMLInputElement>('input[type="file"]')!,
            new File(['x'], 'ana.png', { type: 'image/png' }),
        );
        await user.click(
            screen.getByRole('button', { name: 'Concluir cadastro' }),
        );

        expect(
            await screen.findByText('Lista de pacientes'),
        ).toBeInTheDocument();
        expect(toastWarning).toHaveBeenCalledWith(
            expect.stringMatching(/criado, mas falha ao enviar a foto/i),
        );
    });

    it('422 do backend aparece no campo e a aba com erro abre', async () => {
        const user = userEvent.setup();
        create.mockRejectedValue({
            response: {
                status: 422,
                data: {
                    message: 'CPF já cadastrado.',
                    errors: { cpf: ['CPF já cadastrado.'] },
                },
            },
        });
        renderNew();

        await fillRequired(user);
        expect(screen.getByRole('tab', { name: 'Contato' })).toHaveAttribute(
            'data-state',
            'active',
        );
        await user.click(
            screen.getByRole('button', { name: 'Concluir cadastro' }),
        );

        expect(
            await screen.findByText('CPF já cadastrado.'),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('tab', { name: 'Identificação' }),
        ).toHaveAttribute('data-state', 'active');
        expect(screen.queryByText('Lista de pacientes')).toBeNull();
        expect(toastError).not.toHaveBeenCalled();
    });

    it('enquanto cria, o botão fica ocupado e não envia duas vezes', async () => {
        const user = userEvent.setup();
        create.mockReturnValue(new Promise(() => {}));
        renderNew();

        await fillRequired(user);
        await user.click(
            screen.getByRole('button', { name: 'Concluir cadastro' }),
        );

        const busy = await screen.findByRole('button', { name: 'Criando…' });
        expect(busy).toBeDisabled();
        await user.click(busy);
        expect(create).toHaveBeenCalledTimes(1);
    });

    it('foto acima de 2 MB ou de tipo que o backend não aceita é recusada antes de criar', async () => {
        const user = userEvent.setup({ applyAccept: false });
        create.mockResolvedValue(patient());
        const { container } = renderNew();
        const input = () =>
            container.querySelector<HTMLInputElement>('input[type="file"]')!;

        await user.upload(
            input(),
            new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'grande.png', {
                type: 'image/png',
            }),
        );
        expect(screen.getByRole('alert')).toHaveTextContent(
            'A foto pode ter até 2 MB.',
        );
        expect(
            screen.queryByRole('button', { name: 'Remover foto' }),
        ).toBeNull();

        await user.upload(
            input(),
            new File(['x'], 'foto.gif', { type: 'image/gif' }),
        );
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Use uma foto JPG, PNG ou WebP.',
        );

        await fillRequired(user);
        await user.click(
            screen.getByRole('button', { name: 'Concluir cadastro' }),
        );

        expect(
            await screen.findByText('Lista de pacientes'),
        ).toBeInTheDocument();
        expect(uploadPhoto).not.toHaveBeenCalled();
    });

    it('situação no cadastro só oferece as opções de quem está chegando', async () => {
        const user = userEvent.setup();
        renderNew();

        await user.click(
            screen.getByRole('button', { name: /situação do tratamento/i }),
        );
        expect(
            screen.getByRole('option', { name: 'Em tratamento' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('option', { name: 'Em treinamento' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('option', { name: 'Em prevenção' }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'Alta' })).toBeNull();
        expect(screen.queryByRole('option', { name: 'Cancelado' })).toBeNull();
        expect(screen.queryByRole('option', { name: 'Óbito' })).toBeNull();
    });

    it('próxima aba e concluir só liberam com os obrigatórios válidos', async () => {
        renderNew();

        expect(
            screen.getByRole('button', { name: 'Próxima aba' }),
        ).toBeDisabled();
        expect(
            screen.getByRole('button', { name: 'Concluir cadastro' }),
        ).toBeDisabled();
    });

    it('com o switch ligado o painel mostra o apelido no lugar do nome', async () => {
        const user = userEvent.setup();
        renderNew();

        await user.type(
            screen.getByRole('textbox', { name: /nome completo/i }),
            'Ana Lima',
        );
        await user.type(
            screen.getByRole('textbox', { name: /apelido/i }),
            'Aninha',
        );

        const panel = screen.getByRole('complementary', {
            name: 'Foto e situação',
        });
        expect(panel).toHaveTextContent('Ana Lima');

        await user.click(
            screen.getByRole('switch', { name: /usar apelido no sistema/i }),
        );

        expect(panel).toHaveTextContent('Aninha');
        expect(panel).not.toHaveTextContent('Ana Lima');
    });
});

function detail(overrides: Partial<PatientDetail> = {}): PatientDetail {
    return {
        ...patient({ id: '7', name: 'Bruno Reis' }),
        isForeign: false,
        cpf: '529.982.247-25',
        useApelido: false,
        birthDate: '1990-01-01',
        phone: '(84) 99999-9999',
        email: 'bruno@clinica.test',
        photoUrl: 'https://cdn.test/bruno.png',
        ...overrides,
    };
}

function renderEdit(target: PatientDetail = detail()) {
    getDetailById.mockResolvedValue(target);
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={[`/clinica/pacientes/${target.id}/editar`]}
                future={routerFutureFlags}
            >
                <Routes>
                    <Route
                        path="/clinica/pacientes/:id/editar"
                        element={<PatientEditPage />}
                    />
                    <Route
                        path="/clinica/pacientes/:id"
                        element={<p>Prontuário</p>}
                    />
                    <Route
                        path="/clinica/pacientes"
                        element={<p>Lista de pacientes</p>}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe('edição de paciente (tela de verdade)', () => {
    it('abre o layout A com os dados e o botão Salvar alterações', async () => {
        renderEdit();

        expect(
            await screen.findByRole('heading', { name: 'Editar paciente' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('textbox', { name: /nome completo/i }),
        ).toHaveValue('Bruno Reis');
        expect(
            screen.getByRole('button', { name: 'Salvar alterações' }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('group', {
                name: 'Trocar variante do protótipo',
            }),
        ).toBeNull();
    });

    it('trocar o id na URL com cache quente mostra o outro paciente', async () => {
        const user = userEvent.setup();
        const first = detail({ id: '7', name: 'Bruno Reis' });
        const second = detail({
            id: '8',
            name: 'Carla Nunes',
            email: 'carla@clinica.test',
            photoUrl: null,
        });
        getDetailById.mockImplementation((id: unknown) =>
            Promise.resolve(id === '8' ? second : first),
        );
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false, staleTime: Infinity },
            },
        });
        queryClient.setQueryData(['patients', '7', 'detail'], first);
        queryClient.setQueryData(['patients', '8', 'detail'], second);

        function Jump() {
            const navigate = useNavigate();
            return (
                <button
                    type="button"
                    onClick={() => navigate('/clinica/pacientes/8/editar')}
                >
                    Ir para o outro
                </button>
            );
        }

        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter
                    initialEntries={['/clinica/pacientes/7/editar']}
                    future={routerFutureFlags}
                >
                    <Jump />
                    <Routes>
                        <Route
                            path="/clinica/pacientes/:id/editar"
                            element={<PatientEditPage />}
                        />
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>,
        );

        expect(
            await screen.findByRole('textbox', { name: /nome completo/i }),
        ).toHaveValue('Bruno Reis');
        await user.click(
            screen.getByRole('button', { name: 'Ir para o outro' }),
        );
        expect(
            await screen.findByRole('textbox', { name: /nome completo/i }),
        ).toHaveValue('Carla Nunes');
    });

    it('mostra esqueleto enquanto carrega e paciente não encontrado no 404', async () => {
        getDetailById.mockReturnValue(new Promise(() => {}));
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });
        const { unmount } = render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter
                    initialEntries={['/clinica/pacientes/9/editar']}
                    future={routerFutureFlags}
                >
                    <Routes>
                        <Route
                            path="/clinica/pacientes/:id/editar"
                            element={<PatientEditPage />}
                        />
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>,
        );
        expect(screen.getByRole('status')).toHaveTextContent('Carregando…');
        unmount();

        getDetailById.mockRejectedValue({ response: { status: 404 } });
        render(
            <QueryClientProvider
                client={
                    new QueryClient({
                        defaultOptions: { queries: { retry: false } },
                    })
                }
            >
                <MemoryRouter
                    initialEntries={['/clinica/pacientes/9/editar']}
                    future={routerFutureFlags}
                >
                    <Routes>
                        <Route
                            path="/clinica/pacientes/:id/editar"
                            element={<PatientEditPage />}
                        />
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>,
        );
        expect(
            await screen.findByText('Paciente não encontrado'),
        ).toBeInTheDocument();
    });

    it('salvar chama o PUT, envia foto nova e vai ao prontuário', async () => {
        const user = userEvent.setup();
        update.mockResolvedValue(patient({ id: '7' }));
        uploadPhoto.mockResolvedValue(patient({ id: '7' }));
        const { container } = renderEdit();

        await screen.findByRole('heading', { name: 'Editar paciente' });
        const nome = screen.getByRole('textbox', { name: /nome completo/i });
        await user.clear(nome);
        await user.type(nome, 'Bruno Reis Jr');
        await user.upload(
            container.querySelector<HTMLInputElement>('input[type="file"]')!,
            new File(['x'], 'bruno.png', { type: 'image/png' }),
        );
        await user.click(
            screen.getByRole('button', { name: 'Salvar alterações' }),
        );

        expect(await screen.findByText('Prontuário')).toBeInTheDocument();
        expect(update).toHaveBeenCalledWith(
            '7',
            expect.objectContaining({ name: 'Bruno Reis Jr' }),
        );
        expect(uploadPhoto).toHaveBeenCalledWith('7', expect.any(File));
    });

    it('foto removida é apagada depois de salvar', async () => {
        const user = userEvent.setup();
        update.mockResolvedValue(patient({ id: '7' }));
        deletePhoto.mockResolvedValue(patient({ id: '7' }));
        renderEdit();

        await user.click(
            await screen.findByRole('button', { name: 'Remover foto' }),
        );
        await user.click(
            screen.getByRole('button', { name: 'Salvar alterações' }),
        );

        expect(await screen.findByText('Prontuário')).toBeInTheDocument();
        expect(deletePhoto).toHaveBeenCalledWith('7');
        expect(uploadPhoto).not.toHaveBeenCalled();
    });

    it('remoção que falha depois de salvar avisa e vai ao prontuário', async () => {
        const user = userEvent.setup();
        update.mockResolvedValue(patient({ id: '7' }));
        deletePhoto.mockRejectedValue(new Error('falhou'));
        renderEdit();

        await user.click(
            await screen.findByRole('button', { name: 'Remover foto' }),
        );
        await user.click(
            screen.getByRole('button', { name: 'Salvar alterações' }),
        );

        expect(await screen.findByText('Prontuário')).toBeInTheDocument();
        expect(toastWarning).toHaveBeenCalledWith(
            expect.stringMatching(/atualizado, mas falha ao remover a foto/i),
        );
    });

    it('foto que falha depois de salvar avisa e vai ao prontuário', async () => {
        const user = userEvent.setup();
        update.mockResolvedValue(patient({ id: '7' }));
        uploadPhoto.mockRejectedValue(new Error('falhou'));
        const { container } = renderEdit();

        await screen.findByRole('heading', { name: 'Editar paciente' });
        await user.upload(
            container.querySelector<HTMLInputElement>('input[type="file"]')!,
            new File(['x'], 'bruno.png', { type: 'image/png' }),
        );
        await user.click(
            screen.getByRole('button', { name: 'Salvar alterações' }),
        );

        expect(await screen.findByText('Prontuário')).toBeInTheDocument();
        expect(toastWarning).toHaveBeenCalledWith(
            expect.stringMatching(/atualizado, mas falha ao enviar a foto/i),
        );
    });

    it('situação na edição oferece todas as opções', async () => {
        const user = userEvent.setup();
        renderEdit();

        await screen.findByRole('heading', { name: 'Editar paciente' });
        await user.click(
            screen.getByRole('button', { name: /situação do tratamento/i }),
        );
        expect(
            screen.getByRole('option', { name: 'Alta' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('option', { name: 'Cancelado' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('option', { name: 'Óbito' }),
        ).toBeInTheDocument();
    });

    it('422 do backend aparece no campo e a tela não sai da edição', async () => {
        const user = userEvent.setup();
        update.mockRejectedValue({
            response: {
                status: 422,
                data: { errors: { email: ['O email já está em uso.'] } },
            },
        });
        renderEdit();

        await screen.findByRole('heading', { name: 'Editar paciente' });
        await user.click(screen.getByRole('tab', { name: 'Contato' }));
        const email = screen.getByRole('textbox', { name: /^e-mail/i });
        await user.clear(email);
        await user.type(email, 'novo@clinica.test');
        await user.click(
            screen.getByRole('button', { name: 'Salvar alterações' }),
        );

        expect(
            await screen.findByText('O email já está em uso.'),
        ).toBeInTheDocument();
        expect(screen.queryByText('Prontuário')).toBeNull();
        expect(toastError).not.toHaveBeenCalled();
    });
});
