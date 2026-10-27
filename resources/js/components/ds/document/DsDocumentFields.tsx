import {
    formatCnh,
    formatCnpj,
    formatCpf,
    formatPassport,
    formatRg,
} from './brazilian-document';
import { DsDocumentField } from './DsDocumentField';
import type {
    CnhFieldProps,
    CnpjFieldProps,
    CpfFieldProps,
    PassportFieldProps,
    RgFieldProps,
} from './types';

export function DsCpfField({
    placeholder = '000.000.000-00',
    ...props
}: CpfFieldProps) {
    return (
        <DsDocumentField
            {...props}
            placeholder={placeholder}
            format={formatCpf}
            inputMode="numeric"
        />
    );
}

export function DsCnpjField({
    placeholder = '00.000.000/0000-00',
    ...props
}: CnpjFieldProps) {
    return (
        <DsDocumentField
            {...props}
            placeholder={placeholder}
            format={formatCnpj}
            inputMode="text"
            autoCapitalize="characters"
        />
    );
}

export function DsRgField({
    placeholder = '00.000.000-0',
    ...props
}: RgFieldProps) {
    return (
        <DsDocumentField
            {...props}
            placeholder={placeholder}
            format={formatRg}
            inputMode="text"
        />
    );
}

export function DsCnhField({
    placeholder = '00000000000',
    ...props
}: CnhFieldProps) {
    return (
        <DsDocumentField
            {...props}
            placeholder={placeholder}
            format={formatCnh}
            inputMode="numeric"
        />
    );
}

export function DsPassportField({
    placeholder = 'AB123456',
    ...props
}: PassportFieldProps) {
    return (
        <DsDocumentField
            {...props}
            placeholder={placeholder}
            format={formatPassport}
            inputMode="text"
            autoCapitalize="characters"
        />
    );
}
