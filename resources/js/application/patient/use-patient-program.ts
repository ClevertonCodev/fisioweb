import { useQuery, useMutation } from '@tanstack/react-query';
import { mockPrograms } from '@/infrastructure/repositories/mock-patient-programs';
import { PatientProgram } from '@/domain/patient/program';

// Mocks for now

export function usePatientPrograms() {
    return useQuery({
        queryKey: ['patient', 'programs'],
        queryFn: async () => {
            // Simulate network delay
            await new Promise((resolve) => setTimeout(resolve, 500));
            return mockPrograms;
        },
    });
}

export function usePatientProgram(publicToken: string) {
    return useQuery({
        queryKey: ['patient', 'program', publicToken],
        queryFn: async () => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            // Como estamos usando mock, vamos retornar o programa mockado 
            // mesmo que o ID da URL seja diferente, para que qualquer link copiado funcione.
            const program = mockPrograms.find((p) => p.publicToken === publicToken) || mockPrograms[0];
            if (!program) {
                throw new Error('Program not found');
            }
            return program;
        },
        enabled: !!publicToken,
    });
}

export function useRegisterProgramView() {
    return useMutation({
        mutationFn: async (publicToken: string) => {
            await new Promise((resolve) => setTimeout(resolve, 300));
            console.log('View registered for', publicToken);
        },
    });
}

export function useSubmitProgramFeedback() {
    return useMutation({
        mutationFn: async (data: { publicToken: string; feedback: any }) => {
            await new Promise((resolve) => setTimeout(resolve, 800));
            console.log('Feedback submitted for', data.publicToken, data.feedback);
        },
    });
}

export function useCompleteProgram() {
    return useMutation({
        mutationFn: async (publicToken: string) => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            console.log('Program completed', publicToken);
        },
    });
}
