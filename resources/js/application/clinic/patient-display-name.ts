/** Nome que as telas mostram quando "usar apelido" está ligado. */
export function patientDisplayName(input: {
    name: string;
    apelido?: string | null;
    useApelido?: boolean;
}): string {
    const nick = input.apelido?.trim() ?? '';
    if (input.useApelido && nick !== '') {
        return nick;
    }

    return input.name.trim();
}
