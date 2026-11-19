import {
    focusManager,
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/infrastructure/api/client';
import PublicQuestionnaireAnswerPage from '@/pages/patient/questionnaire/PublicQuestionnaireAnswerPage';

vi.mock('@/infrastructure/api/client', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/infrastructure/api/client')>()),
    apiClient: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        isAuthenticated: false,
        guard: null,
        user: null,
        isLoading: false,
        logout: vi.fn(),
    }),
}));

const TOKEN = '6f1c2a4e-1b2c-4d5e-8f90-123456789abc';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const EXPIRES_AT = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const EXPIRES_AT_TEXT = EXPIRES_AT.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
});
const scrollIntoView = vi.fn();
Element.prototype.scrollIntoView = scrollIntoView;

function apiQuestionnaire() {
    return {
        id: 9,
        clinic_id: 1,
        patient_id: 7,
        questionnaire_template_id: 3,
        status: 'pending',
        modality: 'remoto',
        expires_at: EXPIRES_AT.toISOString(),
        answered_at: null,
        public_token: TOKEN,
        clinic_name: 'Clínica Movimento',
        template: {
            id: 3,
            title: 'Avaliação de dor e função do joelho',
            description: null,
            sections: [
                {
                    id: 1,
                    title: 'Dor',
                    sort_order: 0,
                    questions: [
                        {
                            id: 11,
                            label: 'De 0 a 10, quanto dói o joelho hoje?',
                            type: 'scale',
                            options: null,
                            scale_min: 0,
                            scale_max: 10,
                            required: true,
                            sort_order: 0,
                        },
                        {
                            id: 12,
                            label: 'Quando a dor aparece?',
                            type: 'checkbox',
                            options: ['Ao subir escada', 'Ao agachar'],
                            scale_min: 0,
                            scale_max: 10,
                            required: true,
                            sort_order: 1,
                        },
                    ],
                },
                {
                    id: 2,
                    title: 'Dia a dia',
                    sort_order: 1,
                    questions: [
                        {
                            id: 21,
                            label: 'A dor mudou desde a última sessão?',
                            type: 'multiple_choice',
                            options: ['Melhorou', 'Está igual', 'Piorou'],
                            scale_min: 0,
                            scale_max: 10,
                            required: true,
                            sort_order: 0,
                        },
                        {
                            id: 22,
                            label: 'Quer contar mais alguma coisa?',
                            type: 'text',
                            options: null,
                            scale_min: 0,
                            scale_max: 10,
                            required: false,
                            sort_order: 1,
                        },
                    ],
                },
            ],
        },
    };
}

function apiError(status: number, data: Record<string, unknown>) {
    return Object.assign(new Error(`HTTP ${status}`), {
        isAxiosError: true,
        response: { status, data },
    });
}

let lastQueryClient: QueryClient | null = null;

function renderPage(token: string = TOKEN) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    lastQueryClient = queryClient;

    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={[
                    `/clinica-movimento/paciente/questionarios/${token}`,
                ]}
            >
                <Routes>
                    <Route
                        path="/:clinicSlug/paciente/questionarios/:token"
                        element={<PublicQuestionnaireAnswerPage />}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

afterEach(() => {
    vi.clearAllMocks();
    mockGet.mockReset();
    mockPost.mockReset();
});

async function answerAllRequired(user: ReturnType<typeof userEvent.setup>) {
    const scale = await screen.findByRole('radiogroup', {
        name: /quanto dói o joelho hoje/,
    });
    await user.click(within(scale).getByRole('radio', { name: '3' }));
    const when = screen.getByRole('group', { name: /Quando a dor aparece/ });
    await user.click(
        within(when).getByRole('checkbox', { name: 'Ao agachar' }),
    );
    const change = screen.getByRole('radiogroup', { name: /A dor mudou/ });
    await user.click(within(change).getByRole('radio', { name: 'Melhorou' }));
}

