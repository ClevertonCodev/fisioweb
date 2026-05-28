export interface PatientFile {
    id: number;
    patientId: number;
    clinicUserId: number;
    clinicUser?: { id: number; name: string };
    originalName: string;
    name?: string;
    cdnUrl: string;
    mimeType: string;
    size: number;
    createdAt: string;
}
