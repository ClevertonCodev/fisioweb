/** Tipo de serviço da clínica: atalho do modal de consulta com duração padrão. */
export interface ServiceType {
    id: string;
    name: string;
    durationMinutes: number;
    position: number;
}

/** Item da lista enviada para substituir os tipos (sem `id` = tipo novo). */
export interface ServiceTypeDraft {
    id?: string;
    name: string;
    durationMinutes: number;
}
