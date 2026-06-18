import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function PatientFormReferral() {
    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">
                Indicação de Profissional da Saúde
            </h2>
            <Input placeholder="Escolha o profissional da saúde" />
            <Button type="button" variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar profissional da saúde
            </Button>
        </div>
    );
}
