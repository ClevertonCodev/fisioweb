import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
    patientFormDefaults,
    patientFormSchema,
    patientFormTabFields,
    toPatientWriteDto,
    useCreatePatient,
    useUploadPatientPhoto,
    type PatientFormValues,
} from '@/application/clinic';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { PatientFormAddress } from '@/components/clinic/patient/form/PatientFormAddress';
import { PatientFormContact } from '@/components/clinic/patient/form/PatientFormContact';
import { PatientFormInsurance } from '@/components/clinic/patient/form/PatientFormInsurance';
import { PatientFormPersonal } from '@/components/clinic/patient/form/PatientFormPersonal';
import { PatientFormReferral } from '@/components/clinic/patient/form/PatientFormReferral';
import { PatientFormSource } from '@/components/clinic/patient/form/PatientFormSource';
import { PatientPhotoSection } from '@/components/clinic/patient/form/PatientPhotoSection';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TABS = [
    { value: 'dados-pessoais', label: 'Dados pessoais' },
    { value: 'contato', label: 'Contato' },
    { value: 'endereco', label: 'Endereço' },
    { value: 'convenio', label: 'Convênio' },
    { value: 'indicacao', label: 'Indicação de Profissional da Saúde' },
    { value: 'como-conheceu', label: 'Como me conheceu?' },
];

export default function PatientNewPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dados-pessoais');
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    const { mutateAsync: createPatient, isPending: isCreating } =
        useCreatePatient();
    const { mutateAsync: uploadPhoto, isPending: isUploading } =
        useUploadPatientPhoto();
    const isPending = isCreating || isUploading;

    const form = useForm<PatientFormValues>({
        resolver: zodResolver(patientFormSchema),
        defaultValues: patientFormDefaults,
    });

    const {
        handleSubmit,
        formState: { errors },
    } = form;

    const tabsWithErrors = useMemo(() => {
        return Object.entries(patientFormTabFields)
            .filter(([, fields]) =>
                (fields as (keyof PatientFormValues)[]).some(
                    (f) => !!errors[f],
                ),
            )
            .map(([tab]) => tab);
    }, [errors]);

    const onSubmit = async (data: PatientFormValues) => {
        try {
            const patient = await createPatient(toPatientWriteDto(data));

            if (photoFile) {
                try {
                    await uploadPhoto({ id: patient.id, file: photoFile });
                } catch {
                    toast.warning(
                        'Paciente criado, mas falha ao enviar a foto. Você pode tentar novamente na edição.',
                    );
                    navigate('/clinica/pacientes');
                    return;
                }
            }

            toast.success('Paciente cadastrado com sucesso');
            navigate('/clinica/pacientes');
        } catch {
            toast.error(
                'Erro ao cadastrar paciente. Verifique os dados e tente novamente.',
            );
        }
    };

    return (
        <ClinicLayout>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex h-full flex-col"
            >
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="px-6 py-4">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h1 className="mb-1 text-2xl font-semibold text-foreground">
                                    Adicionar paciente
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Crie as informações de seu paciente e salve
                                    as alterações
                                </p>
                            </div>
                            <BackButton
                                to="/clinica/pacientes"
                                className="shrink-0"
                            />
                        </div>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="h-auto flex-wrap gap-0 rounded-none bg-transparent p-0">
                                {TABS.map((tab) => (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className="relative rounded-none border-b-2 border-transparent px-4 pt-1 pb-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                    >
                                        {tab.label}
                                        {tabsWithErrors.includes(tab.value) && (
                                            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-destructive" />
                                        )}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-3xl">
                        <div
                            className={
                                activeTab !== 'dados-pessoais' ? 'hidden' : ''
                            }
                        >
                            <PatientPhotoSection
                                value={photoFile}
                                onChange={setPhotoFile}
                            />
                            <div className="mb-6 flex flex-wrap items-center gap-4">
                                <div className="w-64">
                                    <Controller
                                        name="status"
                                        control={form.control}
                                        render={({ field }) => (
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger className="mt-1.5">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="em_tratamento">
                                                        Em tratamento
                                                    </SelectItem>
                                                    <SelectItem value="em_prevencao">
                                                        Em prevenção
                                                    </SelectItem>
                                                    <SelectItem value="alta">
                                                        Alta
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>
                            <PatientFormPersonal form={form} />
                        </div>
                        <div
                            className={activeTab !== 'contato' ? 'hidden' : ''}
                        >
                            <PatientFormContact form={form} />
                        </div>
                        <div
                            className={activeTab !== 'endereco' ? 'hidden' : ''}
                        >
                            <PatientFormAddress form={form} />
                        </div>
                        <div
                            className={activeTab !== 'convenio' ? 'hidden' : ''}
                        >
                            <PatientFormInsurance form={form} />
                        </div>
                        <div
                            className={
                                activeTab !== 'indicacao' ? 'hidden' : ''
                            }
                        >
                            <PatientFormReferral />
                        </div>
                        <div
                            className={
                                activeTab !== 'como-conheceu' ? 'hidden' : ''
                            }
                        >
                            <PatientFormSource form={form} />
                        </div>

                        <div className="mt-10 flex justify-end">
                            <Button
                                type="submit"
                                size="lg"
                                className="px-8"
                                disabled={isPending}
                            >
                                {isCreating
                                    ? 'Criando paciente...'
                                    : isUploading
                                      ? 'Enviando foto...'
                                      : 'Concluir cadastro'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </ClinicLayout>
    );
}
