import { Copy, KeyRound } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { useGenerateFirstAccessLink } from '@/application/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FirstAccessLink, MasterAccess } from '@/domain/admin';

function formatLinkDate(iso: string): string {
    const format = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
    const parts = Object.fromEntries(
        format.formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
    );
    return `${parts.day}/${parts.month}/${parts.year} às ${parts.hour}:${parts.minute}`;
}

function sameSecond(a: string, b: string | null): boolean {
    if (!b) return false;
    return (
        Math.floor(Date.parse(a) / 1000) === Math.floor(Date.parse(b) / 1000)
    );
}

export function MasterAccessCard({
    clinicId,
    masterAccess,
}: {
    clinicId: number;
    masterAccess: MasterAccess;
}) {
    const titleId = useId();
    const linkId = useId();
    const { passwordDefined, lastLinkCreatedAt } = masterAccess;
    const [generatedLink, setGeneratedLink] = useState<FirstAccessLink | null>(
        null,
    );
    const generate = useGenerateFirstAccessLink(clinicId);
    const linkUrl =
        generatedLink && sameSecond(generatedLink.createdAt, lastLinkCreatedAt)
            ? generatedLink.url
            : null;
    const linkLabel = passwordDefined
        ? 'Link de nova senha'
        : 'Link de primeiro acesso';

    const handleGenerate = () => {
        generate.mutate(undefined, { onSuccess: setGeneratedLink });
    };

    const handleCopy = async () => {
        if (!linkUrl) return;
        try {
            await navigator.clipboard.writeText(linkUrl);
            toast.success('Link copiado.');
        } catch {
            toast.error('Não foi possível copiar o link.');
        }
    };

    return (
        <Card className="mx-auto mt-6 max-w-4xl">
            <CardContent className="p-6">
                <section aria-labelledby={titleId} className="space-y-4">
                    <h2
                        id={titleId}
                        className="border-b border-border pb-2 text-lg font-semibold text-foreground"
                    >
                        Acesso do mestre
                    </h2>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                            <Badge
                                variant={
                                    passwordDefined ? 'default' : 'secondary'
                                }
                            >
                                {passwordDefined
                                    ? 'Senha definida'
                                    : 'Aguardando o primeiro acesso'}
                            </Badge>
                            {lastLinkCreatedAt && (
                                <p className="text-sm text-muted-foreground">
                                    Último link gerado em{' '}
                                    {formatLinkDate(lastLinkCreatedAt)}
                                </p>
                            )}
                        </div>
                        <Button
                            type="button"
                            className="cursor-pointer"
                            disabled={generate.isPending}
                            onClick={handleGenerate}
                        >
                            <KeyRound />
                            {passwordDefined
                                ? 'Gerar link de nova senha'
                                : 'Gerar link de primeiro acesso'}
                        </Button>
                    </div>
                    {linkUrl && (
                        <div className="space-y-2 rounded-md border border-border bg-muted/50 p-4">
                            <Label htmlFor={linkId} className="text-foreground">
                                {linkLabel}
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id={linkId}
                                    readOnly
                                    value={linkUrl}
                                    onFocus={(e) => e.currentTarget.select()}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="cursor-pointer"
                                    onClick={handleCopy}
                                >
                                    <Copy />
                                    Copiar link
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Copie agora: o link não aparece de novo. Gerar
                                outro link invalida este.
                            </p>
                        </div>
                    )}
                </section>
            </CardContent>
        </Card>
    );
}
