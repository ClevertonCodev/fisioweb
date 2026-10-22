/** Alinhado a `PatientController::uploadPhoto`: jpeg, png, webp, max 2 MB. */

export const PATIENT_PHOTO_MAX_BYTES = 2 * 1024 * 1024;
/** A original pode ser maior: o recorte sai com 512px e bem menos de 2 MB. */
export const PATIENT_PHOTO_SOURCE_MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** Valores para o atributo `accept` do `<input type="file">`. */
export const PATIENT_PHOTO_INPUT_ACCEPT = 'image/jpeg,image/png,image/webp';

/** Motivo para recusar a foto que iria para a API (null = serve). */
export function getPatientPhotoValidationError(file: File): string | null {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return 'Use uma foto JPG, PNG ou WebP.';
    }
    if (file.size > PATIENT_PHOTO_MAX_BYTES) {
        return 'A foto pode ter até 2 MB.';
    }
    return null;
}

/** Motivo para recusar o arquivo original, antes do recorte. */
export function getPatientPhotoSourceError(file: File): string | null {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return 'Use uma foto JPG, PNG ou WebP.';
    }
    if (file.size > PATIENT_PHOTO_SOURCE_MAX_BYTES) {
        return 'A foto pode ter até 10 MB.';
    }
    return null;
}
