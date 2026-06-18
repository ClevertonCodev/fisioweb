import { Controller, type UseFormReturn } from 'react-hook-form';

import type { PatientFormValues } from '@/application/clinic';
import { CpfCnpjInput } from '@/components/ui/cpf-cnpj-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { FieldError, Req } from './shared';

type Props = { form: UseFormReturn<PatientFormValues> };

export function PatientFormPersonal({ form }: Props) {
    const {
        register,
        control,
        watch,
        formState: { errors },
    } = form;
    const isForeign = watch('is_foreign');

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">
                Dados pessoais
            </h2>

            <Controller
                name="is_foreign"
                control={control}
                render={({ field }) => (
                    <div className="flex items-center gap-2">
                        <Switch
                            id="estrangeiro"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="estrangeiro" className="text-sm">
                            Pessoa estrangeira
                        </Label>
                    </div>
                )}
            />

            <div>
                <Label className="text-xs text-muted-foreground" htmlFor="name">
                    Nome completo
                    <Req />
                </Label>
                <Input
                    id="name"
                    className="mt-1.5"
                    placeholder="Nome completo"
                    {...register('name')}
                />
                <FieldError message={errors.name?.message} />
            </div>

            <div>
                <Label
                    className="text-xs text-muted-foreground"
                    htmlFor="apelido"
                >
                    Apelido
                </Label>
                <Input
                    id="apelido"
                    className="mt-1.5"
                    placeholder="Apelido"
                    {...register('apelido')}
                />
            </div>

            <Controller
                name="use_apelido"
                control={control}
                render={({ field }) => (
                    <div className="flex items-center gap-2">
                        <Switch
                            id="use_apelido"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                        <div>
                            <Label
                                htmlFor="use_apelido"
                                className="text-sm font-medium"
                            >
                                Substituir nome pelo apelido em todo o sistema
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Ative para que o apelido apareça no lugar do
                                nome oficial nas telas do sistema
                            </p>
                        </div>
                    </div>
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label
                        className="text-xs text-muted-foreground"
                        htmlFor="cpf"
                    >
                        {isForeign ? 'Documento' : 'CPF'}
                        <Req />
                    </Label>
                    {isForeign ? (
                        <Input
                            id="cpf"
                            className="mt-1.5"
                            placeholder="Número do documento"
                            {...register('cpf')}
                        />
                    ) : (
                        <Controller
                            name="cpf"
                            control={control}
                            render={({ field }) => (
                                <CpfCnpjInput
                                    id="cpf"
                                    type="cpf"
                                    value={field.value}
                                    onChange={field.onChange}
                                    className="mt-1.5"
                                />
                            )}
                        />
                    )}
                    <FieldError message={errors.cpf?.message} />
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground">
                        Estado civil
                    </Label>
                    <Controller
                        name="marital_status"
                        control={control}
                        render={({ field }) => (
                            <Select
                                value={field.value || undefined}
                                onValueChange={field.onChange}
                            >
                                <SelectTrigger className="mt-1.5">
                                    <SelectValue placeholder="Selecione uma opção" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="solteiro">
                                        Solteiro(a)
                                    </SelectItem>
                                    <SelectItem value="casado">
                                        Casado(a)
                                    </SelectItem>
                                    <SelectItem value="divorciado">
                                        Divorciado(a)
                                    </SelectItem>
                                    <SelectItem value="viuvo">
                                        Viúvo(a)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label
                        className="text-xs text-muted-foreground"
                        htmlFor="profession"
                    >
                        Profissão
                    </Label>
                    <Input
                        id="profession"
                        className="mt-1.5"
                        placeholder="Ex.: Fisioterapeuta"
                        {...register('profession')}
                    />
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground">
                        Sexo biológico
                    </Label>
                    <Controller
                        name="biological_sex"
                        control={control}
                        render={({ field }) => (
                            <Select
                                value={field.value || undefined}
                                onValueChange={field.onChange}
                            >
                                <SelectTrigger className="mt-1.5">
                                    <SelectValue placeholder="Selecione uma opção" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="masculino">
                                        Masculino
                                    </SelectItem>
                                    <SelectItem value="feminino">
                                        Feminino
                                    </SelectItem>
                                    <SelectItem value="intersexo">
                                        Intersexo
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            </div>

            <div>
                <Label className="text-xs text-muted-foreground">Gênero</Label>
                <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                        <Select
                            value={field.value || undefined}
                            onValueChange={field.onChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma opção" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="homem">Homem</SelectItem>
                                <SelectItem value="mulher">Mulher</SelectItem>
                                <SelectItem value="nao-binario">
                                    Não-binário
                                </SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-xs text-muted-foreground">
                        Escolaridade
                    </Label>
                    <Controller
                        name="education"
                        control={control}
                        render={({ field }) => (
                            <Select
                                value={field.value || undefined}
                                onValueChange={field.onChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma opção" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fundamental">
                                        Ensino Fundamental
                                    </SelectItem>
                                    <SelectItem value="medio">
                                        Ensino Médio
                                    </SelectItem>
                                    <SelectItem value="superior">
                                        Ensino Superior
                                    </SelectItem>
                                    <SelectItem value="pos">
                                        Pós-graduação
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                <div>
                    <Label
                        className="text-xs text-muted-foreground"
                        htmlFor="birth_date"
                    >
                        Data de nascimento
                        <Req />
                    </Label>
                    <Input
                        id="birth_date"
                        type="date"
                        className="mt-1.5"
                        {...register('birth_date')}
                    />
                    <FieldError message={errors.birth_date?.message} />
                </div>
            </div>

            <div>
                <Label
                    className="text-xs text-muted-foreground"
                    htmlFor="diagnosis"
                >
                    Resumo do diagnóstico
                </Label>
                <Textarea
                    id="diagnosis"
                    className="mt-1.5"
                    placeholder="Ex.: Lombalgia crônica pós-cirúrgica"
                    rows={3}
                    maxLength={500}
                    {...register('diagnosis')}
                />
                <FieldError message={errors.diagnosis?.message} />
            </div>
        </div>
    );
}
