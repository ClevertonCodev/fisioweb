/** Erro 422 do Laravel: mensagens por campo e a mensagem geral. */
export interface ValidationErrors {
    fields: Record<string, string[]>;
    message?: string;
}

/** Lê o 422 de um erro do `apiClient` (axios); null quando não é 422. */
export function getValidationErrors(error: unknown): ValidationErrors | null {
    const response = (
        error as {
            response?: {
                status?: number;
                data?: { message?: string; errors?: Record<string, string[]> };
            };
        }
    )?.response;
    if (response?.status !== 422) return null;
    return {
        fields: response.data?.errors ?? {},
        message: response.data?.message,
    };
}
