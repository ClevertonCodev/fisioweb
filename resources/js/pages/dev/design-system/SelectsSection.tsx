import { Tag } from 'lucide-react';
import { useState } from 'react';

import type { SelectOption } from '@/components/ds';
import { DsFieldSelect, DsFieldSelectOptions, DsSelect } from '@/components/ds';

import { CatalogRow, CatalogSection } from './CatalogSection';

const CELL = 'w-full max-w-xs';

const STATES: SelectOption[] = [
    { value: 'sp', label: 'São Paulo' },
    { value: 'rj', label: 'Rio de Janeiro' },
    { value: 'mg', label: 'Minas Gerais' },
    { value: 'rn', label: 'Rio Grande do Norte', disabled: true },
];

const CATEGORIES: SelectOption[] = [
    'Alongamento',
    'Fortalecimento',
    'Equilíbrio',
    'Mobilidade',
    'Respiratório',
    'Propriocepção',
    'Pilates',
    'Hidroterapia',
    'Cardiorrespiratório',
    'Postural',
    'Neurológico',
    'Pediátrico',
].map((label) => ({
    value: label.toLowerCase(),
    label,
}));

const COUNTRIES: SelectOption[] = [
    { value: 'BR', label: 'Brasil', flagCode: 'br' },
    { value: 'PT', label: 'Portugal', flagCode: 'pt' },
    { value: 'AR', label: 'Argentina', flagCode: 'ar' },
    { value: 'US', label: 'Estados Unidos', flagCode: 'us' },
];

export function SelectsSection() {
    const [uf, setUf] = useState<string | string[]>('');
    const [single, setSingle] = useState<string | string[]>('');
    const [multi, setMulti] = useState<string | string[]>(['alongamento']);
    const [search, setSearch] = useState<string | string[]>('');
    const [country, setCountry] = useState<string | string[]>('BR');

    return (
        <CatalogSection
            id="selects"
            title="Selects"
            description="DsSelect é nativo. DsFieldSelect tem lista própria: setas navegam, Enter escolhe, Esc fecha."
        >
            <CatalogRow label="DsSelect (nativo)">
                <div className={CELL}>
                    <DsSelect
                        label="Estado"
                        options={STATES}
                        value={uf}
                        onValueChange={setUf}
                        helper="Usado no endereço"
                    />
                </div>
                <div className={CELL}>
                    <DsSelect
                        label="Com erro"
                        options={STATES}
                        state="error"
                        helper="Escolha o estado"
                    />
                </div>
                <div className={CELL}>
                    <DsSelect
                        label="Pequeno e desabilitado"
                        options={STATES}
                        size="sm"
                        disabled
                    />
                </div>
                <div className={CELL}>
                    <DsSelect label="Múltiplo" options={STATES} multiple />
                </div>
            </CatalogRow>
            <CatalogRow label="DsFieldSelect">
                <div className={CELL}>
                    <DsFieldSelect
                        label="Categoria (single)"
                        options={CATEGORIES}
                        value={single}
                        onValueChange={setSingle}
                    />
                </div>
                <div className={CELL}>
                    <DsFieldSelect
                        label="Categorias (multi)"
                        mode="multi"
                        options={CATEGORIES}
                        value={multi}
                        onValueChange={setMulti}
                        footerLinkLabel="Nova categoria"
                    />
                </div>
                <div className={CELL}>
                    <DsFieldSelect
                        label="Buscar categoria (search)"
                        mode="search"
                        options={CATEGORIES}
                        value={search}
                        onValueChange={setSearch}
                        iconLeft={<Tag />}
                    />
                </div>
                <div className={CELL}>
                    <DsFieldSelect
                        label="Multi com contagem"
                        mode="multi-search"
                        multiDisplay="count"
                        options={CATEGORIES}
                        value={multi}
                        onValueChange={setMulti}
                        hideApplyButton
                    />
                </div>
            </CatalogRow>
            <CatalogRow label="Estados e tamanho">
                <div className={CELL}>
                    <DsFieldSelect
                        label="Com sucesso"
                        options={STATES}
                        value="sp"
                        state="success"
                        helper="Estado confirmado"
                    />
                </div>
                <div className={CELL}>
                    <DsFieldSelect
                        label="Com erro"
                        options={STATES}
                        state="error"
                        helper="Obrigatório"
                    />
                </div>
                <div className={CELL}>
                    <DsFieldSelect label="Pequeno" size="sm" options={STATES} />
                </div>
                <div className={CELL}>
                    <DsFieldSelect
                        label="Desabilitado"
                        options={STATES}
                        disabled
                    />
                </div>
            </CatalogRow>
            <CatalogRow label="DsFieldSelectOptions (bandeiras)">
                <div className={CELL}>
                    <DsFieldSelectOptions
                        label="País"
                        mode="search"
                        options={COUNTRIES}
                        value={country}
                        onValueChange={setCountry}
                    />
                </div>
            </CatalogRow>
        </CatalogSection>
    );
}
