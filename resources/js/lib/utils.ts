import { InertiaLinkProps } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}


export function documentCleaner<T extends { document?: string }>( transform: (callback: (data: T) => T) => void, document: string): void {

    transform((form) => ({
        ...form,
        document: document.replace(/\D/g, ''),
    }));
    
}