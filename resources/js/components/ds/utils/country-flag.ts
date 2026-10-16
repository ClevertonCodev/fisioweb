/**
 * Bandeira do país como emoji, a partir do código ISO 3166-1 alfa-2 ("br" → 🇧🇷).
 * No DS Vue a bandeira era uma imagem de um caminho que não existe no fisioweb;
 * o emoji não depende de asset nem de CDN.
 */
export function countryFlagEmoji(code: string): string {
    if (!/^[a-z]{2}$/i.test(code ?? '')) return '';

    return String.fromCodePoint(
        ...code
            .toUpperCase()
            .split('')
            .map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65),
    );
}
