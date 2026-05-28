/** Plano - contexto admin (entidade pura, camelCase, sem concerns de infra) */
export type BillingType = 'fixed' | 'per_user';

export interface Plan {
    id: number;
    name: string;
    billingType: BillingType;
    monthlyValue: number;
    annualValue: number;
}

export interface FeaturePlan {
    id: number;
    plan_id: number;
    feature_id: number;
    value: boolean;
    created_at: string;
    updated_at: string;
}
