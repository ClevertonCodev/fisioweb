import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { ProgramSuccessViewProps } from './shared';

export const ORIGINAL_NAME = 'v1 atual (teal)';

export function Original({ onBackToPrograms }: ProgramSuccessViewProps) {
    return (
        <div className="flex h-screen flex-col items-center justify-center overflow-y-auto bg-[#217b7e] p-6 text-center text-white">
            <div className="mb-8 rounded-full bg-white/20 p-6">
                <CheckCircle2 className="h-24 w-24 text-white" />
            </div>

            <h1 className="mb-2 text-3xl font-bold">Programa concluído</h1>
            <h2 className="mb-12 text-2xl font-medium">com sucesso!</h2>

            <Button
                variant="outline"
                size="lg"
                className="w-full max-w-sm border-white bg-transparent text-white hover:bg-white/10"
                onClick={onBackToPrograms}
            >
                Voltar aos programas
            </Button>
        </div>
    );
}
