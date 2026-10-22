import { describe, expect, it } from 'vitest';

import { getPatientPhotoValidationError } from '@/application/clinic/patient-photo-rules';

describe('getPatientPhotoValidationError', () => {
    it('recusa tipo que o backend não aceita', () => {
        expect(
            getPatientPhotoValidationError(
                new File(['x'], 'foto.gif', { type: 'image/gif' }),
            ),
        ).toBe('Use uma foto JPG, PNG ou WebP.');
    });

    it('recusa arquivo acima de 2 MB', () => {
        expect(
            getPatientPhotoValidationError(
                new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'grande.png', {
                    type: 'image/png',
                }),
            ),
        ).toBe('A foto pode ter até 2 MB.');
    });

    it('aceita jpeg, png e webp até 2 MB', () => {
        expect(
            getPatientPhotoValidationError(
                new File(['x'], 'ok.jpg', { type: 'image/jpeg' }),
            ),
        ).toBeNull();
    });
});
