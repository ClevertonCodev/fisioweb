import axios from 'axios';
import { useState } from 'react';

interface CepResult {
    street: string;
    neighborhood: string;
    city: string;
    state: string;
}

interface UseCepLookupReturn {
    loading: boolean;
    lookup: (cep: string) => Promise<CepResult | null>;
}

const viaCepClient = axios.create({ baseURL: 'https://viacep.com.br/ws' });

export function useCepLookup(): UseCepLookupReturn {
    const [loading, setLoading] = useState(false);

    const lookup = async (cep: string): Promise<CepResult | null> => {
        const digits = cep.replace(/\D/g, '');
        if (digits.length !== 8) return null;

        setLoading(true);
        try {
            const { data } = await viaCepClient.get(`/${digits}/json/`);
            if (data.erro) return null;
            return {
                street: data.logradouro ?? '',
                neighborhood: data.bairro ?? '',
                city: data.localidade ?? '',
                state: data.uf ?? '',
            };
        } catch {
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { loading, lookup };
}