describe('página pública do questionário', () => {
    it('mostra o nome da clínica e as perguntas dos quatro tipos por seção', async () => {
        mockGet.mockResolvedValueOnce({ data: { data: apiQuestionnaire() } });

        renderPage();

        expect(
            await screen.findByRole('heading', {
                name: 'Avaliação de dor e função do joelho',
            }),
        ).toBeInTheDocument();
        expect(mockGet).toHaveBeenCalledWith(`/questionnaires/${TOKEN}`);
        expect(
            screen.getByText(/^Clínica Movimento pediu que você responda/),
        ).toBeInTheDocument();
        expect(
            screen.getByText(`Prazo: responder até ${EXPIRES_AT_TEXT}.`, {
                exact: false,
            }),
        ).toBeInTheDocument();
        expect(screen.getByText('0 · mínimo')).toBeInTheDocument();
        expect(screen.getByText('10 · máximo')).toBeInTheDocument();
        expect(
            screen.getByRole('button', {
                name: /Área do Paciente/,
            }),
        ).toBeDisabled();

        const pain = screen.getByRole('region', { name: /Dor/ });
        expect(
            within(pain).getByRole('heading', { level: 2 }),
        ).toHaveTextContent(/^1\s*Dor$/);
        const scale = within(pain).getByRole('radiogroup', {
            name: /quanto dói o joelho hoje/,
        });
        expect(within(scale).getAllByRole('radio')).toHaveLength(11);
        const when = within(pain).getByRole('group', {
            name: /Quando a dor aparece/,
        });
        expect(within(when).getAllByRole('checkbox')).toHaveLength(2);
        expect(
            within(pain).getByText('Pode marcar mais de uma.'),
        ).toBeInTheDocument();

        const daily = screen.getByRole('region', { name: /Dia a dia/ });
        expect(
            within(daily).getByRole('heading', { level: 2 }),
        ).toHaveTextContent(/^2\s*Dia a dia$/);
        const change = within(daily).getByRole('radiogroup', {
            name: /A dor mudou/,
        });
        expect(within(change).getAllByRole('radio')).toHaveLength(3);
        expect(
            within(daily).getByRole('textbox', {
                name: /Quer contar mais alguma coisa/,
            }),
        ).toBeInTheDocument();

        expect(screen.getAllByText('(obrigatória)')).toHaveLength(3);
        expect(screen.getByText('0 de 4 respondidas')).toBeInTheDocument();
    });
    it('enviar com obrigatória em branco não chama a API e rola até a primeira que falta', async () => {
        mockGet.mockResolvedValueOnce({ data: { data: apiQuestionnaire() } });
        const user = userEvent.setup();

        renderPage();

        const scale = await screen.findByRole('radiogroup', {
            name: /quanto dói o joelho hoje/,
        });
        await user.click(within(scale).getByRole('radio', { name: '7' }));
        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        const alerts = await screen.findAllByText('Responda esta pergunta.');
        expect(alerts).toHaveLength(2);
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(scrollIntoView.mock.contexts[0]).toHaveAttribute(
            'id',
            'pergunta-12',
        );
        expect(
            within(
                screen.getByRole('group', { name: /Quando a dor aparece/ })
                    .parentElement!.parentElement!,
            ).getByText('Responda esta pergunta.'),
        ).toBeInTheDocument();
        expect(screen.getByText(/faltam 2 obrigatórias/)).toBeInTheDocument();
        expect(mockPost).not.toHaveBeenCalled();
    });
    it('com uma obrigatória em branco o contador diz falta 1 obrigatória', async () => {
        mockGet.mockResolvedValueOnce({ data: { data: apiQuestionnaire() } });
        const user = userEvent.setup();

        renderPage();

        const scale = await screen.findByRole('radiogroup', {
            name: /quanto dói o joelho hoje/,
        });
        await user.click(within(scale).getByRole('radio', { name: '7' }));
        const change = screen.getByRole('radiogroup', { name: /A dor mudou/ });
        await user.click(within(change).getByRole('radio', { name: 'Piorou' }));
        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        expect(
            await screen.findByText(/falta 1 obrigatória$/),
        ).toBeInTheDocument();
        expect(screen.queryByText(/faltam 1/)).not.toBeInTheDocument();
        expect(mockPost).not.toHaveBeenCalled();
    });

    it('uma nova busca que falha não apaga o que o paciente já respondeu', async () => {
        mockGet.mockResolvedValueOnce({ data: { data: apiQuestionnaire() } });
        mockGet.mockRejectedValueOnce(
            Object.assign(new Error('500'), {
                isAxiosError: true,
                response: { status: 500, data: {} },
            }),
        );
        const user = userEvent.setup();

        renderPage();

        const box = await screen.findByRole('textbox', {
            name: /Quer contar mais alguma coisa/,
        });
        await user.type(box, 'resposta longa');
        await act(async () => {
            focusManager.setFocused(false);
            focusManager.setFocused(true);
        });
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
        });

        expect(
            screen.queryByText('Não foi possível abrir o questionário'),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('textbox', {
                name: /Quer contar mais alguma coisa/,
            }),
        ).toHaveValue('resposta longa');
    });

    it('sem obrigatória, enviar em branco pede pelo menos uma resposta e não chama a API', async () => {
        const optional = apiQuestionnaire();
        optional.template.sections.forEach((section) =>
            section.questions.forEach((question) => {
                question.required = false;
            }),
        );
        mockGet.mockResolvedValueOnce({ data: { data: optional } });
        const user = userEvent.setup();

        renderPage();

        await user.click(await screen.findByRole('button', { name: 'Enviar' }));

        expect(
            await screen.findByText('Responda pelo menos uma pergunta.'),
        ).toBeInTheDocument();
        expect(mockPost).not.toHaveBeenCalled();
    });

    it('pergunta de escolha sem opções não trava o envio e opção repetida aparece uma vez', async () => {
        const broken = apiQuestionnaire();
        broken.template.sections[0]!.questions[1]!.options = [];
        broken.template.sections[1]!.questions[0]!.options = [
            'Melhorou',
            'Melhorou',
            'Piorou',
        ];
        mockGet.mockResolvedValueOnce({ data: { data: broken } });
        mockPost.mockResolvedValueOnce({ data: { data: { id: 9 } } });
        const user = userEvent.setup();

        renderPage();

        const scale = await screen.findByRole('radiogroup', {
            name: /quanto dói o joelho hoje/,
        });
        await user.click(within(scale).getByRole('radio', { name: '7' }));
        const change = screen.getByRole('radiogroup', { name: /A dor mudou/ });
        expect(
            within(change).getAllByRole('radio', { name: 'Melhorou' }),
        ).toHaveLength(1);
        expect(screen.getByText('1 de 3 respondidas')).toBeInTheDocument();
        await user.click(within(change).getByRole('radio', { name: 'Piorou' }));
        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        expect(
            await screen.findByRole('heading', { name: 'Respostas enviadas' }),
        ).toBeInTheDocument();
    });

    it.each([
        '..%2Fclinic%2Fpatients%2F5%2Fquestionnaires%2F9',
        '123',
        `${TOKEN}%2F..%2F..%2Fadmin`,
    ])(
        'token que não é UUID (%s) mostra link inválido sem chamar a API',
        async (token) => {
            renderPage(token);

            expect(
                await screen.findByText('Link não encontrado'),
            ).toBeInTheDocument();
            expect(mockGet).not.toHaveBeenCalled();
            expect(mockPost).not.toHaveBeenCalled();
        },
    );

    it('uma nova busca forçada que falha mantém o formulário com as respostas', async () => {
        mockGet.mockResolvedValueOnce({ data: { data: apiQuestionnaire() } });
        mockGet.mockRejectedValueOnce(
            Object.assign(new Error('500'), {
                isAxiosError: true,
                response: { status: 500, data: {} },
            }),
        );
        const user = userEvent.setup();

        renderPage();

        const box = await screen.findByRole('textbox', {
            name: /Quer contar mais alguma coisa/,
        });
        await user.type(box, 'resposta longa');
        await act(async () => {
            await lastQueryClient!.refetchQueries();
            await new Promise((resolve) => setTimeout(resolve, 50));
        });

        expect(mockGet).toHaveBeenCalledTimes(2);
        expect(
            screen.queryByText('Não foi possível abrir o questionário'),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('textbox', {
                name: /Quer contar mais alguma coisa/,
            }),
        ).toHaveValue('resposta longa');
    });

    it('sem nenhuma pergunta para responder, avisa para falar com a clínica e não deixa enviar', async () => {
        const empty = apiQuestionnaire();
        empty.template.sections = [
            {
                ...empty.template.sections[0]!,
                questions: [
                    {
                        ...empty.template.sections[0]!.questions[1]!,
                        options: [],
                    },
                ],
            },
        ];
        mockGet.mockResolvedValueOnce({ data: { data: empty } });

        renderPage();

        expect(
            await screen.findByText(
                'Este questionário não tem perguntas para responder. Fale com a clínica.',
            ),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
        expect(screen.queryByText('(obrigatória)')).not.toBeInTheDocument();
        expect(screen.getByText('0 de 0 respondidas')).toBeInTheDocument();
    });

    it('o aviso de resposta em branco aparece na tela', async () => {
        const optional = apiQuestionnaire();
        optional.template.sections.forEach((section) =>
            section.questions.forEach((question) => {
                question.required = false;
            }),
        );
        mockGet.mockResolvedValueOnce({ data: { data: optional } });
        const user = userEvent.setup();

        renderPage();

        await user.click(await screen.findByRole('button', { name: 'Enviar' }));
        const alert = await screen.findByText(
            'Responda pelo menos uma pergunta.',
        );

        expect(
            scrollIntoView.mock.contexts.some(
                (element) =>
                    element instanceof Element && element.contains(alert),
            ),
        ).toBe(true);
    });

    it('duplo clique em Enviar manda as respostas uma vez só', async () => {
        mockGet.mockResolvedValueOnce({ data: { data: apiQuestionnaire() } });
        let resolvePost: (value: unknown) => void = () => undefined;
        mockPost.mockReturnValueOnce(
            new Promise((resolve) => {
                resolvePost = resolve;
            }),
        );
        const user = userEvent.setup();

        renderPage();

        const scale = await screen.findByRole('radiogroup', {
            name: /quanto dói o joelho hoje/,
        });
        await user.click(within(scale).getByRole('radio', { name: '7' }));
        const when = screen.getByRole('group', {
            name: /Quando a dor aparece/,
        });
        await user.click(
            within(when).getByRole('checkbox', { name: 'Ao agachar' }),
        );
        const change = screen.getByRole('radiogroup', { name: /A dor mudou/ });
        await user.click(within(change).getByRole('radio', { name: 'Piorou' }));

        await user.dblClick(screen.getByRole('button', { name: 'Enviar' }));
        resolvePost({ data: { data: { id: 9 } } });

        expect(
            await screen.findByRole('heading', { name: 'Respostas enviadas' }),
        ).toBeInTheDocument();
        expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it('enviar completo chama o POST com as respostas e mostra Respostas enviadas', async () => {
        mockGet.mockResolvedValueOnce({ data: { data: apiQuestionnaire() } });
        mockPost.mockResolvedValueOnce({ data: { data: { id: 9 } } });
        const user = userEvent.setup();

        renderPage();

        const scale = await screen.findByRole('radiogroup', {
            name: /quanto dói o joelho hoje/,
        });
        await user.click(within(scale).getByRole('radio', { name: '7' }));
        const when = screen.getByRole('group', {
            name: /Quando a dor aparece/,
        });
        await user.click(
            within(when).getByRole('checkbox', { name: 'Ao subir escada' }),
        );
        await user.click(
            within(when).getByRole('checkbox', { name: 'Ao agachar' }),
        );
        const change = screen.getByRole('radiogroup', { name: /A dor mudou/ });
        await user.click(within(change).getByRole('radio', { name: 'Piorou' }));
        await user.type(
            screen.getByRole('textbox', {
                name: /Quer contar mais alguma coisa/,
            }),
            '  Dói mais à noite  ',
        );
        expect(screen.getByText('4 de 4 respondidas')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        expect(
            await screen.findByRole('heading', { name: 'Respostas enviadas' }),
        ).toBeInTheDocument();
        expect(mockPost).toHaveBeenCalledWith(
            `/questionnaires/${TOKEN}/answer`,
            {
                answers: [
                    { question_id: 11, answer: 7 },
                    {
                        question_id: 12,
                        answer: ['Ao subir escada', 'Ao agachar'],
                    },
                    { question_id: 21, answer: 'Piorou' },
                    { question_id: 22, answer: 'Dói mais à noite' },
                ],
            },
        );
    });
    it.each([
        [
            'link inválido',
            apiError(404, { message: 'Questionário não encontrado.' }),
            'Link não encontrado',
        ],
        [
            'já respondido',
            apiError(422, {
                message: 'Este questionário já foi respondido.',
                reason: 'answered',
            }),
            'Você já respondeu este questionário',
        ],
        [
            'prazo vencido',
            apiError(422, {
                message: 'Este questionário expirou.',
                reason: 'expired',
            }),
            'O prazo para responder acabou',
        ],
    ])(
        'ao abrir com %s mostra a mensagem certa',
        async (_caso, error, title) => {
            mockGet.mockRejectedValueOnce(error);

            renderPage();

            expect(
                await screen.findByRole('heading', { name: title }),
            ).toBeInTheDocument();
            expect(
                screen.queryByRole('button', { name: 'Enviar' }),
            ).not.toBeInTheDocument();
        },
    );
    it('se o prazo vence antes de enviar, mostra o prazo vencido', async () => {
        mockGet.mockResolvedValueOnce({ data: { data: apiQuestionnaire() } });
        mockPost.mockRejectedValueOnce(
            apiError(422, {
                message: 'Este questionário expirou.',
                reason: 'expired',
            }),
        );
        const user = userEvent.setup();

        renderPage();
        await answerAllRequired(user);
        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        expect(
            await screen.findByRole('heading', {
                name: 'O prazo para responder acabou',
            }),
        ).toBeInTheDocument();
    });
    it('se o envio volta 422 sem motivo, mostra a mensagem do servidor e mantém o formulário', async () => {
        mockGet.mockResolvedValueOnce({ data: { data: apiQuestionnaire() } });
        mockPost.mockRejectedValueOnce(
            apiError(422, {
                message:
                    'A pergunta informada não pertence a este questionário.',
            }),
        );
        const user = userEvent.setup();

        renderPage();
        await answerAllRequired(user);
        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        expect(
            await screen.findByText(
                'A pergunta informada não pertence a este questionário.',
            ),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Enviar' })).toBeEnabled();
        expect(
            screen.queryByRole('heading', { name: 'Respostas enviadas' }),
        ).not.toBeInTheDocument();
    });
});
