import { useState } from 'react';

import {
    DsCnhField,
    DsCnpjField,
    DsCountrySelect,
    DsCpfField,
    DsPassportField,
    DsPhoneField,
    DsRgField,
    getCnpjValidationError,
    getCpfValidationError,
    getPhoneValidationError,
} from '@/components/ds';

import { CatalogRow, CatalogSection } from './CatalogSection';

const CELL = 'w-full max-w-xs';

// Só documentos fictícios.
export function DocumentsSection() {
    const [cpf, setCpf] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [country, setCountry] = useState('BR');
    const [phone, setPhone] = useState('');
    const phoneError = getPhoneValidationError(phone);
    const cpfError = getCpfValidationError(cpf);
    const cnpjError = getCnpjValidationError(cnpj);

    return (
        <CatalogSection
            id="documentos"
            title="Documentos, país e telefone"
            description="Máscara ao digitar e ao colar, cursor preservado ao editar no meio. Use só documentos fictícios."
        >
            <CatalogRow label="CPF e CNPJ (com validação)">
                <div className={CELL}>
                    <DsCpfField
                        label="CPF"
                        required
                        value={cpf}
                        onValueChange={setCpf}
                        invalid={cpf.length > 0 && !!cpfError}
                        helperText={cpfError}
                    />
                </div>
                <div className={CELL}>
                    <DsCnpjField
                        label="CNPJ"
                        value={cnpj}
                        onValueChange={setCnpj}
                        invalid={cnpj.length > 0 && !!cnpjError}
                        helperText={cnpjError}
                    />
                </div>
            </CatalogRow>
            <CatalogRow label="RG, CNH e passaporte">
                <div className={CELL}>
                    <DsRgField label="RG" defaultValue="MG-12.345.678" />
                </div>
                <div className={CELL}>
                    <DsCnhField label="CNH" />
                </div>
                <div className={CELL}>
                    <DsPassportField label="Passaporte" />
                </div>
            </CatalogRow>
            <CatalogRow label="Sem label, inválido e desabilitado">
                <div className={CELL}>
                    <DsCpfField aria-label="CPF sem label" />
                </div>
                <div className={CELL}>
                    <DsCpfField
                        label="CPF"
                        defaultValue="111.111.111-11"
                        invalid
                        helperText="CPF inválido"
                    />
                </div>
                <div className={CELL}>
                    <DsCnpjField
                        label="CNPJ"
                        disabled
                        defaultValue="11.222.333/0001-81"
                    />
                </div>
            </CatalogRow>
            <CatalogRow label="País e telefone">
                <div className={CELL}>
                    <DsCountrySelect
                        label="País de origem"
                        value={country}
                        onValueChange={setCountry}
                    />
                </div>
                <div className={CELL}>
                    <DsPhoneField
                        label="Telefone"
                        value={phone}
                        onValueChange={setPhone}
                        invalid={phone.length > 0 && !!phoneError}
                        helperText={phoneError}
                    />
                </div>
                <div className={CELL}>
                    <DsPhoneField
                        label="Telefone (nacional)"
                        showCountrySelector={false}
                    />
                </div>
            </CatalogRow>
        </CatalogSection>
    );
}
