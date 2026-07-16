import type {
    Appointment,
    Assessment,
    AssessmentSummary,
    AssessmentTemplate,
    AssessmentTemplateSummary,
    EvolutionTemplate,
    Exercise,
    FilterCategory,
    Patient,
    PatientEvolution,
    PatientFile,
    PatientQuestionnaire,
    Program,
} from '@/domain/clinic';
import type { PatientStatus } from '@/domain/clinic/patient';

/** DTO de escrita para criar paciente (application concern, camelCase) */
export interface PatientWriteDto {
    name: string;
    phone: string;
    birthDate: string;
    email: string;
    password: string;
    isForeign?: boolean;
    cpf?: string;
    apelido?: string;
    useApelido?: boolean;
    maritalStatus?: string;
    profession?: string;
    biologicalSex?: string;
    gender?: string;
    education?: string;
    status?: string;
    diagnosis?: string;
    address?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    insurance?: string;
    insuranceNumber?: string;
    referralSource?: string;
    isActive?: boolean;
}

/** DTO de atualização de paciente — sem senha (application concern, camelCase) */
export interface PatientUpdateDto {
    name?: string;
    phone?: string;
    birthDate?: string;
    email?: string;
    isForeign?: boolean;
    cpf?: string;
    apelido?: string;
    useApelido?: boolean;
    maritalStatus?: string;
    profession?: string;
    biologicalSex?: string;
    gender?: string;
    education?: string;
    status?: string;
    diagnosis?: string;
    address?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    insurance?: string;
    insuranceNumber?: string;
    referralSource?: string;
    isActive?: boolean;
}

export interface PatientListParams {
    page?: number;
    perPage?: number;
    search?: string;
    isActive?: boolean;
    statuses?: PatientStatus[];
    professionalIds?: string[];
    dateFrom?: string;
    dateTo?: string;
}

export interface PatientListResult {
    data: Patient[];
    total: number;
    lastPage: number;
    perPage: number;
    currentPage: number;
}

export interface PatientsRepository {
    list(params?: PatientListParams): Promise<PatientListResult>;
    getById(id: string): Promise<Patient | null>;
    getDetailById(
        id: string,
    ): Promise<import('@/domain/clinic/patient').PatientDetail | null>;
    create(dto: PatientWriteDto): Promise<Patient>;
    update(id: string, dto: PatientUpdateDto): Promise<Patient>;
    uploadPhoto(id: string, file: File): Promise<Patient>;
    deletePhoto(id: string): Promise<Patient>;
    bulkInactivate(ids: string[]): Promise<void>;
}

export interface ExerciseListParams {
    page?: number;
    perPage?: number;
}

export interface ExerciseListResult {
    items: Exercise[];
    total: number;
    lastPage: number;
    perPage: number;
    currentPage: number;
}

/** DTO de envio de exercício pela clínica (camelCase, application concern). */
export interface ExerciseSubmitDto {
    name: string;
    physioAreaId: number;
    difficultyLevel: 'easy' | 'medium' | 'hard';
    description?: string | null;
    videoId: number;
}

export interface ExercisesRepository {
    list(): Promise<Exercise[]>;
    listPaginated(params?: ExerciseListParams): Promise<ExerciseListResult>;
    getById(id: string): Promise<Exercise | null>;
    getFilterCategories(): Promise<FilterCategory[]>;
    toggleFavorite(id: string): Promise<{ isFavorite: boolean }>;
    submit(dto: ExerciseSubmitDto): Promise<Exercise>;
}

/** Parâmetros de listagem do calendário (camelCase, application concern). */
export interface AppointmentListParams {
    from?: string;
    to?: string;
    clinicUserId?: string;
    status?: string;
}

/** DTO de escrita para criar/editar consulta (camelCase). */
export interface AppointmentWriteDto {
    patientId: string;
    clinicUserId: string;
    title?: string | null;
    description?: string | null;
    location?: string | null;
    startsAt: string;
    endsAt: string;
}

export interface AppointmentsRepository {
    list(params?: AppointmentListParams): Promise<Appointment[]>;
    getClinicUsers(): Promise<{ id: string; name: string }[]>;
    getAgendaPatients(): Promise<{ id: string; name: string }[]>;
    create(dto: AppointmentWriteDto): Promise<Appointment>;
    update(id: string, dto: AppointmentWriteDto): Promise<Appointment>;
    updateStatus(
        id: string,
        status: import('@/domain/clinic').AppointmentStatus,
    ): Promise<Appointment>;
    cancel(id: string): Promise<Appointment>;
}

/** Estado de conexão Google Calendar do usuário autenticado (camelCase). */
export interface GoogleCalendarStatus {
    connected: boolean;
    googleCalendarId: string | null;
    connectedAt: string | null;
}

export interface GoogleCalendarRepository {
    getStatus(): Promise<GoogleCalendarStatus>;
    /** URL de consentimento OAuth para redirecionar o navegador. */
    getAuthUrl(): Promise<string>;
    disconnect(): Promise<void>;
}

