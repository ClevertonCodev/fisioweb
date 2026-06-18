import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { AppointmentWriteDto } from '@/application/clinic/ports';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Appointment, AppointmentStatus } from '@/domain/clinic';
import { STATUS_COLORS } from '@/domain/clinic';

const STATUS_OPTIONS: AppointmentStatus[] = [
    'scheduled',
    'confirmed',
    'no_show',
    'completed',
    'cancelled',
];

const schema = z
    .object({
        patientId: z.string().min(1, 'Selecione o paciente'),
        clinicUserId: z.string().min(1, 'Selecione o fisioterapeuta'),
        startsAt: z.string().min(1, 'Informe o início'),
        endsAt: z.string().min(1, 'Informe o término'),
        title: z.string().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
    })
    .refine((d) => new Date(d.endsAt) > new Date(d.startsAt), {
        message: 'O término deve ser posterior ao início.',
        path: ['endsAt'],
    });

type FormValues = z.infer<typeof schema>;

interface AppointmentModalProps {
    open: boolean;
    onClose: () => void;
    appointment: Appointment | null;
    initialDate: Date | null;
    patients: { id: string; name: string }[];
    clinicUsers: { id: string; name: string }[];
    onSubmit: (dto: AppointmentWriteDto) => Promise<void> | void;
    isSubmitting?: boolean;
    /**
     * Quando definido (papel = fisioterapeuta), o campo Fisioterapeuta é fixado
     * neste id e desabilitado — UX apenas; o backend é autoritativo (FR-010).
     */
    lockedClinicUserId?: string;
    /** Edição: muda o status (endpoint próprio; backend valida transições). */
    onStatusChange?: (status: AppointmentStatus) => Promise<void> | void;
    /** Edição: cancela a consulta (sem hard delete). */
    onCancelAppointment?: () => Promise<void> | void;
    isMutatingStatus?: boolean;
}

function formatForInput(date: Date | null, addMinutes = 0): string {
    if (!date) return '';
    const d = new Date(date.getTime() + addMinutes * 60000);
    return format(d, "yyyy-MM-dd'T'HH:mm");
}

export function AppointmentModal({
    open,
    onClose,
    appointment,
    initialDate,
    patients,
    clinicUsers,
    onSubmit,
    isSubmitting = false,
    lockedClinicUserId,
    onStatusChange,
    onCancelAppointment,
    isMutatingStatus = false,
}: AppointmentModalProps) {
    const isEditing = !!appointment;
    const isCancelled = appointment?.status === 'cancelled';

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            patientId: '',
            clinicUserId: '',
            startsAt: '',
            endsAt: '',
            title: '',
            description: '',
            location: '',
        },
    });

    useEffect(() => {
        if (!open) return;
        if (appointment) {
            form.reset({
                patientId: appointment.patientId,
                clinicUserId: appointment.clinicUserId,
                startsAt: format(
                    new Date(appointment.startsAt),
                    "yyyy-MM-dd'T'HH:mm",
                ),
                endsAt: format(
                    new Date(appointment.endsAt),
                    "yyyy-MM-dd'T'HH:mm",
                ),
                title: appointment.title ?? '',
                description: appointment.description ?? '',
                location: appointment.location ?? '',
            });
        } else {
            form.reset({
                patientId: '',
                clinicUserId: lockedClinicUserId ?? '',
                startsAt: formatForInput(initialDate),
                endsAt: formatForInput(initialDate, 60),
                title: '',
                description: '',
                location: '',
            });
        }
    }, [appointment, initialDate, open, form, lockedClinicUserId]);

    const handleSubmit = async (values: FormValues) => {
        await onSubmit({
            patientId: values.patientId,
            clinicUserId: values.clinicUserId,
            title: values.title || null,
            description: values.description || null,
            location: values.location || null,
            startsAt: new Date(values.startsAt).toISOString(),
            endsAt: new Date(values.endsAt).toISOString(),
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Editar Consulta' : 'Nova Consulta'}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="patientId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Paciente *</FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o paciente" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {patients.map((p) => (
                                                <SelectItem
                                                    key={p.id}
                                                    value={p.id}
                                                >
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="clinicUserId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fisioterapeuta *</FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        disabled={!!lockedClinicUserId}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o fisioterapeuta" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {clinicUsers.map((u) => (
                                                <SelectItem
                                                    key={u.id}
                                                    value={u.id}
                                                >
                                                    {u.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startsAt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Início *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="datetime-local"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="endsAt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Término *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="datetime-local"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: Avaliação inicial"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observações</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Anotações sobre a consulta..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Local</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: Sala 3"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {isEditing && appointment && onStatusChange && (
                            <div className="space-y-2 rounded-md border border-border p-3">
                                <FormLabel>Status</FormLabel>
                                <div className="flex items-center gap-3">
                                    <span
                                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                        style={{
                                            backgroundColor:
                                                STATUS_COLORS[
                                                    appointment.status
                                                ].bg,
                                            color: STATUS_COLORS[
                                                appointment.status
                                            ].text,
                                        }}
                                    >
                                        {STATUS_COLORS[appointment.status]
                                            .label}
                                    </span>
                                    <Select
                                        value={appointment.status}
                                        onValueChange={(v) =>
                                            onStatusChange(
                                                v as AppointmentStatus,
                                            )
                                        }
                                        disabled={
                                            isMutatingStatus || isCancelled
                                        }
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Alterar status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STATUS_OPTIONS.map((s) => (
                                                <SelectItem key={s} value={s}>
                                                    {STATUS_COLORS[s].label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-3 pt-2">
                            {isEditing &&
                            onCancelAppointment &&
                            !isCancelled ? (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => onCancelAppointment()}
                                    disabled={isMutatingStatus}
                                >
                                    Cancelar consulta
                                </Button>
                            ) : (
                                <span />
                            )}
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                >
                                    Fechar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || isCancelled}
                                >
                                    {isEditing ? 'Atualizar' : 'Agendar'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
