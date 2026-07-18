import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QuestionnaireFormSheet } from '@/components/clinic/patient/QuestionnaireFormSheet';
import { TestBrowserRouter } from '@/test/browser-router';

const mutateAsync = vi.fn().mockResolvedValue({});

vi.mock('@/application/clinic/use-questionnaire-templates', () => ({
    useQuestionnaireTemplates: () => ({
        data: [
            {
                id: 1,
                clinicId: 1,
                title: 'Anamnese lombar',
                description: null,
                isActive: true,
                sections: [],
            },
        ],
        isLoading: false,
    }),
}));

vi.mock('@/application/clinic/use-patient-questionnaires', () => ({
    useSendQuestionnaire: () => ({
        mutateAsync,
        isPending: false,
    }),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('QuestionnaireFormSheet', () => {
    it('mantém modalidade Remoto ao preencher data de expiração', async () => {
        const user = userEvent.setup();

        render(
            <TestBrowserRouter>
                <QuestionnaireFormSheet
                    open
                    onOpenChange={() => {}}
                    patientId="102"
                    patientRecordPath="/clinica/pacientes/102"
                />
            </TestBrowserRouter>,
        );

        await user.click(screen.getByText('Anamnese lombar'));
        await user.click(screen.getByRole('button', { name: /continuar/i }));

        await user.click(screen.getByRole('button', { name: /^remoto$/i }));

        const expires = screen.getByLabelText(/data de expiração/i);
        await user.clear(expires);
        await user.type(expires, '2026-07-25T18:00');

        await user.click(
            screen.getByRole('button', { name: /enviar ao paciente/i }),
        );

        expect(mutateAsync).toHaveBeenCalledWith({
            questionnaireTemplateId: 1,
            modality: 'remoto',
            expiresAt: '2026-07-25 18:00:00',
        });
    });
});