export interface ProgramExerciseWriteDto {
    exerciseId: number;
    groupIndex: number | null;
    days: number[];
    period: 'morning' | 'afternoon' | 'night' | null;
    setsMin: number | null;
    setsMax: number | null;
    repetitionsMin?: number | null;
    repetitionsMax?: number | null;
    loadMin?: number | null;
    loadMax?: number | null;
    restTime?: number | null;
    notes?: string | null;
}

export interface ProgramWriteDto {
    title: string;
    patientId: number | null;
    message: string;
    startDate: string | null;
    endDate: string | null;
    /** 'active' quando enviado para um paciente; omitir para rascunho */
    status?: 'draft' | 'active';
    groups: { name: string; sortOrder: number }[];
    exercises: ProgramExerciseWriteDto[];
}

export interface ProgramListParams {
    page?: number;
    perPage?: number;
    search?: string;
    status?: string;
    withoutPatient?: boolean;
}

export interface ProgramListResult {
    items: Program[];
    total: number;
    lastPage: number;
    perPage: number;
    currentPage: number;
}

export interface ProgramsRepository {
    list(params?: ProgramListParams): Promise<ProgramListResult>;
    getById(id: string): Promise<Program | null>;
    create(dto: ProgramWriteDto): Promise<Program>;
    duplicate(id: string): Promise<Program>;
    toModel(id: string): Promise<Program>;
    update(id: string, dto: ProgramWriteDto): Promise<Program>;
    destroy(id: string): Promise<void>;
    /** PDF binário para abrir em nova aba (GET autenticado). */
    fetchPdfBlob(id: string): Promise<Blob>;
}

export interface AssessmentAnswerWriteDto {
    fieldId: number;
    value: string | null;
}

export interface AssessmentAnswerOptionWriteDto {
    fieldId: number;
    optionId: number;
}

export interface AssessmentWriteDto {
    templateId: number;
    answers: AssessmentAnswerWriteDto[];
    answerOptions: AssessmentAnswerOptionWriteDto[];
}

export interface AssessmentUpdateDto {
    answers: AssessmentAnswerWriteDto[];
    answerOptions: AssessmentAnswerOptionWriteDto[];
}

export interface AssessmentTemplateListResult {
    data: AssessmentTemplateSummary[];
    total: number;
    lastPage: number;
}

export interface AssessmentsRepository {
    listByPatient(patientId: string): Promise<AssessmentSummary[]>;
    find(id: string): Promise<Assessment>;
    create(patientId: string, dto: AssessmentWriteDto): Promise<Assessment>;
    update(id: string, dto: AssessmentUpdateDto): Promise<Assessment>;
    sign(id: string): Promise<Assessment>;
    destroy(id: string): Promise<void>;
    listTemplates(params?: {
        search?: string;
        page?: number;
        perPage?: number;
    }): Promise<AssessmentTemplateListResult>;
    findTemplate(id: string): Promise<AssessmentTemplate>;
}

export interface EvolutionWriteDto {
    title: string;
    evolutionTemplateId: number | null;
    checkedItemIds: number[];
    freeTextValues: { itemId: number; value: string }[];
    generatedText?: string | null;
    notes?: string | null;
}

export interface EvolutionTemplateItemWriteDto {
    label: string;
    printText: string;
    hasFreeText: boolean;
    freeTextPlaceholder: string | null;
    sortOrder: number;
}

export interface EvolutionTemplateSectionWriteDto {
    title: string;
    sortOrder: number;
    items: EvolutionTemplateItemWriteDto[];
}

export interface EvolutionTemplateWriteDto {
    name: string;
    description: string | null;
    isActive?: boolean;
    sections: EvolutionTemplateSectionWriteDto[];
}

export interface EvolutionsRepository {
    listByPatient(patientId: string): Promise<PatientEvolution[]>;
    find(id: string): Promise<PatientEvolution>;
    listTemplates(): Promise<EvolutionTemplate[]>;
    findTemplate(id: string): Promise<EvolutionTemplate>;
    createTemplate(dto: EvolutionTemplateWriteDto): Promise<EvolutionTemplate>;
    updateTemplate(
        id: string,
        dto: EvolutionTemplateWriteDto,
    ): Promise<EvolutionTemplate>;
    destroyTemplate(id: string): Promise<void>;
    create(
        patientId: string,
        dto: EvolutionWriteDto,
    ): Promise<PatientEvolution>;
    update(id: string, dto: EvolutionWriteDto): Promise<PatientEvolution>;
    sign(id: string): Promise<PatientEvolution>;
    destroy(id: string): Promise<void>;
    generateText(
        id: string,
        checkedItemIds: number[],
        freeTextValues: { itemId: number; value: string }[],
    ): Promise<{ generatedText: string }>;
    /** PDF binário para abrir em nova aba (GET autenticado). */
    fetchPdfBlob(id: string): Promise<Blob>;
}

