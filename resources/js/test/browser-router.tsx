import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

export const routerFutureFlags = {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
} as const;

export function TestBrowserRouter({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter future={routerFutureFlags}>{children}</BrowserRouter>
        </QueryClientProvider>
    );
}
