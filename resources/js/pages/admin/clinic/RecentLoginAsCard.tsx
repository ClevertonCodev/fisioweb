import { useId } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import type { LoginAsEntry } from '@/domain/admin';
import { formatDateTimeAt } from '@/lib/format-date-time-at';

export function RecentLoginAsCard({ entries }: { entries: LoginAsEntry[] }) {
    const titleId = useId();

    return (
        <Card className="mx-auto mt-6 max-w-4xl">
            <CardContent className="p-6">
                <section aria-labelledby={titleId} className="space-y-4">
                    <h2
                        id={titleId}
                        className="border-b border-border pb-2 text-lg font-semibold text-foreground"
                    >
                        Últimos acessos do suporte
                    </h2>
                    {entries.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Nenhum acesso do suporte registrado.
                        </p>
                    ) : (
                        <ul className="divide-y divide-border">
                            {entries.map((entry, position) => (
                                <li
                                    key={`${position}-${entry.createdAt}`}
                                    className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                                >
                                    <span className="text-foreground">
                                        <span className="font-medium">
                                            {entry.operatorName}
                                        </span>{' '}
                                        <span className="text-muted-foreground">
                                            como{' '}
                                            {entry.clinicUserName ??
                                                'usuário removido'}
                                        </span>
                                    </span>
                                    <time
                                        dateTime={entry.createdAt}
                                        className="text-muted-foreground"
                                    >
                                        {formatDateTimeAt(entry.createdAt)}
                                    </time>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </CardContent>
        </Card>
    );
}
