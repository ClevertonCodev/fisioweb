import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useUpdateOpeningBalance } from '@/application/clinic/use-finance-transactions';
import { formatFinanceMoney } from '@/application/clinic/use-finance-values-visibility';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FinanceOpeningBalanceDialogProps {
    period: string;
    openingBalance: number;
    hidden: boolean;
}

export function FinanceOpeningBalanceDialog({
    period,
    openingBalance,
    hidden,
}: FinanceOpeningBalanceDialogProps) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState(String(openingBalance));
    const mutation = useUpdateOpeningBalance();
    const [year, month] = period.split('-').map(Number);

    useEffect(() => {
        setAmount(String(openingBalance));
    }, [openingBalance]);

    const save = async () => {
        await mutation.mutateAsync({
            year,
            month,
            amount: Number(amount),
        });
        setOpen(false);
    };

    return (
        <>
            <span className="inline-flex items-center gap-1">
                {formatFinanceMoney(openingBalance, hidden)}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 cursor-pointer"
                    aria-label="Editar saldo inicial"
                    onClick={() => setOpen(true)}
                >
                    <Pencil className="h-3 w-3" />
                </Button>
            </span>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Saldo inicial do período</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Informe o saldo de abertura para reconciliar o mês.
                    </p>
                    <div className="grid gap-2 py-2">
                        <Label htmlFor="opening-balance">Valor (R$)</Label>
                        <Input
                            id="opening-balance"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
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
                            onClick={save}
                            disabled={mutation.isPending}
                        >
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
