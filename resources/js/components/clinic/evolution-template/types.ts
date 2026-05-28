export interface DraftItem {
    _key: string;
    label: string;
    printText: string;
    hasFreeText: boolean;
    freeTextPlaceholder: string;
}

export interface DraftSection {
    _key: string;
    title: string;
    items: DraftItem[];
}
