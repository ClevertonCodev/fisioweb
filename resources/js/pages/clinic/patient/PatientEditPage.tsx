import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
    PATIENT_STATUS_OPTIONS,
    patientFormSchema,
    patientFormTabFields,
    toPatientFormValues,
    toPatientUpdateDto,
    usePatientDetail,
    useUpdatePatient,
    useUploadPatientPhoto,
    type PatientFormValues,
} from '@/application/clinic';
import type { PatientDetail } from '@/domain/clinic/patient';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { PatientFormAddress } from '@/components/clinic/patient/form/PatientFormAddress';
import { PatientFormContact } from '@/components/clinic/patient/form/PatientFormContact';
import { PatientFormInsurance } from '@/components/clinic/patient/form/PatientFormInsurance';
import { PatientFormPersonal } from '@/components/clinic/patient/form/PatientFormPersonal';
import { PatientFormReferral } from '@/components/clinic/patient/form/PatientFormReferral';
import { PatientFormSource } from '@/components/clinic/patient/form/PatientFormSource';
import { PatientPhotoSection } from '@/components/clinic/patient/form/PatientPhotoSection';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TABS = [
    { value: 'dados-pessoais', label: 'Dados pessoais' },
    { value: 'contato', label: 'Contato' },
    { value: 'endereco', label: 'Endereço' },
    { value: 'convenio', label: 'Convênio' },
    { value: 'indicacao', label: 'Indicação de Profissional da Saúde' },
    { value: 'como-conheceu', label: 'Como me conheceu?' },
];

function PatientEditSkeleton() {
    return (
        <ClinicLayout>
            <div className="flex h-full flex-col">
                <header className="bg-background/95 border-border sticky top-0 z-10 border-b backdrop-blur">
                    <div className="px-6 py-4">
                        <Skeleton className="mb-4 h-5 w-16" />
                        <Skeleton className="mb-1 h-8 w-56" />
                        <Skeleton className="mb-4 h-4 w-80" />
                        <div className="flex flex-wrap gap-6 pb-2">
                            {TABS.map((tab) => (
                                <Skeleton key={tab.value} className="h-5 w-32" />
                            ))}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-3xl space-y-6">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-9 w-40" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-64" />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </ClinicLayout>
    );
}

export default function PatientEditPage() {
    const { id } = useParams();
    const { data: detail, isLoading } = usePatientDetail(id);

    if (isLoading) {
        return <PatientEditSkeleton />;
    }

    if (!id || !detail) {
        return (
            <ClinicLayout>
                <div className="text-muted-foreground flex h-full items-center justify-center">
                    Paciente não encontrado.
                </div>
            </ClinicLayout>
        );
    }

    return <PatientEditForm id={id} detail={detail} />;
}

function PatientEditForm({ id, detail }: { id: string; detail: PatientDetail }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dados-pessoais');
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    const { mutateAsync: updatePatient, isPending: isUpdating } = useUpdatePatient();
    const { mutateAsync: uploadPhoto, isPending: isUploading } = useUploadPatientPhoto();
    const isPending = isUpdating || isUploading;

    const form = useForm<PatientFormValues>({
        resolver: zodResolver(patientFormSchema),
        defaultValues: toPatientFormValues(detail),
    });

    const {
        handleSubmit,
        formState: { errors },
    } = form;

    const tabsWithErrors = useMemo(() => {
        return Object.entries(patientFormTabFields)
            .filter(([, fields]) =>
                (fields as (keyof PatientFormValues)[]).some((f) => !!errors[f]),
            )
            .map(([tab]) => tab);
    }, [errors]);

    const onSubmit = async (data: PatientFormValues) => {
        try {
            await updatePatient({ id, dto: toPatientUpdateDto(data) });

            if (photoFile) {
                try {
                    await uploadPhoto({ id, file: photoFile });
                } catch {
                    toast.warning(
                        'Paciente atualizado, mas falha ao enviar a foto. Tente novamente.',
                    );
                    navigate(`/clinica/pacientes/${id}`);
                    return;
                }
            }

            toast.success('Paciente atualizado com sucesso');
            navigate(`/clinica/pacientes/${id}`);
        } catch {
            toast.error('Erro ao atualizar paciente. Verifique os dados e tente novamente.');
        }
    };

    return (
        <ClinicLayout>
            <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
                <header className="bg-background/95 border-border sticky top-0 z-10 border-b backdrop-blur">
                    <div className="px-6 py-4">
                        <button
                            type="button"
                            onClick={() => navigate(`/clinica/pacientes/${id}`)}
                            className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1 text-sm"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Voltar
                        </button>
                        <h1 className="text-foreground mb-1 text-2xl font-semibold">
                            Editar paciente
                        </h1>
                        <p className="text-muted-foreground mb-4 text-sm">
                            Atualize as informações do paciente e salve as alterações
                        </p>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="h-auto flex-wrap gap-0 rounded-none bg-transparent p-0">
                                {TABS.map((tab) => (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className="data-[state=active]:border-primary relative rounded-none border-b-2 border-transparent px-4 pt-1 pb-3 text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                    >
                                        {tab.label}
                                        {tabsWithErrors.includes(tab.value) && (
                                            <span className="bg-destructive absolute top-1 right-1 h-1.5 w-1.5 rounded-full" />
                                        )}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-3xl">
                        <div className={activeTab !== 'dados-pessoais' ? 'hidden' : ''}>
                            <PatientPhotoSection
                                value={photoFile}
                                onChange={setPhotoFile}
                                currentPhotoUrl={detail.photoUrl}
                            />
                            <div className="mb-6 flex flex-wrap items-center gap-4">
                                <div className="w-64">
                                    <Controller
                                        name="status"
                                        control={form.control}
                                        render={({ field }) => (
                                            <Select
                                                value={field.value || undefined}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger className="mt-1.5">
                                                    <SelectValue placeholder="Selecione o status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PATIENT_STATUS_OPTIONS.map((opt) => (
                                                        <SelectItem
                                                            key={opt.value}
                                                            value={opt.value}
                                                        >
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>
                            <PatientFormPersonal form={form} />
                        </div>
                        <div className={activeTab !== 'contato' ? 'hidden' : ''}>
                            <PatientFormContact form={form} />
                        </div>
                        <div className={activeTab !== 'endereco' ? 'hidden' : ''}>
                            <PatientFormAddress form={form} />
                        </div>
                        <div className={activeTab !== 'convenio' ? 'hidden' : ''}>
                            <PatientFormInsurance form={form} />
                        </div>
                        <div className={activeTab !== 'indicacao' ? 'hidden' : ''}>
                            <PatientFormReferral />
                        </div>
                        <div className={activeTab !== 'como-conheceu' ? 'hidden' : ''}>
                            <PatientFormSource form={form} />
                        </div>

                        <div className="mt-10 flex justify-end">
                            <Button type="submit" size="lg" className="px-8" disabled={isPending}>
                                {isUpdating
                                    ? 'Salvando...'
                                    : isUploading
                                      ? 'Enviando foto...'
                                      : 'Salvar alterações'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </ClinicLayout>
    );
}
