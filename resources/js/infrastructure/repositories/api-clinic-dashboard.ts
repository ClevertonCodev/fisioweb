import type { DashboardRepository } from '@/application/clinic/ports';
import type {
    Activity,
    DashboardScope,
    DashboardSummary,
    DashboardUpcomingAppointment,
    OccupancyGranularity,
    OccupancyRate,
    PatientAcquisition,
} from '@/domain/clinic/dashboard';
import { apiClient } from '@/infrastructure/api/client';

interface ApiViewer {
    role: string;
    can_toggle_scope: boolean;
    can_choose_professional: boolean;
    can_view_activities: boolean;
    current_scope: DashboardScope;
}

interface ApiUpcomingAppointment {
    id: number;
    patient_name: string;
    patient_photo_url: string | null;
    title: string | null;
    starts_at: string;
    status: string;
}

interface ApiBirthday {
    patient_id: number;
    name: string;
    photo_url: string | null;
    day: number;
    phone: string | null;
    can_message: boolean;
}

interface ApiSummary {
    viewer: ApiViewer;
    cards: {
        active_patients: number;
        appointments_today: number;
        active_programs: number;
        available_exercises: { count: number; categories_count: number };
    };
    upcoming_appointments: ApiUpcomingAppointment[];
    birthdays: { total: number; items: ApiBirthday[] };
}

function toUpcoming(
    raw: ApiUpcomingAppointment,
): DashboardUpcomingAppointment {
    return {
        id: String(raw.id),
        patientName: raw.patient_name,
        patientPhotoUrl: raw.patient_photo_url ?? undefined,
        title: raw.title ?? '',
        startsAt: raw.starts_at,
        status: raw.status,
    };
}

function toEntity(raw: ApiSummary): DashboardSummary {
    return {
        viewer: {
            role: raw.viewer.role,
            canToggleScope: raw.viewer.can_toggle_scope,
            canChooseProfessional: raw.viewer.can_choose_professional,
            canViewActivities: raw.viewer.can_view_activities,
            currentScope: raw.viewer.current_scope,
        },
        cards: {
            activePatients: raw.cards.active_patients,
            appointmentsToday: raw.cards.appointments_today,
            activePrograms: raw.cards.active_programs,
            availableExercises: {
                count: raw.cards.available_exercises.count,
                categoriesCount: raw.cards.available_exercises.categories_count,
            },
        },
        upcomingAppointments: raw.upcoming_appointments.map(toUpcoming),
        birthdays: {
            total: raw.birthdays.total,
            items: raw.birthdays.items.map((b) => ({
                patientId: String(b.patient_id),
                name: b.name,
                photoUrl: b.photo_url ?? undefined,
                day: b.day,
                phone: b.phone ?? undefined,
                canMessage: b.can_message,
            })),
        },
    };
}

interface ApiOccupancyRate {
    clinic_user_id: number;
    granularity: OccupancyGranularity;
    occupied_rate: number;
    buckets: { label: string; rate: number }[];
}

interface ApiActivity {
    id: number;
    type: string;
    description: string;
    actor_name: string | null;
    created_at: string;
}

interface ApiAcquisition {
    years: number[];
    sources: {
        source: string;
        per_year: Record<string, number>;
        total: number;
        percent_total: number;
    }[];
    totals_per_year: Record<string, number>;
}

export const apiClinicDashboardRepository: DashboardRepository = {
    async getSummary(scope?: DashboardScope): Promise<DashboardSummary> {
        const params: Record<string, string> = {};
        if (scope) params.scope = scope;

        const { data } = await apiClient.get<{ data: ApiSummary }>(
            '/clinic/dashboard',
            { params },
        );
        return toEntity(data.data);
    },

    async getOccupancyRate(params: {
        granularity: OccupancyGranularity;
        clinicUserId?: string;
    }): Promise<OccupancyRate> {
        const query: Record<string, string> = {
            granularity: params.granularity,
        };
        if (params.clinicUserId) query.clinic_user_id = params.clinicUserId;

        const { data } = await apiClient.get<{ data: ApiOccupancyRate }>(
            '/clinic/dashboard/occupancy-rate',
            { params: query },
        );
        return {
            clinicUserId: String(data.data.clinic_user_id),
            granularity: data.data.granularity,
            occupiedRate: data.data.occupied_rate,
            buckets: data.data.buckets,
        };
    },

    async getActivities(): Promise<Activity[]> {
        const { data } = await apiClient.get<{ data: { items: ApiActivity[] } }>(
            '/clinic/dashboard/activities',
        );
        return data.data.items.map((a) => ({
            id: String(a.id),
            type: a.type,
            description: a.description,
            actorName: a.actor_name ?? undefined,
            createdAt: a.created_at,
        }));
    },

    async getPatientAcquisition(
        scope?: DashboardScope,
    ): Promise<PatientAcquisition> {
        const params: Record<string, string> = {};
        if (scope) params.scope = scope;

        const { data } = await apiClient.get<{ data: ApiAcquisition }>(
            '/clinic/dashboard/patient-acquisition',
            { params },
        );
        return {
            years: data.data.years,
            sources: data.data.sources.map((s) => ({
                source: s.source,
                perYear: s.per_year,
                total: s.total,
                percentTotal: s.percent_total,
            })),
            totalsPerYear: data.data.totals_per_year,
        };
    },
};
