import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Appointment } from '@/domain/clinic';

interface AppointmentModalProps {
    open: boolean;
    onClose: () => void;
    appointment: Appointment | null;
    initialDate: Date | null;
    patients: { id: string; name: string }[];
    clinicUsers: { id: string; name: string }[];
    onSave: (data: Partial<Appointment>) => void;
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
    onSave,
}: AppointmentModalProps) {
    const isEditing = !!appointment;

    const [patientId, setPatientId] = useState('');
    const [clinicUserId, setClinicUserId] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [endsAt, setEndsAt] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [sendInvite, setSendInvite] = useState(true);
    const [status, setStatus] = useState<Appointment['status']>('scheduled');

    useEffect(() => {
        if (appointment) {
            setPatientId(appointment.patientId);
            setClinicUserId(appointment.clinicUserId);
            setStartsAt(format(new Date(appointment.startsAt), "yyyy-MM-dd'T'HH:mm"));
            setEndsAt(format(new Date(appointment.endsAt), "yyyy-MM-dd'T'HH:mm"));
            setTitle(appointment.title || '');
            setDescription(appointment.description || '');
            setLocation(appointment.location || '');
            setSendInvite(appointment.sendCalendarInvite);
            setStatus(appointment.status);
        } else {
            setPatientId('');
            setClinicUserId('');
            setStartsAt(formatForInput(initialDate));
            setEndsAt(formatForInput(initialDate, 60));
            setTitle('');
            setDescription('');
            setLocation('');
            setSendInvite(true);
            setStatus('scheduled');
        }
    }, [appointment, initialDate, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId || !clinicUserId || !startsAt || !endsAt) {
            toast.error('Preencha todos os campos obrigatórios.');
            return;
        }
        const patient = patients.find((p) => p.id === patientId);
        const user = clinicUsers.find((u) => u.id === clinicUserId);
        onSave({
            id: appointment?.id,
            patientId,
            patientName: patient?.name || '',
            clinicUserId,
            clinicUserName: user?.name || '',
            title: title || null,
            description: description || null,
            startsAt: new Date(startsAt).toISOString(),
            endsAt: new Date(endsAt).toISOString(),
            status,
            location: location || null,
            sendCalendarInvite: sendInvite,
        });
        toast.success(
            isEditing ? 'Consulta atualizada com sucesso!' : 'Consulta agendada com sucesso!',
        );
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Consulta' : 'Nova Consulta'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Paciente *</Label>
                        <Select value={patientId} onValueChange={setPatientId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o paciente" />
                            </SelectTrigger>
                            <SelectContent>
                                {patients.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Fisioterapeuta *</Label>
                        <Select value={clinicUserId} onValueChange={setClinicUserId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o fisioterapeuta" />
                            </SelectTrigger>
                            <SelectContent>
                                {clinicUsers.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>
                                        {u.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Início *</Label>
                            <Input
                                type="datetime-local"
                                value={startsAt}
                                onChange={(e) => setStartsAt(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Término *</Label>
                            <Input
                                type="datetime-local"
                                value={endsAt}
                                onChange={(e) => setEndsAt(e.target.value)}
                            />
                        </div>
                    </div>

                    {isEditing && (
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={status}
                                onValueChange={(v) => setStatus(v as Appointment['status'])}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="scheduled">Agendada</SelectItem>
                                    <SelectItem value="confirmed">Confirmada</SelectItem>
                                    <SelectItem value="completed">Concluída</SelectItem>
                                    <SelectItem value="no_show">Não compareceu</SelectItem>
                                    <SelectItem value="cancelled">Cancelada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Avaliação inicial"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Anotações sobre a consulta..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Local</Label>
                        <Input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Ex: Sala 3"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="send_invite"
                            checked={sendInvite}
                            onCheckedChange={(v) => setSendInvite(!!v)}
                        />
                        <Label
                            htmlFor="send_invite"
                            className="text-muted-foreground text-sm font-normal"
                        >
                            Enviar convite para o paciente via Google Calendar
                        </Label>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit">{isEditing ? 'Atualizar' : 'Agendar'}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
