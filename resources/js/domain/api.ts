/** Corpo de erro padrão da API (Laravel validation / 404 / etc.) */
export interface ApiErrorBody {
    message?: string;
}

/** Formato do erro Axios quando a API retorna JSON (response.data) */
export interface ApiErrorResponse {
    response?: {
        data?: ApiErrorBody;
    };
}
