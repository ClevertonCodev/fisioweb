import { ExternalLink, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export function FinanceSettingsPanel() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5" />
                    Configurações
                </CardTitle>
                <CardDescription>
                    Preferências e categorias financeiras da clínica.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="rounded-lg border bg-muted/40 p-4">
                    <h3 className="font-medium">Configurar repasses</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Funcionalidade disponível apenas para equipes com plano
                        avançado.
                    </p>
                    <Button
                        variant="outline"
                        className="mt-3 cursor-pointer"
                        disabled
                    >
                        Solicitar acesso
                    </Button>
                </div>
                <div>
                    <h3 className="font-medium">Categorias</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Crie categorias personalizadas ou desative as padrão
                        para esta clínica.
                    </p>
                    <Button
                        variant="outline"
                        className="mt-3 cursor-pointer"
                        asChild
                    >
                        <Link to="/clinica/financas/categorias">
                            Gerenciar categorias
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
