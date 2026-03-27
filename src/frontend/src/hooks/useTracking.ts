

import { useEffect } from "react";
import { trackEvent } from "../tracking/tracker"

export function usePageTracking(pageName: string) {
    useEffect(() => {
        trackEvent("PAGE_VIEW", {page: pageName});
    }, [pageName]);
}