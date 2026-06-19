/** Dashboard da clínica — entidades puras (camelCase) */

export type DashboardScope = 'clinic' | 'mine';

export interface DashboardViewer {
    role: string;
    canToggleScope: boolean;
    canChooseProfessional: boolean;
    canViewActivities: boolean;
    currentScope: DashboardScope;
}

export interface AvailableExercises {
    count: number;
    categoriesCount: number;
}

export interface DashboardCards {
    activePatients: number;
    appointmentsToday: number;
    activePrograms: number;
    availableExercises: AvailableExercises;
}

export interface DashboardUpcomingAppointment {
    id: string;
    patientName: string;
    patientPhotoUrl?: string;
    title: string;
    startsAt: string;
    status: string;
}

export interface Birthday {
    patientId: string;
    name: string;
    photoUrl?: string;
    day: number;
    phone?: string;
    canMessage: boolean;
}

export interface DashboardBirthdays {
    total: number;
    items: Birthday[];
}

export interface DashboardSummary {
    viewer: DashboardViewer;
    cards: DashboardCards;
    upcomingAppointments: DashboardUpcomingAppointment[];
    birthdays: DashboardBirthdays;
}

export type OccupancyGranularity = 'daily' | 'weekly' | 'monthly';

export interface OccupancyBucket {
    label: string;
    rate: number;
}

export interface OccupancyRate {
    clinicUserId: string;
    granularity: OccupancyGranularity;
    occupiedRate: number;
    buckets: OccupancyBucket[];
}
