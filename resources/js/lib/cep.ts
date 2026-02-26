import axios from 'axios';

type AddressType = {
    cep: string;
    cidade: string;
    uf: string;
    bairro: string;
    logradouro: string;
    complemento: string;
};

async function viacepGetAddressFromCEP(cep: string): Promise<AddressType | null> {
    try {
        const response = await axios.get(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`);
        const data = response.data as { erro?: boolean; cep: string; localidade: string; uf: string; bairro: string; logradouro: string; complemento: string };
        if (data.erro) {
            return null;
        }

        return {
            cep: data.cep,
            cidade: data.localidade.trim(),
            uf: data.uf.trim(),
            bairro: data.bairro.trim(),
            logradouro: data.logradouro.trim(),
            complemento: data.complemento.trim(),
        };
    } catch {
        return null;
    }
}

async function brasilApiGetAddressFromCEP(cep: string): Promise<AddressType | null> {
    try {
        const response = await axios.get(`https://brasilapi.com.br/api/cep/v1/${cep.replace('-', '')}`);
        const data = response.data as { erro?: boolean; city: string; state: string; neighborhood: string; street: string };
        if (data.erro) {
            return null;
        }

        return {
            cep: cep,
            cidade: data.city.trim(),
            uf: data.state.trim(),
            bairro: data.neighborhood.trim(),
            logradouro: data.street.trim(),
            complemento: '',
        };
    } catch {
        return null;
    }
}

export async function getAddressFromCEP(cep: string): Promise<AddressType | null> {
    const response = await viacepGetAddressFromCEP(cep);
    if (response !== null) {
        return response;
    }

    return await brasilApiGetAddressFromCEP(cep);
}
