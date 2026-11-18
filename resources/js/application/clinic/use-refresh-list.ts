import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Renova as fotos de uma lista buscando a lista de novo: os pedidos de vários
 * itens ao mesmo tempo viram uma busca só, e o link novo chega pela própria lista.
 */
export function useRefreshList(prefix: string) {
    const queryClient = useQueryClient();

    return useCallback(async (): Promise<null> => {
        await queryClient.refetchQueries(
            { queryKey: [prefix], type: 'active' },
            { cancelRefetch: false },
        );
        return null;
    }, [prefix, queryClient]);
}
