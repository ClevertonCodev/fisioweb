import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useFinanceExport } from '@/application/clinic/use-finance-export';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { FinanceExportParams } from '@/infrastructure/repositories/api-clinic-finance-export';

export function FinanceExportDialog() {
    const [open, setOpen] = useState(false);
    const [range, setRange] =
        useState<FinanceExportParams['range']>('current_month');
    const [format, setFormat] = useState<FinanceExportParams['format']>('csv');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const mutation = useFinanceExport();

    const invalidCustomRange = useMemo(() => {
        if (range !== 'custom') return false;
        if (!from || !to) return true;
        return from > to;
    }, [range, from, to]);

    const exportFile = async () => {
        await mutation.mutateAsync({
            format,
            range,
            from: range === 'custom' ? from : undefined,
            to: range === 'custom' ? to : undefined,
        });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="cursor-pointer">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Exportar transações</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label>Período</Label>
                        <Select
                            value={range}
                            onValueChange={(v) =>
                                setRange(v as FinanceExportParams['range'])
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="current_month">
                                    Mês atual
                                </SelectItem>
                                <SelectItem value="previous_month">
                                    Mês anterior
                                </SelectItem>
                                <SelectItem value="custom">
                                    Intervalo personalizado
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {range === 'custom' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="export-from">De</Label>
                                <Input
                                    id="export-from"
                                    type="date"
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="export-to">Até</Label>
                                <Input
                                    id="export-to"
                                    type="date"
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label>Formato</Label>
                        <Select
                            value={format}
                            onValueChange={(v) =>
                                setFormat(v as FinanceExportParams['format'])
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="csv">CSV</SelectItem>
                                <SelectItem value="xlsx">XLSX</SelectItem>
                                <SelectItem value="pdf">PDF</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => setOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        className="cursor-pointer"
                        onClick={exportFile}
                        disabled={mutation.isPending || invalidCustomRange}
                    >
                        Baixar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
