/** Alinhado a `ClinicUserController::uploadPhoto`: jpeg, png, webp, max 2 MB. */

export const CLINIC_USER_PHOTO_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** Valores para o atributo `accept` do `<input type="file">`. */
export const CLINIC_USER_PHOTO_INPUT_ACCEPT = 'image/jpeg,image/png,image/webp';

/** Motivo para recusar a foto antes de enviar (null = serve). */
export function getClinicUserPhotoValidationError(file: File): string | null {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return 'Use uma foto JPG, PNG ou WebP.';
    }
    if (file.size > CLINIC_USER_PHOTO_MAX_BYTES) {
        return 'A foto pode ter até 2 MB.';
    }
    return null;
}
