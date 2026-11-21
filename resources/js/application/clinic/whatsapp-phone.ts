const BRAZIL_CODE = '55';

export function whatsappPhoneDigits(phone: string | null | undefined): string {
    const digits = (phone ?? '').replace(/\D/g, '').replace(/^0+/, '');
    if (digits.length < 10) return '';
    if (digits.length <= 11) return `${BRAZIL_CODE}${digits}`;
    return digits;
}
