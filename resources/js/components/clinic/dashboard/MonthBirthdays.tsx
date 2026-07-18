import { MessageCircle } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Birthday, DashboardBirthdays } from '@/domain/clinic/dashboard';

interface MonthBirthdaysProps {
    data?: DashboardBirthdays;
    isLoading: boolean;
    isError: boolean;
}

const MONTH_NAME = new Date().toLocaleDateString('pt-BR', { month: 'long' });

function initials(name: string): string {
    return (
        name
            .split(' ')
            .map((n) => n[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase() || '?'
    );
}

/** Abre o WhatsApp Web com uma mensagem de parabéns pré-preenchida (FR-014). */
function whatsappUrl(birthday: Birthday): string {
    const digits = (birthday.phone ?? '').replace(/\D/g, '');
    const message = `Olá, ${birthday.name}! 🎉 A equipe da clínica deseja um feliz aniversário!`;
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function MonthBirthdays({
    data,
    isLoading,
    isError,
}: MonthBirthdaysProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">
                    {data ? `${data.total} ` : ''}aniversariantes em{' '}
                    {MONTH_NAME}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isError ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        Não foi possível carregar os aniversariantes.
                    </p>
                ) : isLoading ? (
                    <div className="space-y-4">
                        {[0, 1, 2].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : !data || data.items.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        Nenhum aniversariante neste mês.
                    </p>
                ) : (
                    <div className="max-h-96 space-y-3 overflow-y-auto">
                        {data.items.map((birthday) => (
                            <div
                                key={birthday.patientId}
                                className="flex items-center gap-3"
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={birthday.photoUrl} />
                                    <AvatarFallback className="bg-primary/10 font-medium text-primary">
                                        {initials(birthday.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-foreground">
                                        {birthday.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {birthday.day} de {MONTH_NAME}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild={birthday.canMessage}
                                    disabled={!birthday.canMessage}
                                    className="gap-2"
                                >
                                    {birthday.canMessage ? (
                                        <a
                                            href={whatsappUrl(birthday)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                            Enviar mensagem
                                        </a>
                                    ) : (
                                        <span>
                                            <MessageCircle className="h-4 w-4" />
                                            Sem telefone
                                        </span>
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
