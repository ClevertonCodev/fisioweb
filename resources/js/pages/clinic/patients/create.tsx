import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Smile } from 'lucide-react';
import { useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClinicLayout from '@/layouts/clinic-layout';

type FormData = {
    name: string;
    cpf: string;
    email: string;
    phone: string;
    gender: string;
    biological_sex: string;
    birth_date: string;
    marital_status: string;
    education: string;
    profession: string;
    emergency_contact: string;
    caregiver_contact: string;
    insurance: string;
    insurance_number: string;
    zip_code: string;
    address: string;
    city: string;
    state: string;
    referral_source: string;
};

const TABS = [
    { value: 'dados-pessoais', label: 'Dados pessoais' },
    { value: 'contato', label: 'Contato' },
    { value: 'endereco', label: 'Endereço' },
    { value: 'convenio', label: 'Convênio' },
    { value: 'como-conheceu', label: 'Como me conheceu?' },
    { value: 'indicacao', label: 'Indicação de Profissional da Saúde' },
] as const;

type TabValue = (typeof TABS)[number]['value'];

const STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
    'SP', 'SE', 'TO',
];

export default function PatientsCreate() {
    const [activeTab, setActiveTab] = useState<TabValue>('dados-pessoais');

    const { data, setData, post, processing, errors } = useForm<FormData>({
        name: '',
        cpf: '',
        email: '',
        phone: '',
        gender: '',
        biological_sex: '',
        birth_date: '',
        marital_status: '',
        education: '',
        profession: '',
        emergency_contact: '',
        caregiver_contact: '',
        insurance: '',
        insurance_number: '',
        zip_code: '',
        address: '',
        city: '',
        state: '',
        referral_source: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/clinic/patients');
    };

    return (
        <ClinicLayout>
            <Head title="Novo paciente" />
            <div className="flex h-full flex-col">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="px-6 py-4">
                        <Link
                            href="/clinic/patients"
                            className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Voltar
                        </Link>
                        <h1 className="mb-1 text-2xl font-semibold text-foreground">
                            Adicionar paciente
                        </h1>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Crie as informações de seu paciente e salve as alterações
                        </p>

                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
                            <TabsList className="h-auto flex-wrap gap-0 rounded-none bg-transparent p-0">
                                {TABS.map((tab) => (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-1 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                    >
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                </header>

                {/* Formulário */}
                <div className="flex-1 overflow-auto p-6">
                    <form onSubmit={handleSubmit} className="flex min-h-full max-w-3xl flex-col">
                        {/* Conteúdo da aba — preenche o espaço disponível */}
                        <div className="flex-1">
                        {/* ── Dados pessoais ── */}
                        {activeTab === 'dados-pessoais' && (
                            <div className="space-y-6">
                                {/* Foto */}
                                <div className="flex items-center gap-6">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                                        <Smile className="h-10 w-10 text-primary/40" />
                                    </div>
                                    <div>
                                        <p className="mb-2 text-sm text-muted-foreground">
                                            Tamanho máximo: 2MB
                                        </p>
                                        <Button variant="outline" size="sm" type="button">
                                            Escolher uma foto
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-end gap-4">
                                    <div className="w-64">
                                        <Label className="text-xs text-muted-foreground">
                                            Status
                                        </Label>
                                        <Select defaultValue="ativo">
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ativo">Ativo</SelectItem>
                                                <SelectItem value="inativo">Inativo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="w-64">
                                    <Input placeholder="Resumo do diagnóstico" />
                                </div>

                                <h2 className="text-lg font-semibold text-foreground">
                                    Dados pessoais
                                </h2>

                                <div className="flex items-center gap-2">
                                    <Switch id="estrangeiro" />
                                    <Label htmlFor="estrangeiro" className="text-sm">
                                        Pessoa estrangeira
                                    </Label>
                                </div>

                                <div>
                                    <Input
                                        placeholder="Nome completo *"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                    />
                                    <InputError message={errors.name} className="mt-1" />
                                </div>

                                <Input placeholder="Apelido" />

                                <div className="flex items-center gap-2">
                                    <Switch id="apelido" />
                                    <div>
                                        <Label htmlFor="apelido" className="text-sm font-medium">
                                            Substituir nome pelo apelido em todo o sistema
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Ative para que o apelido apareça no lugar do nome
                                            oficial nas telas do sistema
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Input
                                            placeholder="CPF"
                                            value={data.cpf}
                                            onChange={(e) => setData('cpf', e.target.value)}
                                        />
                                        <InputError message={errors.cpf} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">
                                            Estado civil
                                        </Label>
                                        <Select
                                            value={data.marital_status}
                                            onValueChange={(v) => setData('marital_status', v)}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Selecione uma opção" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                                                <SelectItem value="casado">Casado(a)</SelectItem>
                                                <SelectItem value="divorciado">
                                                    Divorciado(a)
                                                </SelectItem>
                                                <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                                                <SelectItem value="uniao_estavel">
                                                    União estável
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={errors.marital_status}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Input
                                            placeholder="Profissão"
                                            value={data.profession}
                                            onChange={(e) => setData('profession', e.target.value)}
                                        />
                                        <InputError message={errors.profession} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">
                                            Sexo biológico
                                        </Label>
                                        <Select
                                            value={data.biological_sex}
                                            onValueChange={(v) => setData('biological_sex', v)}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Selecione uma opção" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="masculino">Masculino</SelectItem>
                                                <SelectItem value="feminino">Feminino</SelectItem>
                                                <SelectItem value="intersexo">Intersexo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={errors.biological_sex}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">
                                            Gênero
                                        </Label>
                                        <Select
                                            value={data.gender}
                                            onValueChange={(v) => setData('gender', v)}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Selecione uma opção" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="masculino">Masculino</SelectItem>
                                                <SelectItem value="feminino">Feminino</SelectItem>
                                                <SelectItem value="nao_binario">
                                                    Não-binário
                                                </SelectItem>
                                                <SelectItem value="outro">Outro</SelectItem>
                                                <SelectItem value="prefiro_nao_informar">
                                                    Prefiro não informar
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.gender} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">
                                            Data de nascimento
                                        </Label>
                                        <Input
                                            type="date"
                                            className="mt-1"
                                            value={data.birth_date}
                                            onChange={(e) => setData('birth_date', e.target.value)}
                                        />
                                        <InputError message={errors.birth_date} className="mt-1" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">
                                            Escolaridade
                                        </Label>
                                        <Select
                                            value={data.education}
                                            onValueChange={(v) => setData('education', v)}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Selecione uma opção" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fundamental">
                                                    Ensino Fundamental
                                                </SelectItem>
                                                <SelectItem value="medio">Ensino Médio</SelectItem>
                                                <SelectItem value="superior">
                                                    Ensino Superior
                                                </SelectItem>
                                                <SelectItem value="pos">Pós-graduação</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.education} className="mt-1" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Contato ── */}
                        {activeTab === 'contato' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-foreground">Contato</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Input
                                            placeholder="Telefone de contato"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                        />
                                        <InputError message={errors.phone} className="mt-1" />
                                    </div>
                                    <div>
                                        <Input
                                            type="email"
                                            placeholder="E-mail"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                        <InputError message={errors.email} className="mt-1" />
                                    </div>
                                </div>
                                <Button variant="outline" type="button" className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Adicionar contato
                                </Button>

                                <div className="mt-8 space-y-4">
                                    <h3 className="text-base font-semibold text-foreground">
                                        Contatos de emergência
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Input
                                                placeholder="Contato de emergência"
                                                value={data.emergency_contact}
                                                onChange={(e) =>
                                                    setData('emergency_contact', e.target.value)
                                                }
                                            />
                                            <InputError
                                                message={errors.emergency_contact}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                placeholder="Contato do cuidador"
                                                value={data.caregiver_contact}
                                                onChange={(e) =>
                                                    setData('caregiver_contact', e.target.value)
                                                }
                                            />
                                            <InputError
                                                message={errors.caregiver_contact}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Endereço ── */}
                        {activeTab === 'endereco' && (
                            <div className="space-y-8">
                                {/* Endereço residencial */}
                                <div className="space-y-6">
                                    <h2 className="text-lg font-semibold text-foreground">
                                        Endereço
                                    </h2>

                                    <div className="flex items-center gap-2">
                                        <Switch id="local-atendimento" />
                                        <Label htmlFor="local-atendimento" className="text-sm">
                                            Esse é o local de atendimento
                                        </Label>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-64">
                                            <Input
                                                placeholder="CEP"
                                                value={data.zip_code}
                                                onChange={(e) =>
                                                    setData('zip_code', e.target.value)
                                                }
                                            />
                                            <InputError
                                                message={errors.zip_code}
                                                className="mt-1"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="whitespace-nowrap text-sm text-primary hover:underline"
                                        >
                                            Não sei meu CEP
                                        </button>
                                    </div>

                                    <div>
                                        <Input
                                            placeholder="Rua/Avenida"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                        />
                                        <InputError message={errors.address} className="mt-1" />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <Input
                                                placeholder="Cidade"
                                                value={data.city}
                                                onChange={(e) => setData('city', e.target.value)}
                                            />
                                            <InputError message={errors.city} className="mt-1" />
                                        </div>
                                        <div>
                                            <Select
                                                value={data.state}
                                                onValueChange={(v) => setData('state', v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Estado (UF)" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATES.map((uf) => (
                                                        <SelectItem key={uf} value={uf}>
                                                            {uf}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.state} className="mt-1" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox id="sem-numero" />
                                            <Label htmlFor="sem-numero" className="text-xs">
                                                Sem número
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                {/* Endereço comercial */}
                                <div className="space-y-6 border-t border-border pt-8">
                                    <h2 className="text-lg font-semibold text-foreground">
                                        Endereço comercial
                                    </h2>

                                    <div className="flex items-center gap-4">
                                        <Input placeholder="CEP" className="w-64" />
                                        <button
                                            type="button"
                                            className="whitespace-nowrap text-sm text-primary hover:underline"
                                        >
                                            Não sei meu CEP
                                        </button>
                                    </div>

                                    <Input placeholder="Rua/Avenida" />

                                    <div className="grid grid-cols-3 gap-4">
                                        <Input placeholder="Cidade" />
                                        <Input placeholder="Estado (UF)" />
                                        <div className="flex items-center gap-2">
                                            <Checkbox id="sem-numero-com" />
                                            <Label htmlFor="sem-numero-com" className="text-xs">
                                                Sem número
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Convênio ── */}
                        {activeTab === 'convenio' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-foreground">Convênio</h2>
                                <div className="flex items-center gap-2">
                                    <Switch id="convenio" />
                                    <Label htmlFor="convenio" className="text-sm">
                                        Com convênio
                                    </Label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Input
                                            placeholder="Nome do convênio"
                                            value={data.insurance}
                                            onChange={(e) => setData('insurance', e.target.value)}
                                        />
                                        <InputError message={errors.insurance} className="mt-1" />
                                    </div>
                                    <div>
                                        <Input
                                            placeholder="Número da carteirinha"
                                            value={data.insurance_number}
                                            onChange={(e) =>
                                                setData('insurance_number', e.target.value)
                                            }
                                        />
                                        <InputError
                                            message={errors.insurance_number}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Como me conheceu ── */}
                        {activeTab === 'como-conheceu' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-foreground">
                                    Como me conheceu?
                                </h2>
                                <div>
                                    <Label className="text-xs text-muted-foreground">
                                        Tipo de indicação
                                    </Label>
                                    <Select
                                        value={data.referral_source}
                                        onValueChange={(v) => setData('referral_source', v)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Selecione uma opção" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="google">Google</SelectItem>
                                            <SelectItem value="instagram">Instagram</SelectItem>
                                            <SelectItem value="indicacao_amigo">
                                                Indicação de amigo
                                            </SelectItem>
                                            <SelectItem value="indicacao_profissional">
                                                Indicação profissional
                                            </SelectItem>
                                            <SelectItem value="outro">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.referral_source} className="mt-1" />
                                </div>
                            </div>
                        )}

                        {/* ── Indicação de profissional ── */}
                        {activeTab === 'indicacao' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-foreground">
                                    Indicação de Profissional da Saúde
                                </h2>
                                <Input placeholder="Escolha o profissional da saúde" />
                                <Button variant="outline" type="button" className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Adicionar profissional da saúde
                                </Button>
                            </div>
                        )}

                        </div>{/* fim flex-1 */}

                        {/* Submit */}
                        <div className="mt-10 flex justify-end">
                            <Button type="submit" size="lg" className="px-8" disabled={processing}>
                                {processing ? 'Salvando...' : 'Concluir cadastro'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </ClinicLayout>
    );
}
