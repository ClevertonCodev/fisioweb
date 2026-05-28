/** Funcionalidade - contexto admin */

export type FeatureType = 'bool' | 'int';

export interface Feature {
    id: number;
    key: string;
    name: string;
    valueIsolated: number | null;
    type: FeatureType;
}
