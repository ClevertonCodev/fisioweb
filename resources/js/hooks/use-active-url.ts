import type { InertiaLinkProps } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

import { toUrl } from '@/lib/utils';

export function useActiveUrl() {
    const page = usePage();
    const currentUrlPath = new URL(page.url, window?.location.origin).pathname;

    function urlIsActive(
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        currentUrl?: string,
    ) {
        const urlToCompare = currentUrl ?? currentUrlPath;
        return toUrl(urlToCheck) === urlToCompare;
    }

    /** Active when pathname equals path or pathname starts with path + '/' (for sub-routes). */
    function urlIsActiveOrPrefix(
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        currentUrl?: string,
    ) {
        const path = toUrl(urlToCheck);
        const urlToCompare = currentUrl ?? currentUrlPath;
        return urlToCompare === path || urlToCompare.startsWith(path + '/');
    }

    return {
        currentUrl: currentUrlPath,
        urlIsActive,
        urlIsActiveOrPrefix,
    };
}