export interface PatientFileStoreOptions {
    name?: string;
    onUploadProgress?: (percent: number) => void;
}

export interface PatientFilesRepository {
    listByPatient(patientId: string): Promise<PatientFile[]>;
    store(
        patientId: string,
        file: File,
        options?: PatientFileStoreOptions,
    ): Promise<PatientFile>;
    destroy(patientId: string, fileId: string): Promise<void>;
}

export type PatientQuestionnaireModality = 'presencial' | 'remoto';

export interface PatientQuestionnaireWriteDto {
    questionnaireTemplateId: number;
    modality: PatientQuestionnaireModality;
    expiresAt?: string | null;
}

export interface PatientQuestionnairesRepository {
    listByPatient(patientId: string): Promise<PatientQuestionnaire[]>;
    findById(
        patientId: string,
        questionnaireId: string,
    ): Promise<import('@/domain/clinic').PatientQuestionnaireDetail>;
    store(
        patientId: string,
        dto: PatientQuestionnaireWriteDto,
    ): Promise<PatientQuestionnaire>;
    destroy(patientId: string, questionnaireId: string): Promise<void>;
}

export interface QuestionnaireTemplateQuestionWriteDto {
    label: string;
    type: 'multiple_choice' | 'checkbox' | 'scale' | 'text';
    options: string[] | null;
    scaleMin: number;
    scaleMax: number;
    required: boolean;
}

export interface QuestionnaireTemplateSectionWriteDto {
    title: string;
    questions: QuestionnaireTemplateQuestionWriteDto[];
}

export interface QuestionnaireTemplateWriteDto {
    title: string;
    description: string | null;
    sections: QuestionnaireTemplateSectionWriteDto[];
}

export interface QuestionnaireTemplatesRepository {
    list(): Promise<import('@/domain/clinic').QuestionnaireTemplate[]>;
    findById(
        id: string,
    ): Promise<import('@/domain/clinic').QuestionnaireTemplate>;
    create(
        dto: QuestionnaireTemplateWriteDto,
    ): Promise<import('@/domain/clinic').QuestionnaireTemplate>;
    update(
        id: string,
        dto: QuestionnaireTemplateWriteDto,
    ): Promise<import('@/domain/clinic').QuestionnaireTemplate>;
    destroy(id: string): Promise<void>;
}

export interface ClinicUserWriteDto {
    name: string;
    email: string;
    password?: string;
    role: 'admin' | 'secretary' | 'physiotherapist';
    document: string;
    status?: number;
}

export interface ClinicUserUpdateDto {
    name?: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'secretary' | 'physiotherapist';
    document?: string;
    status?: number;
}

export interface ClinicUsersRepository {
    list(): Promise<import('@/domain/clinic/clinic-user').ClinicUserSummary[]>;
    listProfessionals(): Promise<{ id: string; name: string }[]>;
    getById(
        id: string,
    ): Promise<import('@/domain/clinic/clinic-user').ClinicUserSummary>;
    create(
        dto: ClinicUserWriteDto,
    ): Promise<import('@/domain/clinic/clinic-user').ClinicUserSummary>;
    update(
        id: string,
        dto: ClinicUserUpdateDto,
    ): Promise<import('@/domain/clinic/clinic-user').ClinicUserSummary>;
    uploadPhoto(
        id: string,
        file: File,
    ): Promise<import('@/domain/clinic/clinic-user').ClinicUserSummary>;
    deletePhoto(
        id: string,
    ): Promise<import('@/domain/clinic/clinic-user').ClinicUserSummary>;
    destroy(id: string): Promise<void>;
}

export interface ClinicProfileUpdateDto {
    name: string;
    typePerson: 'PF' | 'PJ';
    document: string;
    email: string;
    phone?: string | null;
    status: number;
    zipCode?: string | null;
    address?: string | null;
    number?: string | null;
    city?: string | null;
    state?: string | null;
}

export interface ClinicProfileRepository {
    get(): Promise<import('@/domain/clinic/clinic-profile').ClinicProfile>;
    update(
        dto: ClinicProfileUpdateDto,
    ): Promise<import('@/domain/clinic/clinic-profile').ClinicProfile>;
}

export interface DashboardRepository {
    getSummary(
        scope?: import('@/domain/clinic/dashboard').DashboardScope,
    ): Promise<import('@/domain/clinic/dashboard').DashboardSummary>;
    getOccupancyRate(params: {
        granularity: import('@/domain/clinic/dashboard').OccupancyGranularity;
        clinicUserId?: string;
    }): Promise<import('@/domain/clinic/dashboard').OccupancyRate>;
    getActivities(): Promise<import('@/domain/clinic/dashboard').Activity[]>;
    getPatientAcquisition(
        scope?: import('@/domain/clinic/dashboard').DashboardScope,
    ): Promise<import('@/domain/clinic/dashboard').PatientAcquisition>;
}
