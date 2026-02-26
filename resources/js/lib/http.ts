import axios from 'axios';

/**
 * Cliente HTTP configurado para o Laravel:
 * - Base URL relativa (mesma origem)
 * - Header X-Requested-With para o Laravel tratar como AJAX
 * - CSRF: lê o token do cookie XSRF-TOKEN e envia como X-XSRF-TOKEN
 *
 * Use este cliente em vez de fetch() para ações que não são navegação Inertia
 * (ex.: toggle favorito, buscas assíncronas). Para navegação/formulários de page,
 * prefira router.get(), router.post() e useForm() do Inertia.
 */
function getCsrfToken(): string | null {
    const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='));
    if (!match) return null;
    const value = match.split('=').slice(1).join('=').trim();
    return value ? decodeURIComponent(value) : null;
}

export const http = axios.create({
    baseURL: '',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

http.interceptors.request.use((config) => {
    const token = getCsrfToken();
    if (token) {
        config.headers.set('X-XSRF-TOKEN', token);
    }
    return config;
});
