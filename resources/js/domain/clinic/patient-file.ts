/** Arquivo do prontuário. Só abre por link assinado, pedido com o login da clínica. */
export interface PatientFile {
    id: number;
    patientId: number;
    clinicUserId: number;
    clinicUser?: { id: number; name: string };
    originalName: string;
    name?: string;
    mimeType: string;
    size: number;
    createdAt: string;
}

/** Link assinado de poucos minutos para abrir o arquivo do prontuário. */
export interface PatientFileLink {
    url: string;
    expiresAt: string;
}
