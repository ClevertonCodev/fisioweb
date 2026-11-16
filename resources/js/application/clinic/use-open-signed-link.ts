import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';

interface OpenSignedLinkVariables {
    id: string;
    tab: Window | null;
}

/**
 * Abre um link assinado numa aba nova. A aba abre no clique, fora do
 * mutationFn: o TanStack só chama o mutationFn depois de um await, e o
 * navegador do celular bloqueia como pop-up o que abre fora do clique. Com
 * `networkMode: 'always'` o pedido não fica pausado sem rede, deixando a aba
 * em branco; ele falha e a aba fecha.
 */
export function useOpenSignedLink(
    fetchLink: (id: string) => Promise<{ url: string }>,
    errorMessage: string,
) {
    const { mutate, isPending } = useMutation({
        networkMode: 'always',
        mutationFn: async ({ id, tab }: OpenSignedLinkVariables) => {
            try {
                const link = await fetchLink(id);
                if (tab) {
                    tab.opener = null;
                    tab.location.href = link.url;
                } else window.location.assign(link.url);
                return link;
            } catch (error) {
                tab?.close();
                throw error;
            }
        },
        onError: () => toast.error(errorMessage),
    });

    const open = useCallback(
        (id: string) => mutate({ id, tab: window.open('', '_blank') }),
        [mutate],
    );

    return { open, isPending };
}
