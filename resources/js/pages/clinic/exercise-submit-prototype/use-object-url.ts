/** PROTÓTIPO (descartável): URL de prévia de um arquivo local. */
import { useEffect, useState } from 'react';

/** URL de prévia de um arquivo, revogada quando o arquivo muda. */
export function useObjectUrl(file: File | null): string | null {
    // Ajuste durante o render: a URL acompanha o arquivo.
    const [lastFile, setLastFile] = useState(file);
    const [url, setUrl] = useState<string | null>(() =>
        file ? URL.createObjectURL(file) : null,
    );
    if (lastFile !== file) {
        setLastFile(file);
        setUrl(file ? URL.createObjectURL(file) : null);
    }
    // Revoga o blob quando ele deixa de ser exibido.
    useEffect(() => {
        if (!url) return undefined;
        return () => URL.revokeObjectURL(url);
    }, [url]);
    return url;
}
