export interface EvolutionTemplateItem {
    id: number;
    label: string;
    printText: string;
    hasFreeText: boolean;
    freeTextPlaceholder: string | null;
    sortOrder: number;
}

export interface EvolutionTemplateSection {
    id: number;
    title: string;
    sortOrder: number;
    items: EvolutionTemplateItem[];
}

export interface EvolutionTemplate {
    id: number;
    clinicId: number | null;
    name: string;
    description: string | null;
    isSystem: boolean;
    isActive: boolean;
    sections: EvolutionTemplateSection[];
}

export interface EvolutionCheckedItem {
    itemId: number;
    freeTextValue: string | null;
}

export interface PatientEvolution {
    id: number;
    patientId: number;
    clinicUserId: number;
    clinicUser?: { id: number; name: string };
    evolutionTemplateId: number | null;
    template?: { id: number; name: string };
    title: string;
    generatedText: string | null;
    notes: string | null;
    checkedItems: EvolutionCheckedItem[];
    status: 'draft' | 'signed';
    signedAt: string | null;
    createdAt: string;
}
