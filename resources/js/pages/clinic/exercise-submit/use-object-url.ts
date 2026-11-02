import { useEffect, useState } from 'react';

/** URL de prévia de um arquivo local, revogada quando o arquivo muda. */
export function useObjectUrl(file: File | null): string | null {
    const [lastFile, setLastFile] = useState(file);
    const [url, setUrl] = useState<string | null>(() =>
        file ? URL.createObjectURL(file) : null,
    );
    if (lastFile !== file) {
        setLastFile(file);
        setUrl(file ? URL.createObjectURL(file) : null);
    }
    useEffect(() => {
        if (!url) return undefined;
        return () => URL.revokeObjectURL(url);
    }, [url]);
    return url;
}
