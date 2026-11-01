import { describe, expect, it } from 'vitest';

import { checkAttachmentFiles } from '@/application/clinic/finance-attachment-rules';

const MB = 1024 * 1024;

function file(name: string, size = 1000, type = '') {
    const f = new File(['x'], name, { type });
    Object.defineProperty(f, 'size', { value: size });
    return f;
}

describe('checkAttachmentFiles', () => {
    it('aceita foto, HEIC sem tipo (iPhone) e PDF de até 10 MB', () => {
        const files = [
            file('recibo.pdf', 10 * MB, 'application/pdf'),
            file('IMG_0001.HEIC'),
            file('foto.webp', 200, 'image/webp'),
        ];
        expect(checkAttachmentFiles(files, 0)).toEqual({
            accepted: files,
            errors: [],
        });
    });

    it('recusa outro tipo e o que passa de 10 MB, com o nome do arquivo', () => {
        const ok = file('ok.png', 100, 'image/png');
        const result = checkAttachmentFiles(
            [
                file('planilha.xlsx', 100),
                file('grande.pdf', 10 * MB + 1, 'application/pdf'),
                ok,
            ],
            0,
        );
        expect(result.accepted).toEqual([ok]);
        expect(result.errors).toEqual([
            '“planilha.xlsx” não é JPG, PNG, WEBP, HEIC ou PDF.',
            '“grande.pdf” passa de 10 MB.',
        ]);
    });

    it('com 5 comprovantes, não aceita mais nenhum', () => {
        expect(checkAttachmentFiles([file('a.pdf')], 5)).toEqual({
            accepted: [],
            errors: [
                'Este lançamento já tem 5 comprovantes, o limite. Remova um para enviar outro.',
            ],
        });
    });

    it('mais arquivos do que cabe: não envia nenhum e diz quantos cabem', () => {
        expect(checkAttachmentFiles([file('a.pdf'), file('b.pdf')], 4)).toEqual(
            {
                accepted: [],
                errors: [
                    'Cada lançamento aceita até 5 comprovantes. Dá para enviar só mais 1.',
                ],
            },
        );
    });
});
