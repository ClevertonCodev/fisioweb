/** Alinhado a `StorePatientFileRequest`: jpeg, png, pdf, docx, max 20 MB. */

export const PATIENT_FILE_MAX_BYTES = 20 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'pdf', 'docx']);

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

/** Valores para o atributo `accept` do `<input type="file">`. */
export const PATIENT_FILE_INPUT_ACCEPT =
    '.jpg,.jpeg,.png,.pdf,.docx,image/jpeg,image/png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const PATIENT_FILE_ACCEPT_LABEL = 'JPEG, PNG, PDF e DOCX';

function fileExtension(name: string): string {
    const i = name.lastIndexOf('.');
    return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

export function isPatientFileAllowed(file: File): boolean {
    return getPatientFileValidationError(file) === null;
}

export function getPatientFileValidationError(file: File): string | null {
    if (file.size > PATIENT_FILE_MAX_BYTES) {
        return 'O arquivo não pode ultrapassar 20 MB.';
    }
    const ext = fileExtension(file.name);
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
        return 'Tipos permitidos: JPEG, PNG, PDF e DOCX.';
    }
    if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
        return 'Tipos permitidos: JPEG, PNG, PDF e DOCX.';
    }
    return null;
}
