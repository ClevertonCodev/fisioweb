import { Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

function toSlug(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

type Props = {
    value: string;
    onChange: (slug: string) => void;
    baseName?: string;
    required?: boolean;
};

export function SlugInput({ value, onChange, baseName, required }: Props) {
    const [editable, setEditable] = useState(false);
    const manuallyEdited = useRef(false);

    useEffect(() => {
        if (!manuallyEdited.current && baseName !== undefined) {
            onChange(toSlug(baseName));
        }
    }, [baseName]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        manuallyEdited.current = true;
        onChange(toSlug(e.target.value));
    };

    const handleToggleEdit = () => {
        setEditable((prev) => !prev);
    };

    const preview = value ? `/${value}/paciente` : null;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <Label>
                    URL da Clínica{required && <span className="text-destructive"> *</span>}
                </Label>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={handleToggleEdit}
                >
                    <Pencil className="h-3 w-3" />
                    {editable ? 'Bloquear' : 'Editar'}
                </Button>
            </div>
            <Input
                value={value}
                onChange={handleChange}
                disabled={!editable}
                required={required}
                placeholder="url-da-clinica"
                className={!editable ? 'bg-muted/50' : ''}
            />
            {preview && <p className="text-muted-foreground truncate text-xs">{preview}</p>}
        </div>
    );
}
