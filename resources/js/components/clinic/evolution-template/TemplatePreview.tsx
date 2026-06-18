import { ChevronDown } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

import type { DraftSection } from './types';

interface TemplatePreviewProps {
    sections: DraftSection[];
}

export function TemplatePreview({ sections }: TemplatePreviewProps) {
    return (
        <Collapsible>
            <Card>
                <CardHeader>
                    <CollapsibleTrigger asChild>
                        <button
                            type="button"
                            className="flex w-full cursor-pointer items-center justify-between"
                        >
                            <CardTitle className="text-base">
                                Pré-visualização do template
                            </CardTitle>
                            <ChevronDown className="h-4 w-4" />
                        </button>
                    </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                    <CardContent className="space-y-5">
                        {sections.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                Nenhuma seção adicionada ainda.
                            </p>
                        )}
                        {sections.map((section) => (
                            <div key={section._key} className="space-y-2">
                                <p className="font-semibold">
                                    {section.title || 'Seção sem título'}
                                </p>
                                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                                    {section.items.map((item) => (
                                        <li key={item._key}>
                                            {item.printText ||
                                                'Item sem texto de impressão'}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
