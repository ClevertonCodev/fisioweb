import { Mail, Search } from 'lucide-react';
import { useState } from 'react';

import type { MoneyCurrency } from '@/components/ds';
import { DsInput, DsMoneyInput, DsTextarea } from '@/components/ds';

import { CatalogRow, CatalogSection } from './CatalogSection';

const CELL = 'w-full max-w-xs';

export function TextFieldsSection() {
    const [search, setSearch] = useState('alongamento');
    const [notes, setNotes] = useState('');
    const [money, setMoney] = useState<Record<MoneyCurrency, number | null>>({
        BRL: 150,
        USD: 0,
        EUR: 1234.5,
    });

    return (
        <CatalogSection
            id="campos-texto"
            title="Campos de texto"
            description="DsInput, DsTextarea e DsMoneyInput. Funcionam com register e Controller do React Hook Form."
        >
            <CatalogRow label="Estados (md)">
                <div className={CELL}>
                    <DsInput
                        label="Nome do paciente"
                        placeholder="Digite o nome"
                        helper="Como aparece na ficha"
                    />
                </div>
                <div className={CELL}>
                    <DsInput
                        label="E-mail"
                        defaultValue="contato@clinica.exemplo"
                        state="success"
                        helper="E-mail válido"
                        iconLeft={<Mail />}
                    />
                </div>
                <div className={CELL}>
                    <DsInput
                        label="CRM"
                        defaultValue="12"
                        state="error"
                        helper="Informe o registro completo"
                    />
                </div>
            </CatalogRow>
            <CatalogRow label="Tamanho sm, disabled e readonly">
                <div className={CELL}>
                    <DsInput label="Pequeno" size="sm" placeholder="sm" />
                </div>
                <div className={CELL}>
                    <DsInput label="Desabilitado" disabled defaultValue="—" />
                </div>
                <div className={CELL}>
                    <DsInput
                        label="Somente leitura"
                        readonly
                        defaultValue="Fixo"
                    />
                </div>
            </CatalogRow>
            <CatalogRow label="Senha e busca">
                <div className={CELL}>
                    <DsInput
                        label="Senha"
                        type="password"
                        defaultValue="segredo"
                    />
                </div>
                <div className={CELL}>
                    <DsInput
                        label="Buscar exercício"
                        type="search"
                        value={search}
                        onValueChange={setSearch}
                        iconLeft={<Search />}
                    />
                </div>
            </CatalogRow>
            <CatalogRow label="Textarea">
                <div className="w-full max-w-md">
                    <DsTextarea
                        label="Evolução da sessão"
                        placeholder="Descreva a sessão"
                        helper="Visível só para a equipe"
                        maxlength={280}
                        value={notes}
                        onValueChange={setNotes}
                    />
                </div>
                <div className="w-full max-w-md">
                    <DsTextarea
                        label="Com erro"
                        state="error"
                        helper="Campo obrigatório"
                    />
                </div>
            </CatalogRow>
            <CatalogRow label="Moeda">
                {(['BRL', 'USD', 'EUR'] as const).map((currency) => (
                    <div key={currency} className={CELL}>
                        <DsMoneyInput
                            label={`Valor (${currency})`}
                            currency={currency}
                            value={money[currency]}
                            onValueChange={(value) =>
                                setMoney((prev) => ({
                                    ...prev,
                                    [currency]: value,
                                }))
                            }
                            helper={`Valor numérico: ${money[currency]}`}
                        />
                    </div>
                ))}
                <div className={CELL}>
                    <DsMoneyInput
                        label="Máx. 4 dígitos"
                        maxDigits={4}
                        size="sm"
                    />
                </div>
            </CatalogRow>
        </CatalogSection>
    );
}
